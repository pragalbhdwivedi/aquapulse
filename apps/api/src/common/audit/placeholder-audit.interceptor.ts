import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Observable } from "rxjs";
import { extractRequestMetadata } from "../request-metadata";

@Injectable()
export class PlaceholderAuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    // TODO: Forward request metadata into the real audit pipeline once persistence exists.
    void extractRequestMetadata(request);

    return next.handle();
  }
}
