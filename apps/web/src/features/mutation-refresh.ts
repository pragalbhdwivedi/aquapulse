import type { SubmissionValidationError } from "./form-submission";

interface SafeParseSchema<TInput> {
  safeParse(input: unknown):
    | {
        success: true;
        data: TInput;
      }
    | {
        success: false;
        error: {
          flatten(): {
            fieldErrors: Partial<Record<Extract<keyof TInput, string>, string[] | undefined>>;
          };
        };
      };
}

export interface MutationSuccess<TData, TList = never, TDetail = never> {
  readonly status: "success";
  readonly data: TData;
  readonly refreshedList?: TList;
  readonly refreshedDetail?: TDetail;
}

export type MutationSubmissionResult<
  TData,
  TFields extends string,
  TList = never,
  TDetail = never
> = SubmissionValidationError<TFields> | MutationSuccess<TData, TList, TDetail>;

export interface MutationPageState<
  TData,
  TFields extends string,
  TList = never,
  TDetail = never
> {
  readonly status: "idle" | "submitting" | "validation_error" | "success";
  readonly isSubmitting: boolean;
  readonly fieldErrors: Partial<Record<TFields, string>>;
  readonly data?: TData;
  readonly refreshedList?: TList;
  readonly refreshedDetail?: TDetail;
}

function createValidationError<TInput extends object>(
  fieldErrors: Partial<Record<Extract<keyof TInput, string>, string[] | undefined>>,
  fields: readonly (keyof TInput)[]
): SubmissionValidationError<Extract<keyof TInput, string>> {
  return {
    status: "validation_error",
    fieldErrors: Object.fromEntries(
      fields
        .map((field) => [field, fieldErrors[field]?.[0]])
        .filter(([, value]) => value)
    ) as Partial<Record<Extract<keyof TInput, string>, string>>
  };
}

export function createMutationSubmitter<
  TInput extends object,
  TData,
  TList = never,
  TDetail = never
>({
  schema,
  fields,
  submit,
  refreshList,
  refreshDetail
}: {
  readonly schema: SafeParseSchema<TInput>;
  readonly fields: readonly (keyof TInput)[];
  readonly submit: (input: TInput) => Promise<TData>;
  readonly refreshList?: (input: TInput, data: TData) => Promise<TList>;
  readonly refreshDetail?: (input: TInput, data: TData) => Promise<TDetail>;
}) {
  return async (
    input: TInput
  ): Promise<MutationSubmissionResult<TData, Extract<keyof TInput, string>, TList, TDetail>> => {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return createValidationError(parsed.error.flatten().fieldErrors, fields);
    }

    const data = await submit(parsed.data);
    const [refreshedList, refreshedDetail] = await Promise.all([
      refreshList ? refreshList(parsed.data, data) : Promise.resolve(undefined as TList | undefined),
      refreshDetail ? refreshDetail(parsed.data, data) : Promise.resolve(undefined as TDetail | undefined)
    ]);

    return {
      status: "success",
      data,
      refreshedList,
      refreshedDetail
    };
  };
}

export function toMutationPageState<
  TData,
  TFields extends string,
  TList = never,
  TDetail = never
>(
  result: MutationSubmissionResult<TData, TFields, TList, TDetail> | null,
  isSubmitting: boolean
): MutationPageState<TData, TFields, TList, TDetail> {
  if (isSubmitting) {
    return {
      status: "submitting",
      isSubmitting: true,
      fieldErrors: {}
    };
  }

  if (!result) {
    return {
      status: "idle",
      isSubmitting: false,
      fieldErrors: {}
    };
  }

  if (result.status === "validation_error") {
    return {
      status: "validation_error",
      isSubmitting: false,
      fieldErrors: result.fieldErrors
    };
  }

  return {
    status: "success",
    isSubmitting: false,
    fieldErrors: {},
    data: result.data,
    refreshedList: result.refreshedList,
    refreshedDetail: result.refreshedDetail
  };
}
