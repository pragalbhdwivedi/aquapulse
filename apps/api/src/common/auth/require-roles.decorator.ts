import { SetMetadata } from "@nestjs/common";

export const AUTH_ROLE_METADATA_KEY = "aquapulse.auth.required_roles";

export function RequireRoles(...roles: string[]) {
  return SetMetadata(AUTH_ROLE_METADATA_KEY, roles);
}
