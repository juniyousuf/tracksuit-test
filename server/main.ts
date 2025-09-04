// main.ts - Complete backend implementation
// deno-lint-ignore-file no-explicit-any
import { Database } from "@db/sqlite";
import * as oak from "@oak/oak";
import * as path from "@std/path";
import * as insightsTable from "$tables/insights.ts";
import { Port } from "../lib/utils/index.ts";
import listInsights from "./operations/list-insights.ts";
import lookupInsight from "./operations/lookup-insight.ts";
import createInsight from "./operations/create-insight.ts";
import deleteInsight from "./operations/delete-insight.ts";

console.log("Loading configuration");

const env = {
  port: Port.parse(Deno.env.get("SERVER_PORT")),
};

const dbFilePath = path.resolve("tmp", "db.sqlite3");

console.log(`Opening SQLite database at ${dbFilePath}`);

await Deno.mkdir(path.dirname(dbFilePath), { recursive: true });
const db = new Database(dbFilePath);

// Initialize database tables
try {
  db.exec(insightsTable.createTable);
  console.log("Database tables initialized");
} catch (error) {
  // Table might already exist with IF NOT EXISTS
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.log("Database tables already exist:", errorMessage);
}

console.log("Initialising server");

const router = new oak.Router();

// CORS middleware for frontend integration
router.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 200;
    return;
  }

  await next();
});

// Health check
router.get("/_health", (ctx) => {
  ctx.response.body = "OK";
  ctx.response.status = 200;
});

// List all insights
router.get("/insights", (ctx) => {
  try {
    const result = listInsights({ db });
    ctx.response.body = result;
    ctx.response.status = 200;
  } catch (error) {
    console.error("Error listing insights:", error);
    ctx.response.body = { error: "Failed to list insights" };
    ctx.response.status = 500;
  }
});

// Get specific insight
router.get("/insights/:id", (ctx) => {
  try {
    const params = ctx.params as Record<string, any>;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      ctx.response.body = { error: "Invalid ID parameter" };
      ctx.response.status = 400;
      return;
    }

    const result = lookupInsight({ db, id });

    if (result) {
      ctx.response.body = result;
      ctx.response.status = 200;
    } else {
      ctx.response.body = { error: "Insight not found" };
      ctx.response.status = 404;
    }
  } catch (error) {
    console.error("Error looking up insight:", error);
    ctx.response.body = { error: "Failed to lookup insight" };
    ctx.response.status = 500;
  }
});

// Create new insight
router.post("/insights", async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    const result = createInsight({ db, data: body });

    if (result.success) {
      ctx.response.body = result.data;
      ctx.response.status = 201;
    } else {
      ctx.response.body = { error: result.error };
      ctx.response.status = 400;
    }
  } catch (error) {
    console.error("Error creating insight:", error);
    ctx.response.body = { error: "Failed to create insight" };
    ctx.response.status = 500;
  }
});

// Delete insight
router.delete("/insights/:id", (ctx) => {
  try {
    const params = ctx.params as Record<string, any>;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      ctx.response.body = { error: "Invalid ID parameter" };
      ctx.response.status = 400;
      return;
    }

    const result = deleteInsight({ db, id });

    if (result.success) {
      ctx.response.body = { message: "Insight deleted successfully" };
      ctx.response.status = 200;
    } else {
      ctx.response.body = { error: result.error };
      ctx.response.status = result.notFound ? 404 : 500;
    }
  } catch (error) {
    console.error("Error deleting insight:", error);
    ctx.response.body = { error: "Failed to delete insight" };
    ctx.response.status = 500;
  }
});

const app = new oak.Application();

app.use(router.routes());
app.use(router.allowedMethods());

// Graceful shutdown
const controller = new AbortController();

const shutdown = () => {
  console.log("\nShutting down gracefully...");
  try {
    db.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error closing database:", error);
  }
  controller.abort();
};

Deno.addSignalListener("SIGINT", shutdown);
Deno.addSignalListener("SIGTERM", shutdown);

console.log(`Starting server on port ${env.port}`);
try {
  await app.listen({ ...env, signal: controller.signal });
} catch (error) {
  if (!controller.signal.aborted) {
    console.error("Server error:", error);
  }
}
