"use client";

import { useState, type FormEvent } from "react";
import type { WaterQualityEntrySubmissionResult } from "@web/features/water-quality-entry";
import { submitWaterQualityEntry } from "@web/features/water-quality-entry";

export function WaterQualityEntryForm({ pondId }: { pondId: string }) {
  const [recordedAt, setRecordedAt] = useState("2026-04-14T08:00:00.000Z");
  const [temperatureC, setTemperatureC] = useState("28.4");
  const [ph, setPh] = useState("7.6");
  const [result, setResult] = useState<WaterQualityEntrySubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const submission = await submitWaterQualityEntry({
      pondId,
      recordedAt,
      temperatureC: temperatureC ? Number(temperatureC) : undefined,
      ph: ph ? Number(ph) : undefined
    });

    setResult(submission);
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
      <h2>Water-Quality Entry</h2>
      <p>Minimal write-path form using the repository/client runtime seam.</p>
      <label style={{ display: "block", marginBottom: 8 }}>
        Recorded At
        <input value={recordedAt} onChange={(event) => setRecordedAt(event.target.value)} />
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        Temperature C
        <input value={temperatureC} onChange={(event) => setTemperatureC(event.target.value)} />
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        pH
        <input value={ph} onChange={(event) => setPh(event.target.value)} />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Entry"}
      </button>
      {result?.status === "success" ? (
        <p>Saved reading {result.data.id} for pond {result.data.pondId}.</p>
      ) : null}
      {result?.status === "validation_error" ? (
        <p>
          Validation failed:
          {" "}
          {Object.values(result.fieldErrors).filter(Boolean).join(", ")}
        </p>
      ) : null}
    </form>
  );
}
