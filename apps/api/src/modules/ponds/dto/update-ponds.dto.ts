export class UpdatePondsDto {
  name?: string;
  code?: string;
  farmId?: string;
  kind?: "pond" | "tank" | "cage";
  status?: "active" | "maintenance" | "inactive";
}
