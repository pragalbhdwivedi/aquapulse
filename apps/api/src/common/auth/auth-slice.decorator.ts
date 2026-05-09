import { SetMetadata } from "@nestjs/common";

export const AUTH_REQUIRED_METADATA_KEY = "aquapulse.auth.required";

export function RequireAuthentication() {
  return SetMetadata(AUTH_REQUIRED_METADATA_KEY, true);
}
