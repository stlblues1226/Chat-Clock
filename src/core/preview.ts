import type { Settings } from './settings';
import { tick, wantsFullBlock, type WristState } from './session-tracker';
import { renderCompact, renderFullBlock } from './template-renderer';

export interface Preview {
  text: string;
  isFull: boolean;
  elapsedMs: number | null;
  sessionMs: number | null;
}

/**
 * What WOULD accompany a message sent right now — without mutating any
 * state. Used by the popup preview.
 */
export function buildPreview(settings: Settings, wrist: WristState, nowMs: number): Preview {
  const simulated = tick(wrist, nowMs, settings.injection.sessionResetMinutes);
  const isFull = wantsFullBlock(
    simulated,
    settings.injection.frequency,
    settings.injection.fullBlockAfterMinutes,
  );
  const input = {
    settings,
    now: new Date(nowMs),
    elapsedMs: simulated.elapsedMs,
    sessionMs: simulated.sessionMs,
  };
  return {
    text: isFull ? renderFullBlock(input) : renderCompact(input),
    isFull,
    elapsedMs: simulated.elapsedMs,
    sessionMs: simulated.sessionMs,
  };
}

/**
 * Live session figures for display (popup complication rows) — the session
 * seen as it stands, not as it would tick.
 */
export function liveSession(
  wrist: WristState,
  nowMs: number,
  resetMinutes: number,
): { elapsedMs: number | null; sessionMs: number | null } {
  if (wrist.lastMessageAt === null || wrist.sessionStartedAt === null) {
    return { elapsedMs: null, sessionMs: null };
  }
  const gap = nowMs - wrist.lastMessageAt;
  if (gap > resetMinutes * 60000) return { elapsedMs: null, sessionMs: null };
  return { elapsedMs: gap, sessionMs: nowMs - wrist.sessionStartedAt };
}
