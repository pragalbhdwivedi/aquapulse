import type { AiTextRewriteRequest, AiTextRewriteResponse } from "@aquapulse/types";

export class RewriteTextDto implements AiTextRewriteRequest { text!: string; tone!: "concise" | "formal" | "friendly"; }
export class RewriteTextResponseDto implements AiTextRewriteResponse { rewrittenText!: string; }
