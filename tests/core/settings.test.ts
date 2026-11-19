import { describe, expect, it } from 'vitest';
import {
  COMPLICATION_IDS,
  SCHEMA_VERSION,
  defaultSettings,
  migrate,
} from '../../src/core/settings';

describe('defaultSettings', () => {
  it('covers every complication id exactly once', () => {
    const keys = Object.keys(defaultSettings().complications).sort();
    expect(keys).toEqual([...COMPLICATION_IDS].sort());
  });

  it('matches the validated V1 experience (Chronographe on Sobre, session-start)', () => {
    const d = defaultSettings();
    expect(d.crownRunning).toBe(true);
    expect(d.dial).toBe('studio');
    expect(d.complications.chronograph).toBe(true);
    expect(d.complications.session).toBe(true);
    expect(d.complications.isoWeek).toBe(false);
    expect(d.injection.frequency).toBe('session-start');
    expect(d.injection.blockLanguage).toBe('en');
  });
});

describe('migrate', () => {
  it('returns defaults for null, garbage, or missing version', () => {
    expect(migrate(null)).toEqual(defaultSettings());
    expect(migrate('corrupt')).toEqual(defaultSettings());
    expect(migrate({ dial: 'paddock' })).toEqual(defaultSettings());
  });

  it('preserves user choices at current version and fills missing fields', () => {
    const partial = {
      schemaVersion: SCHEMA_VERSION,
      dial: 'lab',
      complications: { moonPhase: true, session: false },
    };
    const out = migrate(partial);
    expect(out.dial).toBe('lab');
    // Gravure is the single source of truth: stored on/off switches are ignored.
    expect(out.complications).toEqual(defaultSettings().complications);
    // Untouched fields come from defaults:
    expect(out.injection.sessionResetMinutes).toBe(30);
  });

  it('maps legacy pre-release dial ids to the final collection', () => {
    expect(migrate({ schemaVersion: SCHEMA_VERSION, dial: 'sobre' }).dial).toBe('studio');
    expect(migrate({ schemaVersion: SCHEMA_VERSION, dial: 'paddock' }).dial).toBe('lab');
    expect(migrate({ schemaVersion: SCHEMA_VERSION, dial: 'unknown-dial' }).dial).toBe('studio');
  });

  it('never returns an unknown schema version', () => {
    expect(migrate({ schemaVersion: 999 }).schemaVersion).toBe(SCHEMA_VERSION);
  });
});

describe('time and date format settings', () => {
  it('default to the original look', () => {
    const d = defaultSettings();
    expect(d.injection.timeFormat).toBe('24h');
    expect(d.injection.dateFormat).toBe('auto');
  });
  it('fill in for settings saved by an older version', () => {
    const old = { schemaVersion: SCHEMA_VERSION, injection: { frequency: 'every-message' } };
    const out = migrate(old);
    expect(out.injection.timeFormat).toBe('24h');
    expect(out.injection.dateFormat).toBe('auto');
    expect(out.injection.frequency).toBe('every-message');
  });
  it('keep valid choices and reject invalid ones', () => {
    const good = migrate({
      schemaVersion: SCHEMA_VERSION,
      injection: { timeFormat: '12h', dateFormat: 'iso' },
    });
    expect(good.injection.timeFormat).toBe('12h');
    expect(good.injection.dateFormat).toBe('iso');
    const bad = migrate({
      schemaVersion: SCHEMA_VERSION,
      injection: { timeFormat: '99h', dateFormat: 'nonsense' },
    });
    expect(bad.injection.timeFormat).toBe('24h');
    expect(bad.injection.dateFormat).toBe('auto');
  });
});
