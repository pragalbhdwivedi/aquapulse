export class CreatePondDto {
  name!: string;
  code!: string;
  farmId!: string;
  kind!: "pond" | "tank" | "cage";
}
