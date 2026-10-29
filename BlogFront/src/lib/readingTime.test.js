import { describe, expect, it } from 'vitest';
import { formatReadingTime, getReadingTime } from './readingTime';

const words = (count) => Array.from({ length: count }, () => 'word').join(' ');

describe('reading time', () => {
  it('returns 0 for empty content', () => {
    expect(getReadingTime('')).toBe(0);
    expect(getReadingTime('<p>   </p>')).toBe(0);
    expect(formatReadingTime(0)).toBe('');
  });

  it('rounds up to the next minute', () => {
    expect(getReadingTime(`<p>${words(201)}</p>`)).toBe(2);
    expect(formatReadingTime(2)).toBe('2 min read');
  });

  it('ignores markup when counting words', () => {
    expect(getReadingTime('<p>Hello <strong>world</strong></p>')).toBe(1);
  });
});
