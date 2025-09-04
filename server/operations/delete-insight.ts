import type { HasDBClient } from "../shared.ts";
import lookupInsight from "./lookup-insight.ts";

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

    // Delete using exec method to get changes info
    const result = input.db.exec(`DELETE FROM insights WHERE id = ${input.id}`);

    // Note: exec doesn't return changes count, so we verify by checking if record still exists
    const stillExists = lookupInsight({ db: input.db, id: input.id });

    if (stillExists) {
      console.log("Deletion failed - record still exists");
      return { success: false, error: "Failed to delete insight" };
    }

    console.log(`Successfully deleted insight with id=${input.id}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting insight:", error);
    return { success: false, error: "Failed to delete insight" };
  }
};
