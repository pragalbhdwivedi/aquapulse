import type { EndpointContract, EndpointRequest, EndpointResponse } from "@aquapulse/types";

export function adaptEndpointRequest<TEndpoint extends EndpointContract<unknown, unknown>, TInput>(
  _endpoint: TEndpoint,
  input: TInput,
  mapper: (input: TInput) => EndpointRequest<TEndpoint>
): EndpointRequest<TEndpoint> {
  return mapper(input);
}

export function adaptEndpointPathParams<
  TEndpoint extends EndpointContract<unknown, unknown>,
  TInput
>(
  _endpoint: TEndpoint,
  input: TInput,
  mapper: (input: TInput) => EndpointRequest<TEndpoint>
): EndpointRequest<TEndpoint> {
  return mapper(input);
}

export function adaptEndpointResponse<TEndpoint extends EndpointContract<unknown, unknown>, TData>(
  _endpoint: TEndpoint,
  data: TData,
  mapper: (data: TData) => EndpointResponse<TEndpoint>
): EndpointResponse<TEndpoint> {
  return mapper(data);
}
