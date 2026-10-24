import { describe, expect, it } from 'vitest';
import { htmlToText, sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('strips script elements', () => {
    const result = sanitizeHtml('<p>Hello</p><script>alert("xss")</script>');

    expect(result).toContain('<p>Hello</p>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert');
  });

  it('removes inline event handlers', () => {
    const result = sanitizeHtml('<img src="cover.png" onerror="alert(1)">');

    expect(result).not.toContain('onerror');
    expect(result).toContain('src="cover.png"');
  });

  it('removes javascript: URLs', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>');

    expect(result).not.toContain('javascript:');
    expect(result).toContain('click');
  });

  it('keeps the markup and classes produced by the editor', () => {
    const result = sanitizeHtml('<p class="ql-align-center"><strong>Keep</strong> me</p>');

    expect(result).toContain('class="ql-align-center"');
    expect(result).toContain('<strong>Keep</strong>');
  });

  it('treats empty input as an empty string', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
    expect(sanitizeHtml('')).toBe('');
  });
});

describe('htmlToText', () => {
  it('returns readable text without tags', () => {
    const result = htmlToText('<p>Hello <strong>world</strong></p>');

    expect(result).toBe('Hello world');
  });

  it('drops script content', () => {
    const result = htmlToText('<p>Safe</p><script>steal()</script>');

    expect(result).toBe('Safe');
  });

  it('treats empty input as an empty string', () => {
    expect(htmlToText('')).toBe('');
    expect(htmlToText(null)).toBe('');
  });
});
