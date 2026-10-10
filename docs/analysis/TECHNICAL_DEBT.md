# Technical debt affecting expansion

- Existing runtime adapter selection and web proxies are complex and bounded by domain.
- Existing auth can fall back from incomplete Keycloak configuration to disabled mode. New production routes must fail closed independently.
- Historical documentation overstates or understates supporting-module persistence at different commits.
- The worker and shared AI packages are placeholders; durable ERP job processing needs implementation, not an assumed worker.
- Some legacy routes require additional authorization review before a combined production release.
