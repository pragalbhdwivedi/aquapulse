export interface InlineEditState<TValue> {
  readonly isEditing: boolean;
  readonly initialValue: TValue;
  readonly draftValue: TValue;
  readonly feedback?: {
    readonly tone: "success" | "error";
    readonly message: string;
  };
}

export function createInlineEditState<TValue>(initialValue: TValue): InlineEditState<TValue> {
  return {
    isEditing: false,
    initialValue,
    draftValue: initialValue
  };
}

export function startInlineEdit<TValue>(state: InlineEditState<TValue>): InlineEditState<TValue> {
  return {
    ...state,
    isEditing: true,
    draftValue: state.initialValue,
    feedback: undefined
  };
}

export function updateInlineEditDraft<TValue>(
  state: InlineEditState<TValue>,
  draftValue: TValue
): InlineEditState<TValue> {
  return {
    ...state,
    draftValue
  };
}

export function patchInlineEditDraft<TValue extends Record<string, unknown>>(
  state: InlineEditState<TValue>,
  patch: Partial<TValue>
): InlineEditState<TValue> {
  return updateInlineEditDraft(state, {
    ...state.draftValue,
    ...patch
  });
}

export function cancelInlineEdit<TValue>(state: InlineEditState<TValue>): InlineEditState<TValue> {
  return {
    ...state,
    isEditing: false,
    draftValue: state.initialValue,
    feedback: undefined
  };
}

export function completeInlineEdit<TValue>(
  _state: InlineEditState<TValue>,
  nextValue: TValue,
  message: string
): InlineEditState<TValue> {
  return {
    isEditing: false,
    initialValue: nextValue,
    draftValue: nextValue,
    feedback: {
      tone: "success",
      message
    }
  };
}

export function failInlineEdit<TValue>(
  state: InlineEditState<TValue>,
  message: string
): InlineEditState<TValue> {
  return {
    ...state,
    feedback: {
      tone: "error",
      message
    }
  };
}
