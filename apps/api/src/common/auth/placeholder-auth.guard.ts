import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class PlaceholderAuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext) {
    return true;
  }
}
