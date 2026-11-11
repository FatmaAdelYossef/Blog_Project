import DOMPurify from 'dompurify';

// Default HTML profile keeps Quill's classes and inline styles while stripping scripts and event handlers.
export const sanitizeHtml = (html) => DOMPurify.sanitize(html || '');

export const htmlToText = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(sanitizeHtml(html), 'text/html');
    return doc.body.textContent || '';
};
