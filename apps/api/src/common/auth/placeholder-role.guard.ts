import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class PlaceholderRoleGuard implements CanActivate {
  canActivate(_context: ExecutionContext) {
    return true;
  }
}
