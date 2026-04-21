import { describe, expect, it, vi } from "vitest";
import { parseClientRuntimeConfig } from "../clients/runtime-config";
import { connectAlertsLiveUpdates } from "../features/alerts-live-updates";

class FakeWebSocket {
  private listeners = new Map<string, Array<(event?: { readonly data: unknown }) => void>>();

  constructor(public readonly url: string) {}

  addEventListener(type: "open", listener: () => void): void;
  addEventListener(type: "error", listener: () => void): void;
  addEventListener(type: "close", listener: () => void): void;
  addEventListener(type: "message", listener: (event: { readonly data: unknown }) => void): void;
  addEventListener(
    type: "open" | "error" | "close" | "message",
    listener: ((event?: { readonly data: unknown }) => void) | ((event: { readonly data: unknown }) => void)
  ) {
    const existing = this.listeners.get(type) ?? [];
    existing.push(listener as (event?: { readonly data: unknown }) => void);
    this.listeners.set(type, existing);
  }

  emit(type: "open" | "error" | "close" | "message", event?: { readonly data: unknown }) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }

  close() {
    this.emit("close");
  }
}

describe("Alerts live updates connector", () => {
  it("stays disabled by default and does not try to connect", () => {
    const onEvent = vi.fn();
    const onStateChange = vi.fn();
    const webSocketFactory = vi.fn();

    const connection = connectAlertsLiveUpdates({
      config: parseClientRuntimeConfig({}),
      onEvent,
      onStateChange,
      webSocketFactory
    });

    expect(onStateChange).toHaveBeenCalledWith("disabled");
    expect(onEvent).not.toHaveBeenCalled();
    expect(webSocketFactory).not.toHaveBeenCalled();

    connection.disconnect();
  });

  it("connects on the opt-in HTTP path and forwards stable alert events", () => {
    const states: string[] = [];
    const events: unknown[] = [];
    let socket: FakeWebSocket | undefined;

    const connection = connectAlertsLiveUpdates({
      config: parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT: "direct",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL: "http://localhost:4000",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES: "true"
      }),
      onEvent: (event) => {
        events.push(event);
      },
      onStateChange: (state) => {
        states.push(state);
      },
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url);
        return socket;
      }
    });

    expect(socket?.url).toBe("ws://localhost:4000/ws/alerts");

    socket?.emit("open");
    socket?.emit("message", {
      data: JSON.stringify({
        source: "alerts",
        eventType: "alert_lifecycle_changed",
        timestamp: "2026-04-22T09:15:00.000Z",
        alertId: "alert-1"
      })
    });

    expect(states).toContain("connecting");
    expect(states).toContain("active");
    expect(events).toHaveLength(1);

    connection.disconnect();
  });

  it("fails safely when the live-update payload is malformed", () => {
    const states: string[] = [];
    let socket: FakeWebSocket | undefined;

    const connection = connectAlertsLiveUpdates({
      config: parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT: "direct",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL: "http://localhost:4000",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES: "true"
      }),
      onEvent: vi.fn(),
      onStateChange: (state) => {
        states.push(state);
      },
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url);
        return socket;
      }
    });

    socket?.emit("message", { data: "{not-json" });

    expect(states).toContain("degraded");

    connection.disconnect();
  });

  it("keeps connection failures distinct from degraded payload handling", () => {
    const states: string[] = [];
    let socket: FakeWebSocket | undefined;

    const connection = connectAlertsLiveUpdates({
      config: parseClientRuntimeConfig({
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_MODE: "http",
        NEXT_PUBLIC_AQUAPULSE_WEB_ENABLE_FETCH_HTTP: "true",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_TRANSPORT: "direct",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_HTTP_BASE_URL: "http://localhost:4000",
        NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES: "true"
      }),
      onEvent: vi.fn(),
      onStateChange: (state) => {
        states.push(state);
      },
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url);
        return socket;
      }
    });

    socket?.emit("error");
    socket?.emit("close");

    expect(states).toContain("unavailable");
    expect(states.at(-1)).toBe("unavailable");

    connection.disconnect();
  });
});
