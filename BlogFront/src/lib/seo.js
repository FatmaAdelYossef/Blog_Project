// Single place that owns the document head for SEO and social previews.
// VITE_SITE_URL (set at build time, see DEPLOYMENT.md) is the public https URL;
// when it is empty (pre-domain) canonical/OG url tags are simply skipped.

const SITE_URL = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');

export function siteUrl(pathname = '', { base = SITE_URL } = {}) {
  if (!base) return '';
  const origin = base.replace(/\/$/, '');
  if (pathname === '/') return origin;
  return `${origin}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function upsertMeta(attrName, attrValue, content) {
  let meta = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (meta === null) {
    meta = document.createElement('meta');
    meta.setAttribute(attrName, attrValue);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content ?? '');
}

function upsertLink(rel, href) {
  let link = document.head.querySelector(`link[rel="${rel}"]`);
  if (link === null) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/**
 * Applies title, description, canonical, Open Graph / Twitter tags and optional
 * JSON-LD to the document head. Called from every routed page's effect.
 */
export function applySeo({
  title,
  description,
  canonical,
  image,
  type = 'website',
  noindex = false,
  jsonLd = null,
} = {}) {
  if (title) {
    document.title = title;
    upsertMeta('property', 'og:title', title);
    upsertMeta('name', 'twitter:title', title);
  } else {
    document.title = 'My Blog';
    upsertMeta('property', 'og:title', 'My Blog');
    upsertMeta('name', 'twitter:title', 'My Blog');
  }

  upsertMeta('property', 'og:site_name', 'My Blog');
  upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');

  if (description) {
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:description', description);
    upsertMeta('name', 'twitter:description', description);
  }

  if (image) {
    const src = image.startsWith('/') && typeof window !== 'undefined' && location.origin
      ? `${location.origin}${image}`
      : image;
    upsertMeta('property', 'og:image', src);
    upsertMeta('name', 'twitter:image', src);
  }

  upsertMeta('property', 'og:type', type);

  const url = canonical ?? siteUrl(window.location?.pathname ?? '');
  if (url) {
    upsertMeta('property', 'og:url', url);
    upsertLink('canonical', url);
  }

  upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

  const jsonLdTag = document.getElementById('seo-jsonld');
  if (jsonLd !== null) {
    let node = jsonLdTag;
    if (node === null) {
      node = document.createElement('script');
      node.type = 'application/ld+json';
      node.id = 'seo-jsonld';
      document.head.appendChild(node);
    }
    node.textContent = JSON.stringify(jsonLd);
  } else if (jsonLdTag !== null) {
    // The page navigating away no longer owns structured data: remove stale tags.
    jsonLdTag.remove();
  }
}

import { htmlToText } from './sanitize';

/** Strips HTML tags for meta descriptions. */
export function excerptFromHtml(html, maxLength = 160) {
  const text = htmlToText(html ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
