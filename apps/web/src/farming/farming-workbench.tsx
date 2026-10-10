"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  farmEnterpriseCatalog,
  farmCycleCount,
  farmMaterialBalance,
  type FarmEnterprise,
  type FarmField,
  type FarmWorkspaceView,
} from "@aquapulse/types";
import {
  cacheFarmWorkspace,
  cachedFarmWorkspace,
  clearFarmDevice,
  farmOutbox,
  farmScope,
  forgetCachedFarmWorkspace,
  reconcileFarmOutbox,
  removeFarmOutbox,
  saveFarmOutbox,
  type FarmOutboxItem,
} from "./offline-store";
import "./farming.css";

type Option = { value: string; label: string };
type Field = {
  key: string;
  label: string;
  type?: "number" | "date" | "datetime-local" | "select" | "multi" | "textarea";
  options?: Option[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | "any";
  value?: string | number;
  hint?: string;
};
async function api<T>(path: string, payload?: unknown): Promise<T> {
  const response = await fetch(`/api/farming/${path}`, {
    method: payload === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.ok !== true)
    throw Object.assign(
      new Error(
        Array.isArray(json.message)
          ? json.message.join("; ")
          : json.message || json.error?.message || "Farming request failed.",
      ),
      { status: response.status },
    );
  return json.data as T;
}
function FieldForm({
  title,
  fields,
  onSubmit,
  button = "Save",
  disabled = false,
}: {
  title: string;
  fields: Field[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  button?: string;
  disabled?: boolean;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const data: Record<string, unknown> = {};
    for (const field of fields) {
      if (field.type === "multi") {
        data[field.key] = values.getAll(field.key);
        continue;
      }
      const value = String(values.get(field.key) ?? "").trim();
      if (value !== "")
        data[field.key] =
          field.type === "number"
            ? Number(value)
            : field.type === "datetime-local"
              ? new Date(value).toISOString()
              : value;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit(data);
      form.reset();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="farm-form" onSubmit={submit}>
      <h3>{title}</h3>
      <fieldset disabled={disabled || busy}>
        <div className="farm-fields">
          {fields.map((field) => (
            <label key={field.key}>
              {field.label}
              {field.type === "select" || field.type === "multi" ? (
                <select
                  aria-label={field.label}
                  name={field.key}
                  required={field.required !== false}
                  multiple={field.type === "multi"}
                  defaultValue={
                    field.type === "multi" ? [] : (field.value ?? "")
                  }
                >
                  {field.type !== "multi" && <option value="">Select…</option>}
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  aria-label={field.label}
                  name={field.key}
                  required={field.required !== false}
                  maxLength={2000}
                />
              ) : (
                <input
                  aria-label={field.label}
                  name={field.key}
                  type={field.type || "text"}
                  required={field.required !== false}
                  defaultValue={field.value}
                  min={field.min}
                  max={field.max}
                  step={field.step ?? "any"}
                  maxLength={field.type ? undefined : 160}
                />
              )}
              {field.hint && <small>{field.hint}</small>}
            </label>
          ))}
        </div>
        <button type="submit">{busy ? "Saving…" : button}</button>
      </fieldset>
      {error && (
        <p role="alert" className="farm-error">
          {error}
        </p>
      )}
    </form>
  );
}
const options = (rows: { id: string; name: string }[]): Option[] =>
  rows.map((row) => ({ value: row.id, label: row.name }));
const select = (
  key: string,
  label: string,
  rows: Option[],
  required = true,
): Field => ({ key, label, type: "select", options: rows, required });
const text = (key: string, label: string, required = true): Field => ({
  key,
  label,
  required,
});
const number = (key: string, label: string, required = true): Field => ({
  key,
  label,
  type: "number",
  min: 0,
  required,
});
const nowLocal = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
const recorded = (): Field => ({
  key: "recordedAt",
  label: "Recorded at (device time)",
  type: "datetime-local",
  value: nowLocal(),
});
function activityField(field: FarmField): Field {
  return {
    key: field.key,
    label: field.unit ? `${field.label} (${field.unit})` : field.label,
    type: field.kind === "text" ? undefined : field.kind,
    required: field.required,
    min: field.min,
    max: field.max,
    step: field.integer || field.unit === "count" ? 1 : "any",
  };
}

export function FarmingWorkbench() {
  const [workspace, setWorkspace] = useState<FarmWorkspaceView>();
  const [farmId, setFarmId] = useState("");
  const [tab, setTab] = useState("Overview");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [outbox, setOutbox] = useState<FarmOutboxItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [enterprise, setEnterprise] = useState<FarmEnterprise>("aquaculture");
  const [cycleId, setCycleId] = useState("");
  const [activityType, setActivityType] = useState("");
  const [hindi, setHindi] = useState(false);
  const [photo, setPhoto] = useState<string>("");
  const [photoTarget, setPhotoTarget] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [eraseTarget, setEraseTarget] = useState<string>();
  const scope = workspace ? farmScope(workspace) : "";
  async function reloadOutbox(current = workspace) {
    if (current) setOutbox(await farmOutbox(farmScope(current)));
  }
  async function refresh() {
    setError("");
    if (!navigator.onLine) {
      setConnected(false);
      return undefined;
    }
    try {
      const current = await api<FarmWorkspaceView>("workspace");
      setWorkspace(current);
      setConnected(true);
      setFarmId((previous) =>
        current.farms.some((farm) => farm.id === previous)
          ? previous
          : current.farms[0]?.id || "",
      );
      const cached = await cachedFarmWorkspace().catch(() => undefined);
      if (cached && farmScope(cached) === farmScope(current)) {
        setOfflineEnabled(true);
        await cacheFarmWorkspace(current);
      } else {
        setOfflineEnabled(false);
        if (cached) await forgetCachedFarmWorkspace();
        setPhotoPreview("");
      }
      await reloadOutbox(current);
      return current;
    } catch (failure) {
      setConnected(false);
      const status =
        failure && typeof failure === "object" && "status" in failure
          ? Number(failure.status)
          : 0;
      if (status === 401 || status === 403) {
        setWorkspace(undefined);
        setOutbox([]);
      }
      setError(
        failure instanceof Error ? failure.message : "Connection unavailable.",
      );
      return undefined;
    }
  }
  useEffect(() => {
    let active = true;
    void refresh().then(async (current) => {
      if (!current && active && !navigator.onLine) {
        const cached = await cachedFarmWorkspace().catch(() => undefined);
        if (cached && active) {
          setWorkspace(cached);
          setFarmId(cached.farms[0]?.id || "");
          setOfflineEnabled(true);
          await reloadOutbox(cached);
        }
      }
    });
    const online = () => {
      void refresh();
    };
    const offline = () => setConnected(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      active = false;
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);
  async function mutate(resource: string, data: unknown) {
    await api(resource, data);
    setNotice("Saved on the server.");
    await refresh();
  }
  async function capture(
    operation: FarmOutboxItem["operation"],
    payload: Record<string, unknown>,
  ) {
    const data = { ...payload, submissionId: crypto.randomUUID() };
    if (connected && navigator.onLine) {
      try {
        await api(operation, data);
        setNotice("Record accepted by the server.");
        await refresh();
        return;
      } catch (failure) {
        const status =
          failure && typeof failure === "object" && "status" in failure
            ? Number(failure.status)
            : 0;
        if (status > 0 && status < 500) throw failure;
      }
    }
    if (!offlineEnabled)
      throw new Error(
        "Enable offline capture while connected before saving on this device.",
      );
    await saveFarmOutbox({
      id: String(data.submissionId),
      scope,
      operation,
      payload: data,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    await reloadOutbox();
    setNotice(
      "Saved on this device. Reconnect and synchronise for server validation.",
    );
  }
  async function enableOffline() {
    if (!workspace || !connected) return;
    try {
      if (!("serviceWorker" in navigator) || !window.isSecureContext)
        throw new Error(
          "Offline installation requires HTTPS or localhost in a supported browser.",
        );
      await navigator.serviceWorker.register("/farm-sw.js");
      await navigator.serviceWorker.ready;
      await cacheFarmWorkspace(workspace);
      setOfflineEnabled(true);
      setNotice(
        "Offline capture enabled on this device. Records stay here until synchronised. Use Clear device on shared devices.",
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Offline storage unavailable.",
      );
    }
  }
  async function synchronise() {
    setBusy(true);
    try {
      const current = await api<FarmWorkspaceView>("workspace");
      const count = await reconcileFarmOutbox(
        scope,
        farmScope(current),
        await farmOutbox(scope),
        async (operation, payload) => {
          await api(operation, payload);
        },
      );
      setNotice(
        `${count} records accepted. Conflicts and blocked records remain for review.`,
      );
      await refresh();
      await reloadOutbox();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Synchronisation failed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function action(work: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await work();
      await refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }
  const farm = workspace?.farms.find((entry) => entry.id === farmId);
  const units =
    workspace?.units.filter((entry) => entry.farmId === farmId) || [];
  const cycles =
    workspace?.cycles.filter((entry) => entry.farmId === farmId) || [];
  const activities =
    workspace?.activities.filter((entry) => entry.farmId === farmId) || [];
  const materials =
    workspace?.materials.filter((entry) => entry.farmId === farmId) || [];
  const tasks =
    workspace?.tasks.filter((entry) => entry.farmId === farmId) || [];
  const selectedCycle = cycles.find((entry) => entry.id === cycleId);
  const definition = farmEnterpriseCatalog.find(
    (entry) => entry.id === (selectedCycle?.enterprise || enterprise),
  )!;
  const activity =
    definition.activities.find((entry) => entry.id === activityType) ||
    definition.activities[0];
  const manager =
    workspace?.currentRole === "owner" || workspace?.currentRole === "manager";
  const operator = manager || workspace?.currentRole === "operator";
  const finance =
    workspace?.currentRole === "owner" ||
    workspace?.currentRole === "accountant";
  const configure = connected && !busy;
  function exportRecords() {
    if (!workspace) return;
    const blob = new Blob(
      [
        JSON.stringify(
          { exportedAt: new Date().toISOString(), ...workspace },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "aquapulse-farm-records.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="farm-app">
      <header className="farm-header">
        <div>
          <p className="farm-eyebrow">AQUAPULSE · INDIA</p>
          <h1>{hindi ? "एकीकृत कृषि" : "Integrated farming"}</h1>
          <p>One place for the farm, the field and the production cycle.</p>
        </div>
        <button className="farm-secondary" onClick={() => setHindi(!hindi)}>
          {hindi ? "English" : "हिन्दी"}
        </button>
      </header>
      <div className="farm-toolbar">
        <span className={`farm-badge ${connected ? "" : "farm-warning"}`}>
          {connected ? "Connected" : "Offline / connection unavailable"}
        </span>
        {workspace && (
          <>
            <span>
              {workspace.currentRole} · {workspace.actorId}
            </span>
            <select
              aria-label="Farm"
              value={farmId}
              onChange={(event) => {
                setFarmId(event.target.value);
                setCycleId("");
              }}
            >
              <option value="">Choose farm</option>
              {workspace.farms.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </>
        )}
        <button className="farm-secondary" onClick={() => void refresh()}>
          Refresh
        </button>
      </div>
      {workspace?.demo && (
        <p className="farm-banner">
          Local demonstration · Memory storage resets when the API restarts. Use
          synthetic records. ERP dispatch is disabled.
        </p>
      )}
      {workspace && !connected && (
        <p className="farm-banner">
          Showing the last device snapshot for {workspace.actorId}. Only field
          capture is available. The server checks your current access and every
          record after reconnect.
        </p>
      )}
      {notice && (
        <p role="status" className="farm-success">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="farm-error">
          {error}
        </p>
      )}
      {!workspace ? (
        <div className="farm-card">
          <h2>Connect your farming workspace</h2>
          <p>
            The API needs verified Keycloak access and a server-configured
            owner. For a local synthetic preview, use the demo instructions in
            the farming runbook.
          </p>
          <p>
            Previously captured records remain on this device until you
            reconnect with the capture account.
          </p>
        </div>
      ) : (
        <>
          <nav className="farm-tabs" aria-label="Farming sections">
            {[
              "Overview",
              "Capture",
              "Tasks",
              "Stock",
              "Review",
              "Finance",
              "Setup",
              "Device",
            ].map((name) => (
              <button
                key={name}
                aria-current={tab === name ? "page" : undefined}
                onClick={() => setTab(name)}
              >
                {name}
                {name === "Device" && outbox.length
                  ? ` (${outbox.length})`
                  : ""}
              </button>
            ))}
          </nav>
          {tab === "Overview" && (
            <>
              <div className="farm-metrics">
                <article>
                  <strong>{units.length}</strong>Production units
                </article>
                <article>
                  <strong>
                    {cycles.filter((entry) => entry.stage === "active").length}
                  </strong>
                  Active cycles
                </article>
                <article>
                  <strong>
                    {
                      activities.filter(
                        (entry) => entry.status === "pending_approval",
                      ).length
                    }
                  </strong>
                  Awaiting review
                </article>
                <article>
                  <strong>
                    {tasks.filter((entry) => entry.status === "open").length}
                  </strong>
                  Open tasks
                </article>
              </div>
              <div className="farm-card">
                <h2>{farm?.name || "Start with your farm"}</h2>
                <p>
                  {farm
                    ? `${farm.location || "Location not entered"} · INR · Asia/Kolkata`
                    : "An owner can create a legal entity and a farm in Setup."}
                </p>
                <div className="farm-enterprises">
                  {farmEnterpriseCatalog.map((entry) => (
                    <span key={entry.id}>
                      {hindi ? entry.labelHindi : entry.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="farm-card">
                <h2>Production cycles</h2>
                {cycles.length === 0 && (
                  <p>
                    No cycles yet. Create a production unit and its first cycle
                    in Setup.
                  </p>
                )}
                {cycles.map((cycle) => (
                  <article className="farm-row" key={cycle.id}>
                    <div>
                      <strong>{cycle.name}</strong>
                      <p>
                        {cycle.species} ·{" "}
                        {cycle.enterprise.replaceAll("_", " ")} · {cycle.stage}
                      </p>
                      <small>
                        Started {new Date(cycle.startsAt).toLocaleDateString()}{" "}
                        · Recorded count {farmCycleCount(cycle, activities)}
                        {cycle.parentCycleId
                          ? ` · Parent: ${cycles.find((entry) => entry.id === cycle.parentCycleId)?.name || "linked cycle"}`
                          : ""}
                      </small>
                    </div>
                    {manager && cycle.stage === "active" && (
                      <button
                        disabled={!configure}
                        className="farm-secondary"
                        onClick={() => {
                          setCycleId(cycle.id);
                          setTab("Review");
                        }}
                      >
                        Review / close
                      </button>
                    )}
                  </article>
                ))}
              </div>
              <div className="farm-card">
                <h2>Traceability and records</h2>
                <p>
                  Cycle links, source lots, harvest lots, treatments, photos and
                  stock movements are retained with their actors. Operational
                  quantities do not provide an accounting valuation.
                </p>
                <button onClick={exportRecords}>
                  Export accessible records
                </button>
              </div>
            </>
          )}
          {tab === "Capture" && (
            <>
              <div className="farm-card">
                <h2>Field record</h2>
                <label>
                  Production cycle
                  <select
                    value={cycleId}
                    onChange={(event) => {
                      setCycleId(event.target.value);
                      setActivityType("");
                    }}
                  >
                    <option value="">Choose active cycle</option>
                    {cycles
                      .filter((entry) => entry.stage === "active")
                      .map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.name} · {entry.species}
                        </option>
                      ))}
                  </select>
                </label>
                {selectedCycle && (
                  <label>
                    Activity
                    <select
                      value={activity.id}
                      onChange={(event) => setActivityType(event.target.value)}
                    >
                      {definition.activities.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              {selectedCycle && (
                <FieldForm
                  key={`${cycleId}:${activity.id}`}
                  title={activity.label}
                  fields={[
                    recorded(),
                    ...activity.fields.map(activityField),
                    { ...text("note", "Notes", false), type: "textarea" },
                  ]}
                  disabled={!operator}
                  button={connected ? "Record activity" : "Save on device"}
                  onSubmit={async (data) => {
                    const { recordedAt, note, ...fields } = data;
                    await capture("activities", {
                      cycleId,
                      type: activity.id,
                      recordedAt,
                      fields,
                      ...(note ? { note } : {}),
                    });
                  }}
                />
              )}
              {activity.requiresApproval && selectedCycle && (
                <p className="farm-banner">
                  This record needs review by a different manager. It records
                  professional instructions and does not prescribe a product or
                  dose.
                </p>
              )}
              <div className="farm-card">
                <h2>Photo evidence</h2>
                <p>
                  Attach a PNG, JPEG or WebP up to 256 KiB to an existing
                  activity. Device photos upload on synchronisation.
                </p>
                <label>
                  Activity
                  <select
                    value={photoTarget}
                    onChange={(event) => setPhotoTarget(event.target.value)}
                  >
                    <option value="">Choose record</option>
                    {activities.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.type} ·{" "}
                        {new Date(entry.recordedAt).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Caption
                  <input
                    value={photoCaption}
                    maxLength={160}
                    onChange={(event) => setPhotoCaption(event.target.value)}
                  />
                </label>
                <label>
                  Photo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setPhoto("");
                      if (!file) return;
                      if (file.size > 262144) {
                        setError(
                          "Resize the photo below 256 KiB before attaching.",
                        );
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setPhoto(String(reader.result));
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                <button
                  disabled={
                    !operator ||
                    !photo ||
                    !photoTarget ||
                    photoCaption.trim().length < 2
                  }
                  onClick={() =>
                    void action(async () => {
                      await capture("photos", {
                        activityId: photoTarget,
                        caption: photoCaption,
                        dataUrl: photo,
                      });
                      setPhoto("");
                    })
                  }
                >
                  Save photo
                </button>
              </div>
              <div className="farm-card">
                <h2>Activity history</h2>
                {activities
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <article className="farm-row" key={entry.id}>
                      <div>
                        <strong>{entry.type.replaceAll("_", " ")}</strong>
                        <p>
                          {
                            cycles.find((cycle) => cycle.id === entry.cycleId)
                              ?.name
                          }{" "}
                          · {new Date(entry.recordedAt).toLocaleString()} ·{" "}
                          {entry.status.replaceAll("_", " ")}
                        </p>
                        <dl className="farm-values">
                          {Object.entries(entry.fields).map(([key, value]) => (
                            <div key={key}>
                              <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
                              <dd>{String(value)}</dd>
                            </div>
                          ))}
                        </dl>
                        {entry.note && <p>{entry.note}</p>}
                        {entry.decisionReason && (
                          <p>Review: {entry.decisionReason}</p>
                        )}
                        {workspace.photos
                          .filter((item) => item.activityId === entry.id)
                          .map((item) => (
                            <button
                              key={item.id}
                              className="farm-secondary"
                              disabled={!connected}
                              onClick={() =>
                                void action(async () => {
                                  const full = await api<{ dataUrl: string }>(
                                    `photos/${item.id}`,
                                  );
                                  setPhotoPreview(full.dataUrl);
                                })
                              }
                            >
                              {item.caption}
                            </button>
                          ))}
                      </div>
                    </article>
                  ))}
                {photoPreview && (
                  <div>
                    <img
                      src={photoPreview}
                      alt="Selected farm evidence"
                      style={{ maxWidth: "100%", maxHeight: 480 }}
                    />
                    <button onClick={() => setPhotoPreview("")}>
                      Close photo
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {tab === "Tasks" && (
            <>
              {manager && (
                <FieldForm
                  title="Assign farm work"
                  disabled={!configure || !farmId}
                  fields={[
                    text("title", "Work to complete"),
                    {
                      key: "dueAt",
                      label: "Due at",
                      type: "datetime-local",
                      value: nowLocal(),
                    },
                    text("assignedTo", "Assigned user's login subject"),
                    select(
                      "cycleId",
                      "Production cycle (optional)",
                      options(cycles),
                      false,
                    ),
                  ]}
                  onSubmit={(data) => mutate("tasks", { ...data, farmId })}
                />
              )}
              <div className="farm-card">
                <h2>Work list</h2>
                {tasks.length === 0 && <p>No tasks assigned.</p>}
                {tasks.map((task) => (
                  <article key={task.id} className="farm-row">
                    <div>
                      <strong>{task.title}</strong>
                      <p>
                        {task.status} · Due{" "}
                        {new Date(task.dueAt).toLocaleString()} ·{" "}
                        {task.assignedTo}
                      </p>
                      {workspace.taskUpdates
                        .filter((entry) => entry.taskId === task.id)
                        .map((entry) => (
                          <p key={entry.id}>
                            {entry.note} · {entry.actorId}
                          </p>
                        ))}
                    </div>
                    {operator &&
                      (manager || task.assignedTo === workspace.actorId) && (
                        <FieldForm
                          title="Update work"
                          fields={[
                            select("status", "Status", [
                              { value: "open", label: "Open" },
                              { value: "done", label: "Done" },
                            ]),
                            text("note", "Progress note"),
                            recorded(),
                          ]}
                          onSubmit={(data) =>
                            capture("task-updates", {
                              ...data,
                              taskId: task.id,
                            })
                          }
                        />
                      )}
                  </article>
                ))}
              </div>
            </>
          )}
          {tab === "Stock" && (
            <>
              <p className="farm-banner">
                Operational stock is checked online. ERPNext owns accounting
                quantities, valuation and commercial posting. Cross-farm
                transfers require access to both farms and matching units.
              </p>
              <div className="farm-card">
                <h2>Material balances</h2>
                {materials.map((material) => (
                  <article key={material.id} className="farm-row">
                    <strong>{material.name}</strong>
                    <span>
                      {farmMaterialBalance(material.id, workspace.movements)}{" "}
                      {material.unit}
                    </span>
                  </article>
                ))}
              </div>
              {manager && (
                <div className="farm-grid">
                  <FieldForm
                    title="Add material"
                    disabled={!configure || !farmId}
                    fields={[
                      text("name", "Material / resource"),
                      select(
                        "unit",
                        "Unit",
                        ["kg", "L", "count", "m3"].map((value) => ({
                          value,
                          label: value,
                        })),
                      ),
                      text(
                        "erpItemCode",
                        "ERPNext item code (optional)",
                        false,
                      ),
                    ]}
                    onSubmit={(data) =>
                      mutate("materials", { ...data, farmId })
                    }
                  />
                  <FieldForm
                    title="Record movement"
                    disabled={!configure}
                    fields={[
                      select(
                        "materialId",
                        "Source material",
                        options(materials),
                      ),
                      select(
                        "kind",
                        "Movement",
                        ["receipt", "issue", "transfer"].map((value) => ({
                          value,
                          label: value,
                        })),
                      ),
                      number("quantity", "Quantity"),
                      text("lot", "Material / source lot"),
                      select(
                        "destinationMaterialId",
                        "Transfer destination (optional)",
                        workspace.materials.map((entry) => ({
                          value: entry.id,
                          label: `${workspace.farms.find((item) => item.id === entry.farmId)?.name} · ${entry.name} (${entry.unit})`,
                        })),
                        false,
                      ),
                      recorded(),
                    ]}
                    onSubmit={(data) =>
                      mutate("movements", {
                        ...data,
                        submissionId: crypto.randomUUID(),
                      })
                    }
                  />
                </div>
              )}
              <div className="farm-card">
                <h2>Movement history</h2>
                {workspace.movements
                  .filter(
                    (entry) =>
                      entry.farmId === farmId ||
                      entry.destinationFarmId === farmId,
                  )
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <p key={entry.id}>
                      {entry.kind} ·{" "}
                      {workspace.materials.find(
                        (item) => item.id === entry.materialId,
                      )?.name || "Incoming resource"}{" "}
                      · {entry.quantity} · Lot {entry.lot} ·{" "}
                      {new Date(entry.recordedAt).toLocaleString()}
                    </p>
                  ))}
              </div>
            </>
          )}
          {tab === "Review" && (
            <>
              <div className="farm-card">
                <h2>Treatment review</h2>
                <p>
                  Review the specialist's instructions, evidence and withdrawal
                  period before approval.
                </p>
                {activities
                  .filter((entry) => entry.status === "pending_approval")
                  .map((entry) => (
                    <FieldForm
                      key={entry.id}
                      title={`${entry.type} · ${cycles.find((cycle) => cycle.id === entry.cycleId)?.name} · ${entry.actorId}`}
                      disabled={
                        !configure ||
                        !manager ||
                        entry.actorId === workspace.actorId
                      }
                      fields={[
                        {
                          key: "reason",
                          label: `Review of ${Object.entries(entry.fields)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join("; ")}`,
                          type: "textarea",
                        },
                        select("decision", "Decision", [
                          { value: "approve", label: "Approve" },
                          { value: "reject", label: "Reject" },
                        ]),
                      ]}
                      onSubmit={(data) =>
                        mutate(`activities/${entry.id}/decision`, data)
                      }
                    />
                  ))}
                {!activities.some(
                  (entry) => entry.status === "pending_approval",
                ) && <p>No treatment records awaiting review.</p>}
              </div>
              {manager && (
                <div className="farm-grid">
                  <FieldForm
                    title="Void an incorrect record"
                    disabled={!configure}
                    fields={[
                      select(
                        "id",
                        "Record",
                        activities
                          .filter((entry) =>
                            ["recorded", "approved"].includes(entry.status),
                          )
                          .map((entry) => ({
                            value: entry.id,
                            label: `${entry.type} · ${new Date(entry.recordedAt).toLocaleString()}`,
                          })),
                      ),
                      text("reason", "Correction reason"),
                    ]}
                    onSubmit={async ({ id, reason }) =>
                      mutate(`activities/${id}/decision`, {
                        decision: "void",
                        reason,
                      })
                    }
                  />
                  <FieldForm
                    title="Close production cycle"
                    disabled={!configure}
                    fields={[
                      select(
                        "id",
                        "Cycle",
                        options(
                          cycles.filter((entry) => entry.stage === "active"),
                        ),
                      ),
                      text("reason", "Closure reason"),
                    ]}
                    onSubmit={async ({ id, reason }) =>
                      mutate(`cycles/${id}/close`, { reason })
                    }
                  />
                </div>
              )}
              <div className="farm-card">
                <h2>Audit history</h2>
                {!connected && (
                  <p>Audit history is available after reconnect.</p>
                )}
                {workspace.audit
                  .filter((entry) => entry.farmId === farmId || !entry.farmId)
                  .slice(-50)
                  .reverse()
                  .map((entry) => (
                    <p key={entry.id}>
                      {new Date(entry.at).toLocaleString()} · {entry.actorId} ·{" "}
                      {entry.action}
                    </p>
                  ))}
              </div>
            </>
          )}
          {tab === "Finance" && (
            <>
              <div className="farm-card">
                <h2>ERPNext India finance</h2>
                <p>
                  {workspace.erpConfigured
                    ? "ERP connector configured. Provider acceptance is still required."
                    : "ERP connection is not configured."}{" "}
                  AquaPulse sends approved draft invoice requests. GST,
                  e-invoice, e-way bill, TDS/TCS, banking, assets, statutory
                  returns and payroll are configured and reviewed in ERPNext,
                  India Compliance and Frappe HR.
                </p>
                <p>
                  A different owner or accountant must approve each request.
                  Creating a draft does not submit an invoice or file a return.
                </p>
              </div>
              {(manager || finance) && (
                <FieldForm
                  title="Request invoice draft"
                  disabled={!configure || !farmId}
                  fields={[
                    select("kind", "Document", [
                      { value: "Sales Invoice", label: "Sales invoice" },
                      { value: "Purchase Invoice", label: "Purchase invoice" },
                    ]),
                    text("party", "Exact ERPNext customer / supplier name"),
                    { key: "postingDate", label: "Posting date", type: "date" },
                    text("itemCode", "Exact ERPNext item code"),
                    number("quantity", "Quantity"),
                    number("rate", "Rate (INR)"),
                    text("warehouse", "Warehouse (optional)", false),
                  ]}
                  onSubmit={async ({
                    itemCode,
                    quantity,
                    rate,
                    warehouse,
                    ...data
                  }) =>
                    mutate("erp-jobs", {
                      ...data,
                      farmId,
                      lines: [
                        {
                          itemCode,
                          quantity,
                          rate,
                          ...(warehouse ? { warehouse } : {}),
                        },
                      ],
                      submissionId: crypto.randomUUID(),
                    })
                  }
                />
              )}
              <div className="farm-card">
                <h2>Reconciliation queue</h2>
                {workspace.erpJobs
                  .filter((entry) => entry.farmId === farmId)
                  .map((job) => (
                    <article className="farm-row" key={job.id}>
                      <div>
                        <strong>
                          {job.kind} · {job.party}
                        </strong>
                        <p>
                          {job.status.replaceAll("_", " ")} · Attempts{" "}
                          {job.attempts}
                          {job.externalName
                            ? ` · ERP reference ${job.externalName}`
                            : ""}
                        </p>
                        {job.lastError && (
                          <p className="farm-error">{job.lastError}</p>
                        )}
                        {job.status === "pending_approval" &&
                          finance &&
                          job.actorId !== workspace.actorId && (
                            <FieldForm
                              title="Approve draft request"
                              disabled={!configure}
                              fields={[
                                text("reason", "Review reason"),
                                select("decision", "Decision", [
                                  { value: "approve", label: "Approve" },
                                  { value: "reject", label: "Reject" },
                                ]),
                              ]}
                              onSubmit={(data) =>
                                mutate(`erp-jobs/${job.id}/decision`, data)
                              }
                            />
                          )}
                      </div>
                      {finance &&
                        ["queued", "failed", "processing"].includes(
                          job.status,
                        ) && (
                          <button
                            disabled={!configure || !workspace.erpConfigured}
                            onClick={() =>
                              void action(() =>
                                api(`erp-jobs/${job.id}/dispatch`, {}),
                              )
                            }
                          >
                            Reconcile with ERPNext
                          </button>
                        )}
                    </article>
                  ))}
              </div>
            </>
          )}
          {tab === "Setup" && (
            <>
              <div className="farm-card">
                <h2>Farm structure</h2>
                <p>
                  {workspace.organizationName} · {workspace.storage} storage ·
                  India first. Configure each legal entity, farm, production
                  unit and cycle before field capture.
                </p>
              </div>
              {workspace.currentRole === "owner" && (
                <div className="farm-grid">
                  <FieldForm
                    title="Legal entity"
                    disabled={!configure}
                    fields={[
                      text("name", "Registered entity name"),
                      text("state", "Indian state / union territory"),
                      text(
                        "erpCompany",
                        "Exact ERPNext Company (optional)",
                        false,
                      ),
                    ]}
                    onSubmit={(data) => mutate("legal-entities", data)}
                  />
                  <FieldForm
                    title="Farm"
                    disabled={!configure}
                    fields={[
                      select(
                        "legalEntityId",
                        "Legal entity",
                        options(workspace.legalEntities),
                      ),
                      text("name", "Farm name"),
                      text("code", "Unique farm code"),
                      text("location", "Location", false),
                    ]}
                    onSubmit={(data) => mutate("farms", data)}
                  />
                </div>
              )}
              {workspace.currentRole === "owner" && (
                <FieldForm
                  title="Connect entity to ERPNext later"
                  disabled={!configure}
                  fields={[
                    select(
                      "id",
                      "Legal entity",
                      options(workspace.legalEntities),
                    ),
                    text("erpCompany", "Exact ERPNext Company"),
                  ]}
                  onSubmit={async ({ id, erpCompany }) =>
                    mutate(`legal-entities/${id}/configure`, { erpCompany })
                  }
                />
              )}
              {manager && (
                <>
                  <div className="farm-card">
                    <label>
                      Enterprise
                      <select
                        value={enterprise}
                        onChange={(event) =>
                          setEnterprise(event.target.value as FarmEnterprise)
                        }
                      >
                        {farmEnterpriseCatalog.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {hindi ? entry.labelHindi : entry.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="farm-grid">
                    <FieldForm
                      key={enterprise}
                      title="Production unit"
                      disabled={!configure || !farmId}
                      fields={[
                        text("name", "Unit name"),
                        select(
                          "kind",
                          "Unit type",
                          farmEnterpriseCatalog
                            .find((entry) => entry.id === enterprise)!
                            .unitKinds.map((value) => ({
                              value,
                              label: value.replaceAll("_", " "),
                            })),
                        ),
                        number("areaHa", "Area (ha, optional)", false),
                      ]}
                      onSubmit={(data) =>
                        mutate("units", { ...data, farmId, enterprise })
                      }
                    />
                    <FieldForm
                      title="Production cycle"
                      disabled={!configure}
                      fields={[
                        select("unitId", "Production unit", options(units)),
                        text("name", "Cycle / flock / herd / season"),
                        text("species", "Species / crop / variety"),
                        {
                          key: "startsAt",
                          label: "Start date and time",
                          type: "datetime-local",
                          value: nowLocal(),
                        },
                        {
                          ...number(
                            "initialCount",
                            "Initial animals / plants (0 if not counted)",
                          ),
                          step: 1,
                          value: 0,
                        },
                        select(
                          "parentCycleId",
                          "Parent cycle (optional)",
                          options(cycles),
                          false,
                        ),
                      ]}
                      onSubmit={(data) => mutate("cycles", data)}
                    />
                  </div>
                </>
              )}
              {workspace.currentRole === "owner" && (
                <>
                  <FieldForm
                    title="Grant or update access"
                    disabled={!configure}
                    fields={[
                      text("userId", "Verified Keycloak subject"),
                      select(
                        "role",
                        "Role",
                        [
                          "owner",
                          "manager",
                          "operator",
                          "accountant",
                          "viewer",
                        ].map((value) => ({ value, label: value })),
                      ),
                      {
                        key: "farmIds",
                        label:
                          "Allowed farms (Ctrl / Command to select several)",
                        type: "multi",
                        options: options(workspace.farms),
                        required: false,
                      },
                    ]}
                    onSubmit={(data) =>
                      mutate("memberships", { ...data, active: true })
                    }
                  />
                  <div className="farm-card">
                    <h2>Memberships</h2>
                    {workspace.memberships?.map((member) => (
                      <article className="farm-row" key={member.userId}>
                        <span>
                          {member.userId} · {member.role} ·{" "}
                          {member.active ? "active" : "revoked"} ·{" "}
                          {member.role === "owner"
                            ? "All farms"
                            : member.farmIds
                                .map(
                                  (id) =>
                                    workspace.farms.find(
                                      (entry) => entry.id === id,
                                    )?.name,
                                )
                                .join(", ") || "No farms assigned"}
                        </span>
                        {member.active && (
                          <button
                            className="farm-secondary"
                            disabled={!configure}
                            onClick={() =>
                              void action(() =>
                                api("memberships", {
                                  ...member,
                                  active: false,
                                }),
                              )
                            }
                          >
                            Revoke
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {tab === "Device" && (
            <>
              <div className="farm-card">
                <h2>Offline field capture</h2>
                <p>
                  {offlineEnabled
                    ? "Enabled for this account on this device."
                    : "Enable while connected to store a farm snapshot and capture records offline."}{" "}
                  Device data is not encrypted by AquaPulse. Use a trusted
                  device with a screen lock. Approvals, stock movements and ERP
                  operations require a connection.
                </p>
                <div className="farm-actions">
                  <button
                    disabled={!connected || offlineEnabled}
                    onClick={() => void enableOffline()}
                  >
                    Enable offline capture
                  </button>
                  <button
                    disabled={!connected || busy || !outbox.length}
                    onClick={() => void synchronise()}
                  >
                    Synchronise {outbox.length} records
                  </button>
                  <button
                    className="farm-secondary"
                    onClick={() => setEraseTarget("device")}
                  >
                    Clear device data
                  </button>
                </div>
                {eraseTarget && (
                  <div className="farm-banner" role="alert">
                    <p>
                      {eraseTarget === "device"
                        ? "Clear the cached snapshot and all pending captures on this device?"
                        : "Discard this unsynchronised capture?"}{" "}
                      This cannot be undone. Server records are retained.
                    </p>
                    <div className="farm-actions">
                      <button
                        onClick={() =>
                          void action(async () => {
                            if (eraseTarget === "device") {
                              await clearFarmDevice();
                              setOfflineEnabled(false);
                              setOutbox([]);
                            } else {
                              await removeFarmOutbox(eraseTarget);
                              await reloadOutbox();
                            }
                            setEraseTarget(undefined);
                            setNotice("Device data cleared as requested.");
                          })
                        }
                      >
                        Confirm removal
                      </button>
                      <button
                        className="farm-secondary"
                        onClick={() => setEraseTarget(undefined)}
                      >
                        Keep data
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="farm-card">
                <h2>Device outbox</h2>
                {outbox.length === 0 && <p>No pending captures.</p>}
                {outbox.map((item) => (
                  <article className="farm-row" key={item.id}>
                    <div>
                      <strong>
                        {item.operation} · {item.status}
                      </strong>
                      <p>
                        {new Date(item.createdAt).toLocaleString()} ·{" "}
                        {item.error || "Awaiting server validation"}
                      </p>
                      <details>
                        <summary>Review capture</summary>
                        <dl className="farm-values">
                          {Object.entries(item.payload)
                            .filter(
                              ([key]) =>
                                !["dataUrl", "submissionId"].includes(key),
                            )
                            .map(([key, value]) => (
                              <div key={key}>
                                <dt>{key}</dt>
                                <dd>
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </dd>
                              </div>
                            ))}
                        </dl>
                      </details>
                    </div>
                    <div className="farm-actions">
                      {item.status !== "pending" && (
                        <button
                          onClick={() =>
                            void action(async () => {
                              await saveFarmOutbox({
                                ...item,
                                status: "pending",
                                error: undefined,
                              });
                              await reloadOutbox();
                            })
                          }
                        >
                          Retry unchanged
                        </button>
                      )}
                      <button
                        className="farm-secondary"
                        onClick={() => setEraseTarget(item.id)}
                      >
                        Discard capture
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
