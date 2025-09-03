
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

// operations/delete-insight.test.ts
import { expect } from "jsr:@std/expect";
import { beforeAll, describe, it } from "jsr:@std/testing/bdd";
import type { Insight } from "$models/insight.ts";
import { withDB } from "../testing.ts";
import deleteInsight from "./delete-insight.ts";

describe("deleting insights from the database", () => {
  describe("insight does not exist", () => {
    withDB((fixture) => {
      let result: ReturnType<typeof deleteInsight>;

      beforeAll(() => {
        result = deleteInsight({ ...fixture, id: 999 });
      });

      it("returns failure with not found flag", () => {
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.notFound).toBe(true);
          expect(result.error).toBe("Insight not found");
        }
      });
    });
  });

  describe("insight exists", () => {
    withDB((fixture) => {
      const insights: Insight[] = [
        { id: 1, brand: 0, createdAt: new Date(), text: "1" },
        { id: 2, brand: 0, createdAt: new Date(), text: "2" },
        { id: 3, brand: 1, createdAt: new Date(), text: "3" },
      ];

      let result: ReturnType<typeof deleteInsight>;

      beforeAll(() => {
        fixture.insights.insert(
          insights.map((it) => ({
            ...it,
            createdAt: it.createdAt.toISOString(),
          })),
        );
        result = deleteInsight({ ...fixture, id: 2 });
      });

      it("returns success", () => {
        expect(result.success).toBe(true);
      });

      it("removes the insight from database", () => {
        const remainingInsights = fixture.insights.selectAll();
        expect(remainingInsights).toHaveLength(2);
        expect(remainingInsights.find((i) => i.id === 2)).toBeUndefined();
      });

      it("leaves other insights intact", () => {
        const remainingInsights = fixture.insights.selectAll();
        expect(remainingInsights.find((i) => i.id === 1)).toBeDefined();
        expect(remainingInsights.find((i) => i.id === 3)).toBeDefined();
      });
    });
  });
});
