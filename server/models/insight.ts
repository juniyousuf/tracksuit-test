// tables/insights.ts - Updated with better security
export const createTable = `
  CREATE TABLE IF NOT EXISTS insights (
    id INTEGER PRIMARY KEY ASC NOT NULL,
    brand INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    text TEXT NOT NULL
  )
`;

export type Row = {
  id: number;
  brand: number;
  createdAt: string;
  text: string;
};

export type Insert = {
  brand: number;
  createdAt: string;
  text: string;
};

// DEPRECATED: This function has SQL injection vulnerability
// Use prepared statements from create-insight.ts instead
// Leaving it as is for interview chat
export const insertStatement = (item: Insert) => {
  // Basic escaping for backwards compatibility only
  const escapedText = item.text.replace(/'/g, "''");
  return `INSERT INTO insights (brand, createdAt, text) VALUES (${item.brand}, '${item.createdAt}', '${escapedText}')`;
};

// Helper function to validate database row
export const validateRow = (row: unknown): row is Row => {
  return (
    typeof row === "object" &&
    row !== null &&
    typeof (row as any).id === "number" &&
    typeof (row as any).brand === "number" &&
    typeof (row as any).createdAt === "string" &&
    typeof (row as any).text === "string"
  );
};
