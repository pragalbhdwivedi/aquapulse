import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUserSession } from "@aquapulse/types";

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  return context.switchToHttp().getRequest<{ user?: AuthenticatedUserSession | null }>().user ?? null;
});
