import type { AquaPulseApiClients } from "./index";
import {
  createClientsFromEndpointHandlers,
  createEndpointHandlersFromClients
} from "./endpoint-runtime";

export function createHttpPlaceholderEndpointHandlers(clients: AquaPulseApiClients) {
  return createEndpointHandlersFromClients(clients);
}

export function createHttpPlaceholderClients(clients: AquaPulseApiClients): AquaPulseApiClients {
  return createClientsFromEndpointHandlers(createHttpPlaceholderEndpointHandlers(clients));
}
