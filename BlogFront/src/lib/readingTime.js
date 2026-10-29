import { htmlToText } from './sanitize';

export const WORDS_PER_MINUTE = 200;

/**
 * Estimates reading time for rendered post HTML. Empty content returns 0 so
 * callers can hide the metric instead of showing a misleading "1 min".
 */
export function getReadingTime(html) {
  const text = htmlToText(html ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return 0;

  const words = text.split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function formatReadingTime(minutes) {
  if (!minutes) return '';
  return `${minutes} min read`;
}
