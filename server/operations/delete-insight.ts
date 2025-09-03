// operations/delete-insight.ts
import type { HasDBClient } from "../shared.ts";
import lookupInsight from "../operations/delete-insight.ts";

type Input = HasDBClient & {
  id: number;
};

type Result = 
  | { success: true }
  | { success: false; error: string; notFound?: boolean };

export default (input: Input): Result => {
  console.log(`Deleting insight with id=${input.id}`);

  try {
    // First check if the insight exists
    const existingInsight = lookupInsight({ db: input.db, id: input.id });
    
    if (!existingInsight) {
      console.log("Insight not found for deletion");
      return { success: false, error: "Insight not found", notFound: true };
    }

    console.log("Found insight to delete:", existingInsight);

    // Delete the insight using prepared statement
    const result = input.db.sql`DELETE FROM insights WHERE id = ${input.id}`;
    
    // Check if any rows were affected
    if (result.changes === 0) {
      console.log("No rows were deleted");
      return { success: false, error: "Failed to delete insight" };
    }

    console.log(`Successfully deleted insight with id=${input.id}`);
    return { success: true };

  } catch (error) {
    console.error("Error deleting insight:", error);
    return { success: false, error: "Failed to delete insight" };
  }
};