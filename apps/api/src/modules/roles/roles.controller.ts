import { Controller, Get } from "@nestjs/common";
import { RolesService } from "./roles.service";

@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  getPlaceholder() {
    return this.rolesService.getPlaceholder();
  }
}
