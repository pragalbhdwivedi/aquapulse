import type { RuntimeWarning } from "@aquapulse/types";

export interface OperatorAssistanceRuntimeEnv {
  readonly AQUAPULSE_AI_OPERATOR_ASSISTANCE_MODE?: string;
  readonly OPENAI_API_KEY?: string;
  readonly OPENAI_BASE_URL?: string;
  readonly OPENAI_OPERATOR_ASSISTANCE_MODEL?: string;
}

export interface OperatorAssistanceRuntimeConfig {
  readonly mode: "fallback" | "openai";
  readonly configured: boolean;
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly modelLabel: string;
  readonly warnings: RuntimeWarning[];
}

function normalizeMode(value: string | undefined): "fallback" | "openai" {
  const normalized = value?.trim().toLowerCase();
  return normalized === "openai" ? "openai" : "fallback";
}

function normalizeHttpUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }

    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return undefined;
  }
}

export function readOperatorAssistanceRuntimeConfig(
  env: OperatorAssistanceRuntimeEnv = process.env
): OperatorAssistanceRuntimeConfig {
  const warnings: RuntimeWarning[] = [];
  const mode = normalizeMode(env.AQUAPULSE_AI_OPERATOR_ASSISTANCE_MODE);
  const normalizedBaseUrl = normalizeHttpUrl(env.OPENAI_BASE_URL) ?? "https://api.openai.com/v1";
  const apiKey = env.OPENAI_API_KEY?.trim() || undefined;

  if (env.OPENAI_BASE_URL && !normalizeHttpUrl(env.OPENAI_BASE_URL)) {
    warnings.push({
      code: "OPENAI_BASE_URL_INVALID",
      message: "OPENAI_BASE_URL was ignored for AI operator assistance because it is not a valid http/https URL."
    });
  }

  if (mode === "openai" && !apiKey) {
    warnings.push({
      code: "OPENAI_API_KEY_MISSING",
      message:
        "OpenAI operator assistance was requested, but OPENAI_API_KEY is missing. AquaPulse will stay on the deterministic fallback path."
    });
  }

  return {
    mode,
    configured: mode === "openai" && Boolean(apiKey),
    baseUrl: normalizedBaseUrl,
    apiKey,
    modelLabel: env.OPENAI_OPERATOR_ASSISTANCE_MODEL?.trim() || "gpt-5-nano",
    warnings
  };
}
