import { COMPLICATION_IDS, type ComplicationId } from '../settings';
import { humanizeDuration } from '../format';
import {
  civilInTz,
  isoWeekOf,
  moonPhaseIndex,
  seasonOf,
  timeOfDayOf,
  type Season,
  type TimeOfDay,
} from '../time';
import type { BlockLanguage, Complication, ComplicationContext } from './types';

const INTL_LOCALE: Record<BlockLanguage, string> = { en: 'en-GB', fr: 'fr-FR' };

const SEASON_NAMES: Record<BlockLanguage, Record<Season, string>> = {
  en: { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' },
  fr: { spring: 'Printemps', summer: 'Été', autumn: 'Automne', winter: 'Hiver' },
};

const TIME_OF_DAY_NAMES: Record<BlockLanguage, Record<TimeOfDay, string>> = {
  en: {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    'late-night': 'Late night',
  },
  fr: {
    morning: 'Matin',
    afternoon: 'Après-midi',
    evening: 'Soirée',
    'late-night': 'Nuit avancée',
  },
};

const MOON_PHASE_NAMES: Record<BlockLanguage, string[]> = {
  en: [
    'New Moon',
    'Waxing Crescent',
    'First Quarter',
    'Waxing Gibbous',
    'Full Moon',
    'Waning Gibbous',
    'Last Quarter',
    'Waning Crescent',
  ],
  fr: [
    'Nouvelle lune',
    'Premier croissant',
    'Premier quartier',
    'Gibbeuse croissante',
    'Pleine lune',
    'Gibbeuse décroissante',
    'Dernier quartier',
    'Dernier croissant',
  ],
};

/** Date in the chosen format, in the block's time zone. */
export function formatDate(ctx: ComplicationContext): string {
  const choice = ctx.dateFormat ?? 'auto';
  const fr = ctx.lang === 'fr';
  const tz = ctx.timeZone;
  switch (choice) {
    case 'auto':
      // Original behaviour: English numeric MM/DD/YYYY, French long form.
      return fr
        ? fmt(ctx, { day: 'numeric', month: 'long', year: 'numeric' })
        : new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
          }).format(ctx.now);
    case 'numeric':
      return new Intl.DateTimeFormat(fr ? 'fr-FR' : 'en-US', {
        timeZone: tz,
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      }).format(ctx.now);
    case 'short':
      return new Intl.DateTimeFormat(fr ? 'fr-FR' : 'en-US', {
        timeZone: tz,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(ctx.now);
    case 'long':
      return new Intl.DateTimeFormat(fr ? 'fr-FR' : 'en-US', {
        timeZone: tz,
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(ctx.now);
    case 'dayfirst':
      return new Intl.DateTimeFormat(fr ? 'fr-FR' : 'en-GB', {
        timeZone: tz,
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(ctx.now);
    case 'iso': {
      const c = civilInTz(ctx.now, tz);
      const pad = (n: number): string => String(n).padStart(2, '0');
      return `${c.year}-${pad(c.month)}-${pad(c.day)}`;
    }
  }
}

/** Time of day: "14:32" (24h) or "2:32 PM" (12h). */
export function formatTime(ctx: ComplicationContext): string {
  if (ctx.timeFormat === '12h') {
    // Some engines put a narrow no-break space before AM/PM; use a plain space.
    return new Intl.DateTimeFormat('en-US', {
      timeZone: ctx.timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
      .format(ctx.now)
      .replace(/[\u202f\u00a0]/g, ' ');
  }
  return fmt(ctx, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}

function fmt(ctx: ComplicationContext, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[ctx.lang], {
    timeZone: ctx.timeZone,
    ...options,
  }).format(ctx.now);
}

export const COMPLICATIONS: Record<ComplicationId, Complication> = {
  date: {
    id: 'date',
    label: { en: 'Date', fr: 'Date' },
    value: (ctx) => formatDate(ctx),
  },
  weekday: {
    id: 'weekday',
    label: { en: 'Day', fr: 'Jour' },
    value: (ctx) => fmt(ctx, { weekday: 'long' }),
  },
  clock: {
    id: 'clock',
    label: { en: 'Time', fr: 'Heure' },
    value: (ctx) => formatTime(ctx),
  },
  timezone: {
    id: 'timezone',
    label: { en: 'Timezone', fr: 'Fuseau horaire' },
    value: (ctx) => ctx.timeZone,
  },
  isoWeek: {
    id: 'isoWeek',
    label: { en: 'ISO Week', fr: 'Semaine ISO' },
    value: (ctx) => {
      const c = civilInTz(ctx.now, ctx.timeZone);
      return String(isoWeekOf(c.year, c.month, c.day));
    },
  },
  chronograph: {
    id: 'chronograph',
    label: { en: 'Elapsed since previous message', fr: 'Écoulé depuis le message précédent' },
    value: (ctx) => (ctx.elapsedMs === null ? null : humanizeDuration(ctx.elapsedMs, ctx.lang)),
  },
  session: {
    id: 'session',
    label: { en: 'Current session', fr: 'Session en cours' },
    value: (ctx) => (ctx.sessionMs === null ? null : humanizeDuration(ctx.sessionMs, ctx.lang)),
  },
  season: {
    id: 'season',
    label: { en: 'Season', fr: 'Saison' },
    value: (ctx) => {
      const c = civilInTz(ctx.now, ctx.timeZone);
      return SEASON_NAMES[ctx.lang][seasonOf(c.month)];
    },
  },
  timeOfDay: {
    id: 'timeOfDay',
    label: { en: 'Time of day', fr: 'Moment de la journée' },
    value: (ctx) => {
      const c = civilInTz(ctx.now, ctx.timeZone);
      return TIME_OF_DAY_NAMES[ctx.lang][timeOfDayOf(c.hour)];
    },
  },
  moonPhase: {
    id: 'moonPhase',
    label: { en: 'Moon phase', fr: 'Phase de lune' },
    value: (ctx) => MOON_PHASE_NAMES[ctx.lang][moonPhaseIndex(ctx.now)] ?? null,
  },
};

/** Display/injection order — the settings constant is the single source. */
export const COMPLICATION_ORDER: readonly ComplicationId[] = COMPLICATION_IDS;
