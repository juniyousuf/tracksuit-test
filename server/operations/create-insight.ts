import { z } from "zod";
import type { Insight } from "$models/insight.ts";
import type { HasDBClient } from "../shared.ts";
import * as insightsTable from "$tables/insights.ts";

// Input validation schema
const CreateInsightInput = z.object({
  brand: z.number().int().min(0, "Brand must be a non-negative integer"),
  text: z.string().min(1, "Text cannot be empty").max(1000, "Text too long"),
});

type CreateInsightData = z.infer<typeof CreateInsightInput>;

type Input = HasDBClient & {
  data: unknown;
};

type Result =
  | { success: true; data: Insight }
  | { success: false; error: string };

export default (input: Input): Result => {
  console.log("Creating new insight");

  try {
    // Validate input data
    const validatedData = CreateInsightInput.parse(input.data);

    const insertData: insightsTable.Insert = {
      brand: validatedData.brand,
      text: validatedData.text,
      createdAt: new Date().toISOString(),
    };

    console.log("Inserting insight:", insertData);

    // Insert the insight using prepared statement for safety
    input.db
      .sql`INSERT INTO insights (brand, createdAt, text) VALUES (${insertData.brand}, ${insertData.createdAt}, ${insertData.text})`;

    // Get the inserted record
    const [insertedRow] = input.db.sql<
      insightsTable.Row
    >`SELECT * FROM insights WHERE rowid = last_insert_rowid()`;

    if (!insertedRow) {
      console.error("Failed to retrieve inserted insight");
      return { success: false, error: "Failed to create insight" };
    }

    const result: Insight = {
      ...insertedRow,
      createdAt: new Date(insertedRow.createdAt),
    };

    console.log("Insight created successfully:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating insight:", error);

    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) =>
        `${e.path.join(".")}: ${e.message}`
      ).join(", ");
      return { success: false, error: `Validation error: ${errorMessage}` };
    }

    return { success: false, error: "Failed to create insight" };
  }
};
