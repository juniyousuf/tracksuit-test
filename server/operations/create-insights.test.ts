import { expect } from "jsr:@std/expect";
import { beforeAll, describe, it } from "jsr:@std/testing/bdd";
import type { Insight } from "$models/insight.ts";
import { withDB } from "../testing.ts";
import createInsight from "./create-insight.ts";

describe("creating insights in the database", () => {
  describe("valid input", () => {
    withDB((fixture) => {
      let result: ReturnType<typeof createInsight>;

      beforeAll(() => {
        result = createInsight({
          ...fixture,
          data: {
            brand: 1,
            text: "This is a test insight",
          },
        });
      });

      it("returns success", () => {
        expect(result.success).toBe(true);
      });

      it("returns the created insight", () => {
        if (result.success) {
          expect(result.data.brand).toBe(1);
          expect(result.data.text).toBe("This is a test insight");
          expect(result.data.id).toBeGreaterThan(0);
          expect(result.data.createdAt).toBeInstanceOf(Date);
        }
      });

      it("insight is actually in the database", () => {
        const insights = fixture.insights.selectAll();
        expect(insights).toHaveLength(1);
        expect(insights[0].brand).toBe(1);
        expect(insights[0].text).toBe("This is a test insight");
      });
    });
  });

  describe("invalid input", () => {
    withDB((fixture) => {
      it("rejects negative brand", () => {
        const result = createInsight({
          ...fixture,
          data: { brand: -1, text: "test" },
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain(
            "Brand must be a non-negative integer",
          );
        }
      });

      it("rejects empty text", () => {
        const result = createInsight({
          ...fixture,
          data: { brand: 1, text: "" },
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Text cannot be empty");
        }
      });

      it("rejects missing fields", () => {
        const result = createInsight({
          ...fixture,
          data: { brand: 1 },
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
