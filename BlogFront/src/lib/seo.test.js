import { beforeEach, describe, expect, it } from 'vitest';
import { applySeo, excerptFromHtml, siteUrl } from './seo';

const meta = (name) =>
  document.head.querySelector(`meta[${name.startsWith('og:') ? 'property' : 'name'}="${name}"]`);

beforeEach(() => {
  document.head.innerHTML = '';
});

describe('applySeo', () => {
  it('sets the document title and description', () => {
    applySeo({ title: 'Posts · My Blog', description: 'All posts' });

    expect(document.title).toBe('Posts · My Blog');
    expect(meta('description')?.getAttribute('content')).toBe('All posts');
  });

  it('falls back to the blog title', () => {
    applySeo({});

    expect(document.title).toBe('My Blog');
    expect(meta('og:site_name')?.getAttribute('content')).toBe('My Blog');
  });

  it('marks private pages noindex and restores indexing next page', () => {
    applySeo({ title: 'Login', noindex: true });
    expect(meta('robots')?.getAttribute('content')).toBe('noindex, nofollow');

    applySeo({ title: 'Posts' });
    expect(meta('robots')?.getAttribute('content')).toBe('index, follow');
  });

  it('upserts tags instead of duplicating them', () => {
    applySeo({ title: 'First' });
    applySeo({ title: 'Second' });

    expect(document.head.querySelectorAll('meta[property="og:title"]')).toHaveLength(1);
    expect(meta('og:title')?.getAttribute('content')).toBe('Second');
  });

  it('injects, replaces and removes JSON-LD per page', () => {
    applySeo({ jsonLd: { '@type': 'BlogPosting' } });
    let node = document.getElementById('seo-jsonld');
    expect(node?.type).toBe('application/ld+json');
    expect(JSON.parse(node.textContent)['@type']).toBe('BlogPosting');

    applySeo({ jsonLd: { '@type': 'WebSite' } });
    expect(document.querySelectorAll('#seo-jsonld')).toHaveLength(1);
    expect(JSON.parse(document.getElementById('seo-jsonld').textContent)['@type']).toBe('WebSite');

    applySeo({ title: 'Posts' });
    expect(document.getElementById('seo-jsonld')).toBeNull();
  });

  it('prefixes relative og images with the current origin', () => {
    applySeo({ title: 'Post', image: '/api/Upload/download/abc.jpg' });

    expect(meta('og:image')?.getAttribute('content')).toBe(`${window.location.origin}/api/Upload/download/abc.jpg`);
    expect(meta('twitter:card')?.getAttribute('content')).toBe('summary_large_image');
  });
});

describe('siteUrl', () => {
  it('stays empty until VITE_SITE_URL is configured at build time', () => {
    expect(siteUrl('/posts')).toBe('');
  });

  it('composes absolute URLs from the configured site URL', () => {
    expect(siteUrl('/posts/1', { base: 'https://blog.example' })).toBe('https://blog.example/posts/1');
    expect(siteUrl('/', { base: 'https://blog.example' })).toBe('https://blog.example');
  });
});

describe('excerptFromHtml', () => {
  it('strips markup and condenses whitespace', () => {
    expect(excerptFromHtml('<p>Hello</p><p>   world</p>', 160)).toBe('Hello world');
  });

  it('truncates with an ellipsis under the limit', () => {
    const actual = excerptFromHtml(`A${'<b>x</b>'.repeat(100)}`, 10);
    expect(actual).toHaveLength(10);
    expect(actual.endsWith('…')).toBe(true);
  });
});
