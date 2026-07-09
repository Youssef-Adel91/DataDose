'use client';

/**
 * useFdaAlerts — Sprint 2 Kafka SSE consumer hook
 *
 * Connects an EventSource to NEXT_PUBLIC_BACKEND_URL/api/fda-alerts/stream.
 * On each incoming message it:
 *   1. Parses the JSON payload from the Kafka "fda-alerts" topic.
 *   2. Fires a sonner toast with the appropriate severity color.
 *   3. Appends the alert to local state so callers can build a notification list.
 *
 * Usage:
 *   const { alerts, connected } = useFdaAlerts();
 *   // Pass `alerts` to <Topbar notifications={alerts} />
 *
 * Expected Kafka message JSON shape:
 *   {
 *     "drug":     "Warfarin",
 *     "warning":  "New black-box warning issued by FDA",
 *     "severity": "critical" | "major" | "minor" | "info"
 *   }
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FdaAlert {
  id: string;
  drug: string;
  warning: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  receivedAt: string;
  read: boolean;
}

interface UseFdaAlertsOptions {
  /** Override the backend URL (defaults to NEXT_PUBLIC_BACKEND_URL or empty string) */
  backendUrl?: string;
  /** Max alerts to keep in local state before dropping oldest (default: 50) */
  maxAlerts?: number;
  /** Skip connecting — useful to disable in non-clinical dashboard contexts */
  enabled?: boolean;
}

interface UseFdaAlertsReturn {
  alerts: FdaAlert[];
  connected: boolean;
  unreadCount: number;
  /** Mark all alerts as read (e.g., when the user opens the notification panel) */
  markAllRead: () => void;
}

// ---------------------------------------------------------------------------
// Toast appearance per severity
// ---------------------------------------------------------------------------

const TOAST_CONFIG = {
  critical: {
    fn: toast.error,
    icon: '🚨',
    duration: 12000,
  },
  major: {
    fn: toast.warning,
    icon: '⚠️',
    duration: 8000,
  },
  minor: {
    fn: toast.message,
    icon: '💊',
    duration: 5000,
  },
  info: {
    fn: toast.info,
    icon: 'ℹ️',
    duration: 5000,
  },
} as const;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFdaAlerts({
  backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? '',
  maxAlerts = 50,
  enabled = true,
}: UseFdaAlertsOptions = {}): UseFdaAlertsReturn {
  const [alerts, setAlerts] = useState<FdaAlert[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || !backendUrl) return;

    const url = `${backendUrl}/api/fda-alerts/stream`;

    function connect() {
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        setConnected(true);
        console.info('[useFdaAlerts] SSE connected to', url);
      };

      es.onmessage = (event: MessageEvent) => {
        // Skip keep-alive comments (empty data or ": ping" comments are
        // handled by the browser's EventSource automatically; onmessage only
        // fires for "data:" lines).
        if (!event.data || event.data.trim() === '') return;

        let payload: Partial<FdaAlert>;
        try {
          payload = JSON.parse(event.data);
        } catch {
          console.warn('[useFdaAlerts] Failed to parse SSE payload:', event.data);
          return;
        }

        const severity = (payload.severity ?? 'info') as FdaAlert['severity'];
        const drug     = payload.drug    ?? 'Unknown Drug';
        const warning  = payload.warning ?? 'FDA safety alert received';

        // Fire sonner toast
        const cfg = TOAST_CONFIG[severity] ?? TOAST_CONFIG.info;
        cfg.fn(`${cfg.icon} FDA Alert — ${drug}`, {
          description: warning,
          duration: cfg.duration,
        });

        // Append to local alert list (newest first, capped at maxAlerts)
        const newAlert: FdaAlert = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          drug,
          warning,
          severity,
          receivedAt: new Date().toISOString(),
          read: false,
        };

        setAlerts((prev) => [newAlert, ...prev].slice(0, maxAlerts));
      };

      es.onerror = (err) => {
        console.error('[useFdaAlerts] SSE error — reconnecting in 5 s', err);
        setConnected(false);
        es.close();
        // Auto-reconnect after 5 seconds (Kafka might be temporarily unavailable)
        setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [backendUrl, enabled, maxAlerts]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const markAllRead = () =>
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));

  return { alerts, connected, unreadCount, markAllRead };
}
