import { describe, expect, it } from 'vitest';
import { defaultSettings, type Settings } from '../../src/core/settings';
import { renderCompact, renderFullBlock } from '../../src/core/template-renderer';

/** The instant of the validated example: Thu 16 July 2026, 14:32 in Luxembourg. */
const EXAMPLE_NOW = new Date(Date.UTC(2026, 6, 16, 12, 32)); // 14:32 CEST
const EXAMPLE_TZ = 'Europe/Luxembourg';
const MIN = 60000;

function exampleInput(overrides: Partial<Settings> = {}) {
  const settings: Settings = { ...defaultSettings(), ...overrides };
  return {
    settings,
    now: EXAMPLE_NOW,
    timeZone: EXAMPLE_TZ,
    elapsedMs: 12 * MIN,
    sessionMs: 103 * MIN, // 1 h 43
  };
}

describe('renderFullBlock — the golden example', () => {
  it('reproduces the validated specification block', () => {
    const input = exampleInput();
    input.settings.complications.isoWeek = true; // the example shows ISO week
    expect(renderFullBlock(input)).toBe(
      [
        'Current context',
        'Date: Thursday 07/16/2026',
        'Time: 14:32',
        'Timezone: Europe/Luxembourg',
        'ISO Week: 29',
        'Elapsed since previous message: 12 minutes',
        'Current session: 1 hour 43 minutes',
        'Use this information whenever it is relevant.',
      ].join('\n'),
    );
  });

  it('renders in French when blockLanguage is fr', () => {
    const input = exampleInput();
    input.settings.injection.blockLanguage = 'fr';
    const block = renderFullBlock(input);
    expect(block).toContain('Contexte actuel');
    expect(block).toContain('Date: jeudi 16 juillet 2026');
    expect(block).toContain('Écoulé depuis le message précédent: 12 minutes');
    expect(block).toContain('Session en cours: 1 heure 43 minutes');
  });

  it('omits chronograph and session lines at session start (null values)', () => {
    const input = { ...exampleInput(), elapsedMs: null, sessionMs: 0 };
    const block = renderFullBlock(input);
    expect(block).not.toContain('Elapsed since previous message');
    expect(block).toContain('Current session: less than a minute');
  });

  it('respects disabled complications', () => {
    const input = exampleInput();
    input.settings.complications.timezone = false;
    input.settings.complications.weekday = false;
    const block = renderFullBlock(input);
    expect(block).not.toContain('Timezone');
    expect(block).toContain('Date: 07/16/2026'); // no weekday merged
  });

  it('renders the charm complications when enabled', () => {
    const input = exampleInput();
    input.settings.complications.season = true;
    input.settings.complications.timeOfDay = true;
    input.settings.complications.moonPhase = true;
    const block = renderFullBlock(input);
    expect(block).toContain('Season: Summer');
    expect(block).toContain('Time of day: Afternoon');
    expect(block).toMatch(/Moon phase: (New Moon|Waxing|First|Full|Waning|Last).*/);
  });
});

describe('renderFullBlock — custom template', () => {
  it('shows every chip in the template, whatever the stored switches say', () => {
    const input = exampleInput();
    input.settings.complications.session = false; // stale switch from the old popup
    input.settings.complications.moonPhase = false;
    input.settings.injection.customTemplate =
      'It is {time} on {weekday} ({timezone}). Session: {session}.';
    expect(renderFullBlock(input)).toBe(
      'It is 14:32 on Thursday (Europe/Luxembourg). Session: 1 hour 43 minutes.',
    );
  });

  it('renders chips that are off in the default layout', () => {
    const input = exampleInput();
    input.settings.injection.customTemplate = 'Week {isoWeek}, {season}';
    expect(renderFullBlock(input)).toBe('Week 29, Summer');
  });

  it('drops lines whose chips have nothing to show', () => {
    const input = { ...exampleInput(), elapsedMs: null };
    input.settings.injection.customTemplate = ['It is {time}.', 'Last message: {elapsed} ago.'].join(
      '\n',
    );
    expect(renderFullBlock(input)).toBe('It is 14:32.');
  });

  it('leaves unknown tokens visible so the user can spot typos', () => {
    const input = exampleInput();
    input.settings.injection.customTemplate = 'Hello {tiem}';
    expect(renderFullBlock(input)).toBe('Hello {tiem}');
  });
});

describe('renderCompact', () => {
  it('renders the compact form', () => {
    expect(renderCompact(exampleInput())).toBe('⌚ Current time: 14:32 (+12 min)');
  });
  it('omits elapsed at session start', () => {
    expect(renderCompact({ ...exampleInput(), elapsedMs: null })).toBe('⌚ Current time: 14:32');
  });
  it('formats hours in short durations', () => {
    expect(renderCompact({ ...exampleInput(), elapsedMs: 103 * MIN })).toBe(
      '⌚ Current time: 14:32 (+1 h 43)',
    );
  });
});

describe('time and date formats', () => {
  function withFormats(timeFormat: '24h' | '12h', dateFormat: Settings['injection']['dateFormat']) {
    const input = exampleInput();
    input.settings = {
      ...input.settings,
      injection: {
        ...input.settings.injection,
        timeFormat,
        dateFormat,
        customTemplate: '{date} {time}',
      },
    };
    return input;
  }

  it('defaults keep the original look (MM/DD/YYYY, 24-hour)', () => {
    expect(renderFullBlock(withFormats('24h', 'auto'))).toBe('07/16/2026 14:32');
  });
  it('shows the 12-hour clock with AM/PM', () => {
    expect(renderFullBlock(withFormats('12h', 'auto'))).toBe('07/16/2026 2:32 PM');
  });
  it('uses a plain space before AM/PM', () => {
    expect(renderFullBlock(withFormats('12h', 'auto'))).not.toMatch(/[  ]/);
  });
  it('handles midnight and noon in 12-hour mode', () => {
    const midnight = withFormats('12h', 'auto');
    midnight.now = new Date(Date.UTC(2026, 6, 15, 22, 5)); // 00:05 CEST
    expect(renderFullBlock(midnight)).toBe('07/16/2026 12:05 AM');
    const noon = withFormats('12h', 'auto');
    noon.now = new Date(Date.UTC(2026, 6, 16, 10, 0)); // 12:00 CEST
    expect(renderFullBlock(noon)).toBe('07/16/2026 12:00 PM');
  });
  it('renders every date format', () => {
    expect(renderFullBlock(withFormats('24h', 'numeric'))).toBe('07/16/2026 14:32');
    expect(renderFullBlock(withFormats('24h', 'short'))).toBe('Jul 16, 2026 14:32');
    expect(renderFullBlock(withFormats('24h', 'long'))).toBe('July 16, 2026 14:32');
    expect(renderFullBlock(withFormats('24h', 'dayfirst'))).toBe('16 July 2026 14:32');
    expect(renderFullBlock(withFormats('24h', 'iso'))).toBe('2026-07-16 14:32');
  });
  it('applies the 12-hour clock to the compact form too', () => {
    const input = withFormats('12h', 'auto');
    expect(renderCompact(input)).toBe('⌚ Current time: 2:32 PM (+12 min)');
  });
});
