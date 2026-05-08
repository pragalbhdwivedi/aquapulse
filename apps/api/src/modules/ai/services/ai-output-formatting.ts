import type {
  AiOutputPreferences,
  AiOutputTone,
  AiStructuredOutputMetadata,
  AiStructuredOutputMode
} from "@aquapulse/types";

export function resolveOutputMode(input: AiOutputPreferences | undefined): AiStructuredOutputMode {
  return input?.outputMode ?? "english_only";
}

export function resolveTone(input: AiOutputPreferences | undefined, fallbackTone?: AiOutputTone): AiOutputTone | undefined {
  return input?.tone ?? fallbackTone;
}

export function buildStructuredOutputMetadata(
  input: AiOutputPreferences | undefined,
  fallbackTone?: AiOutputTone
): AiStructuredOutputMetadata {
  const outputMode = resolveOutputMode(input);
  const tone = resolveTone(input, fallbackTone);

  return {
    outputMode,
    primaryLanguage: outputMode === "bilingual" ? "english" : "english",
    bilingual: outputMode === "bilingual",
    tone
  };
}

export function buildHindiFallbackLine(englishText: string): string {
  return `Hindi draft: ${englishText}`;
}

export function withOptionalHindi(
  englishText: string,
  input: AiOutputPreferences | undefined
): string | undefined {
  return resolveOutputMode(input) === "bilingual" ? buildHindiFallbackLine(englishText) : undefined;
}

export function prefixToneLabel(text: string, tone: AiOutputTone | undefined): string {
  switch (tone) {
    case "audit":
      return `Audit note: ${text}`;
    case "management":
      return `Management summary: ${text}`;
    case "formal":
      return text;
    case "operator":
    default:
      return `Operator note: ${text}`;
  }
}
