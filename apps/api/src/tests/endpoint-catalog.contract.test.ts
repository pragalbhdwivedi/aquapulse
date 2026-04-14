import { RequestMethod } from "@nestjs/common";
import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { aquaPulseEndpointCatalog } from "@aquapulse/types";
import { describe, expect, it } from "vitest";
import { AiController } from "../modules/ai/ai.controller";
import { AlertsController } from "../modules/alerts/alerts.controller";
import { AttachmentsController } from "../modules/attachments/attachments.controller";
import { AuditController } from "../modules/audit/audit.controller";
import { BatchesController } from "../modules/batches/batches.controller";
import { FeedController } from "../modules/feed/feed.controller";
import { PondsController } from "../modules/ponds/ponds.controller";
import { TasksController } from "../modules/tasks/tasks.controller";
import { WaterQualityController } from "../modules/water-quality/water-quality.controller";

function getHandlerContract(controllerClass: object, handlerName: string) {
  const controllerPath = Reflect.getMetadata(PATH_METADATA, controllerClass) as string;
  const handler = (controllerClass as { prototype: Record<string, unknown> }).prototype[
    handlerName
  ] as object;
  const handlerPath = Reflect.getMetadata(PATH_METADATA, handler) as string | undefined;
  const method = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod;

  const normalizedSegments = ["api", controllerPath, handlerPath]
    .filter((segment): segment is string => typeof segment === "string" && segment.length > 0)
    .map((segment) => segment.replace(/^\/+|\/+$/g, ""))
    .filter((segment) => segment.length > 0);
  const path = `/${normalizedSegments.join("/")}`;

  return {
    method: RequestMethod[method] as "GET" | "POST" | "PATCH",
    path
  };
}

describe("Endpoint catalog parity", () => {
  it("matches core controller route metadata for list/detail/create/update handlers", () => {
    expect(getHandlerContract(PondsController, "list")).toEqual({
      method: aquaPulseEndpointCatalog.ponds.list.method,
      path: aquaPulseEndpointCatalog.ponds.list.path
    });
    expect(getHandlerContract(PondsController, "getById")).toEqual({
      method: aquaPulseEndpointCatalog.ponds.getById.method,
      path: aquaPulseEndpointCatalog.ponds.getById.path
    });
    expect(getHandlerContract(AlertsController, "create")).toEqual({
      method: aquaPulseEndpointCatalog.alerts.create.method,
      path: aquaPulseEndpointCatalog.alerts.create.path
    });
    expect(getHandlerContract(TasksController, "update")).toEqual({
      method: aquaPulseEndpointCatalog.tasks.update.method,
      path: aquaPulseEndpointCatalog.tasks.update.path
    });
    expect(getHandlerContract(AttachmentsController, "list")).toEqual({
      method: aquaPulseEndpointCatalog.attachments.list.method,
      path: aquaPulseEndpointCatalog.attachments.list.path
    });
    expect(getHandlerContract(BatchesController, "getById")).toEqual({
      method: aquaPulseEndpointCatalog.batches.getById.method,
      path: aquaPulseEndpointCatalog.batches.getById.path
    });
    expect(getHandlerContract(FeedController, "create")).toEqual({
      method: aquaPulseEndpointCatalog.feed.create.method,
      path: aquaPulseEndpointCatalog.feed.create.path
    });
    expect(getHandlerContract(AuditController, "list")).toEqual({
      method: aquaPulseEndpointCatalog.audit.list.method,
      path: aquaPulseEndpointCatalog.audit.list.path
    });
    expect(getHandlerContract(WaterQualityController, "getById")).toEqual({
      method: aquaPulseEndpointCatalog.waterQuality.getById.method,
      path: aquaPulseEndpointCatalog.waterQuality.getById.path
    });
  });

  it("matches AI specialized endpoint metadata", () => {
    expect(getHandlerContract(AiController, "list")).toEqual({
      method: aquaPulseEndpointCatalog.ai.list.method,
      path: aquaPulseEndpointCatalog.ai.list.path
    });
    expect(getHandlerContract(AiController, "explainAlert")).toEqual({
      method: aquaPulseEndpointCatalog.ai.explainAlert.method,
      path: aquaPulseEndpointCatalog.ai.explainAlert.path
    });
    expect(getHandlerContract(AiController, "summarizePond")).toEqual({
      method: aquaPulseEndpointCatalog.ai.summarizePond.method,
      path: aquaPulseEndpointCatalog.ai.summarizePond.path
    });
    expect(getHandlerContract(AiController, "generateHandover")).toEqual({
      method: aquaPulseEndpointCatalog.ai.generateHandover.method,
      path: aquaPulseEndpointCatalog.ai.generateHandover.path
    });
    expect(getHandlerContract(AiController, "rewriteText")).toEqual({
      method: aquaPulseEndpointCatalog.ai.rewriteText.method,
      path: aquaPulseEndpointCatalog.ai.rewriteText.path
    });
    expect(getHandlerContract(AiController, "queryDashboard")).toEqual({
      method: aquaPulseEndpointCatalog.ai.queryDashboard.method,
      path: aquaPulseEndpointCatalog.ai.queryDashboard.path
    });
    expect(getHandlerContract(AiController, "draftIncident")).toEqual({
      method: aquaPulseEndpointCatalog.ai.draftIncident.method,
      path: aquaPulseEndpointCatalog.ai.draftIncident.path
    });
  });
});
