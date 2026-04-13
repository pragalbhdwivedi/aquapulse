import { describe, expect, it } from "vitest";
import { HealthController } from "../src/health.controller";

describe("HealthController", () => {
  it("returns a basic scaffold health payload", () => {
    const controller = new HealthController();

    expect(controller.health()).toMatchObject({
      status: "ok",
      service: "api"
    });
  });
});
