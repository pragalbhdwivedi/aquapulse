type ApplicationResult<TData> = {
  readonly data: TData;
};

export async function delegateCreate<TInput, TMappedInput, TData, TResponse>(
  input: TInput,
  mapInput: (input: TInput) => TMappedInput,
  execute: (mappedInput: TMappedInput) => Promise<ApplicationResult<TData>>,
  mapResponse: (data: TData) => TResponse
): Promise<TResponse> {
  const result = await execute(mapInput(input));
  return mapResponse(result.data);
}

export async function delegateList<TInput, TMappedInput, TData, TResponse>(
  input: TInput,
  mapInput: (input: TInput) => TMappedInput,
  execute: (mappedInput: TMappedInput) => Promise<ApplicationResult<TData>>,
  mapResponse: (data: TData) => TResponse
): Promise<TResponse> {
  const result = await execute(mapInput(input));
  return mapResponse(result.data);
}

export async function delegateUpdate<TInput, TMappedInput, TData, TResponse>(
  id: string,
  input: TInput,
  mapInput: (input: TInput) => TMappedInput,
  execute: (id: string, mappedInput: TMappedInput) => Promise<ApplicationResult<TData>>,
  mapResponse: (data: TData) => TResponse
): Promise<TResponse> {
  const result = await execute(id, mapInput(input));
  return mapResponse(result.data);
}

export async function delegateGetById<TData, TResponse>(
  id: string,
  execute: (id: string) => Promise<ApplicationResult<TData>>,
  mapResponse: (data: TData) => TResponse
): Promise<TResponse> {
  const result = await execute(id);
  return mapResponse(result.data);
}

export async function delegateAction<TInput, TMappedInput, TData, TResponse>(
  input: TInput,
  mapInput: (input: TInput) => TMappedInput,
  execute: (mappedInput: TMappedInput) => Promise<ApplicationResult<TData>>,
  mapResponse: (data: TData) => TResponse
): Promise<TResponse> {
  const result = await execute(mapInput(input));
  return mapResponse(result.data);
}
