import type { RuntimeWarning } from "@aquapulse/types";

export interface AlertExplanationEnvSource {
  readonly AQUAPULSE_AI_ALERT_EXPLANATIONS_MODE?: string;
  readonly OPENAI_API_KEY?: string;
  readonly OPENAI_BASE_URL?: string;
  readonly OPENAI_ALERT_EXPLANATIONS_MODEL?: string;
  readonly [key: string]: string | undefined;
}

export interface AlertExplanationRuntimeConfig {
  readonly mode: "fallback" | "openai";
  readonly configured: boolean;
  readonly apiKey?: string;
  readonly baseUrl: string;
  readonly modelLabel: string;
  readonly warnings: RuntimeWarning[];
}

function normalizeMode(value: string | undefined): "fallback" | "openai" {
  return value?.trim().toLowerCase() === "openai" ? "openai" : "fallback";
}

function normalizeHttpUrl(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.toString().replace(/\/+$/, "");
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function readAlertExplanationRuntimeConfig(
  env: AlertExplanationEnvSource = process.env
): AlertExplanationRuntimeConfig {
  const warnings: RuntimeWarning[] = [];
  const mode = normalizeMode(env.AQUAPULSE_AI_ALERT_EXPLANATIONS_MODE);
  const configuredBaseUrl = normalizeHttpUrl(env.OPENAI_BASE_URL);

  if (env.OPENAI_BASE_URL && !configuredBaseUrl) {
    warnings.push({
      code: "OPENAI_BASE_URL_INVALID",
      message: "OPENAI_BASE_URL was ignored because it is not a valid http/https URL."
    });
  }

  const apiKey = env.OPENAI_API_KEY?.trim() || undefined;
  const configured = mode === "openai" && Boolean(apiKey);

  if (mode === "openai" && !apiKey) {
    warnings.push({
      code: "OPENAI_API_KEY_MISSING",
      message:
        "OpenAI alert explanations were requested, but OPENAI_API_KEY is missing. The API will use the advisory fallback explanation path."
    });
  }

  return {
    mode,
    configured,
    apiKey,
    baseUrl: configuredBaseUrl ?? "https://api.openai.com/v1",
    modelLabel: env.OPENAI_ALERT_EXPLANATIONS_MODEL?.trim() || "gpt-5-nano",
    warnings
  };
}
