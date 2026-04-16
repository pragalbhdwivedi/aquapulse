export interface SubmissionValidationError<TFields extends string> {
  readonly status: "validation_error";
  readonly fieldErrors: Partial<Record<TFields, string>>;
}

export interface SubmissionSuccess<TData> {
  readonly status: "success";
  readonly data: TData;
}

export type SubmissionResult<TData, TFields extends string> =
  | SubmissionValidationError<TFields>
  | SubmissionSuccess<TData>;

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

export function createValidatedSubmitter<
  TInput extends object,
  TOutput
>({
  schema,
  fields,
  submit
}: {
  readonly schema: SafeParseSchema<TInput>;
  readonly fields: readonly (keyof TInput)[];
  readonly submit: (input: TInput) => Promise<TOutput>;
}) {
  return async (
    input: TInput
  ): Promise<SubmissionResult<TOutput, Extract<keyof TInput, string>>> => {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return createValidationError(parsed.error.flatten().fieldErrors, fields);
    }

    const data = await submit(parsed.data);
    return {
      status: "success",
      data
    };
  };
}
