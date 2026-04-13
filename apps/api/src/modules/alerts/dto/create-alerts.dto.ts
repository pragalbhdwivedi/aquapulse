export class CreateAlertDto {
  title!: string;
  severity!: "low" | "medium" | "high" | "critical";
  source!: string;
  pondId?: string;
}
