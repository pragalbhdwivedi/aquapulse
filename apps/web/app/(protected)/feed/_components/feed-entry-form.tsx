"use client";

import { useState } from "react";
import { submitFeedEntry, type FeedEntrySubmissionResult } from "@web/features/feed-entry";
import { toMutationPageState } from "@web/features/mutation-refresh";

interface FeedEntryFormProps {
  readonly pondId?: string;
  readonly batchId?: string;
}

export function FeedEntryForm({
  pondId = "pond-1",
  batchId = "batch-1"
}: FeedEntryFormProps) {
  const [feedType, setFeedType] = useState("Starter Feed");
  const [quantityKg, setQuantityKg] = useState("18");
  const [fedAt, setFedAt] = useState("2026-04-14T06:00:00.000Z");
  const [result, setResult] = useState<FeedEntrySubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageState = toMutationPageState(result, isSubmitting);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        const submission = await submitFeedEntry({
          pondId,
          batchId,
          feedType,
          quantityKg: quantityKg ? Number(quantityKg) : 0,
          fedAt
        });

        setResult(submission);
        setIsSubmitting(false);
      }}
      style={{
        display: "grid",
        gap: "0.75rem",
        maxWidth: "28rem",
        marginTop: "1rem",
        padding: "1rem",
        border: "1px solid rgba(148, 163, 184, 0.3)",
        borderRadius: "0.75rem"
      }}
    >
      <h2 style={{ margin: 0, fontSize: "1rem" }}>Record feed entry</h2>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Feed Type</span>
        <input
          value={feedType}
          onChange={(event) => setFeedType(event.target.value)}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Quantity (kg)</span>
        <input
          value={quantityKg}
          onChange={(event) => setQuantityKg(event.target.value)}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span>Fed At</span>
        <input
          value={fedAt}
          onChange={(event) => setFedAt(event.target.value)}
          style={{ padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #475569" }}
        />
      </label>
      <button
        type="submit"
        disabled={pageState.isSubmitting}
        style={{
          padding: "0.7rem 0.9rem",
          borderRadius: "0.5rem",
          border: "1px solid #0f172a",
          background: "#e2e8f0",
          color: "#0f172a",
          fontWeight: 600
        }}
      >
        {pageState.isSubmitting ? "Saving..." : "Save feed entry"}
      </button>
      {pageState.status === "validation_error" ? (
        <p style={{ margin: 0, color: "#fca5a5" }}>
          {Object.values(pageState.fieldErrors).filter(Boolean).join(", ")}
        </p>
      ) : null}
      {pageState.status === "success" ? (
        <p style={{ margin: 0, color: "#86efac" }}>
          Saved {pageState.data?.feedType}. Refreshed entries: {pageState.refreshedList?.items.length ?? 0}
        </p>
      ) : null}
    </form>
  );
}
