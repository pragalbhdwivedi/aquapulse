import { describe, expect, it } from "vitest";
import { envSchema } from "./index";

describe("envSchema", () => {
  it("parses minimum environment values", () => {
    const parsed = envSchema.parse({});

    expect(parsed.NODE_ENV).toBe("development");
  });
});
