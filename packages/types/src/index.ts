export type ServiceName = "web" | "api" | "worker";

export interface HealthStatus {
  status: "ok" | "degraded" | "down";
  service: ServiceName;
  message: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}
