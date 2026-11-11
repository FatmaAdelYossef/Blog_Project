import { describe, expect, it } from 'vitest';
import {
  applySiteSettings,
  cacheSiteSettings,
  getCachedSiteSettings,
} from './siteTheme';

const root = document.documentElement;

describe('siteTheme', () => {
  it('clears accent vars when no custom colors are set', () => {
    root.style.setProperty('--color-accent', '#123456');
    applySiteSettings({ accentColorLight: null, accentColorDark: null }, false);
    expect(root.style.getPropertyValue('--color-accent')).toBe('');
  });

  it('applies the light accent and derived hover/soft vars', () => {
    applySiteSettings({ accentColorLight: '#336699' }, false);
    expect(root.style.getPropertyValue('--color-accent')).toBe('#336699');
    expect(root.style.getPropertyValue('--color-accent-hover')).toContain('color-mix');
    expect(root.style.getPropertyValue('--color-accent-soft')).toContain('color-mix');
  });

  it('prefers the dark accent in dark mode and falls back to light', () => {
    applySiteSettings({ accentColorLight: '#336699', accentColorDark: '#aabbcc' }, true);
    expect(root.style.getPropertyValue('--color-accent')).toBe('#aabbcc');

    applySiteSettings({ accentColorLight: '#336699', accentColorDark: null }, true);
    expect(root.style.getPropertyValue('--color-accent')).toBe('#336699');
  });

  it('does not leak a dark-only accent into light mode', () => {
    applySiteSettings({ accentColorLight: null, accentColorDark: '#aabbcc' }, false);
    expect(root.style.getPropertyValue('--color-accent')).toBe('');
  });

  it('round-trips settings through the localStorage cache', () => {
    const settings = { siteName: 'Test Blog', accentColorLight: '#123456' };
    cacheSiteSettings(settings);
    expect(getCachedSiteSettings()).toEqual(settings);
    cacheSiteSettings(null);
    expect(getCachedSiteSettings()).toBeNull();
  });
});
