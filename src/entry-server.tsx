/**
 * Server entry used at build time to prerender the homepage to fully static
 * HTML + CSS (see scripts/prerender.mjs). The landing page ships no client-side
 * JavaScript: the markup is baked in here and Ant Design's styles are extracted
 * to <style> tags, so crawlers, AI agents and people all get the finished page on
 * first paint with nothing to download or execute. (The two interactive bits —
 * the FAQ accordion and the US/UK toggle — are native <details> and a CSS :has()
 * radio toggle, so they work without a runtime.)
 */
import { renderToString } from 'react-dom/server';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import App from './App';
import { AppProviders } from './providers/AppProviders';
import { FAQS } from './data/faqs';

/**
 * Render the full marketing page to static HTML plus the Ant Design styles it
 * uses. `styles` is a string of <style> tags to drop into <head>; without it the
 * antd components would be unstyled once we stop shipping the runtime.
 */
export function render(): { html: string; styles: string } {
  const cache = createCache();
  const html = renderToString(
    <StyleProvider cache={cache}>
      <AppProviders>
        <App />
      </AppProviders>
    </StyleProvider>,
  );
  return { html, styles: extractStyle(cache) };
}

/**
 * schema.org FAQPage built from the same copy the page renders, so the structured
 * data search engines and AI agents read can never drift from the visible FAQ.
 */
export function faqJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://threadwick.com/#faq',
    inLanguage: 'en',
    isPartOf: { '@id': 'https://threadwick.com/#website' },
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}
