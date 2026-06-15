// Bakes the homepage's HTML into dist/index.html so search engines, social
// scrapers and AI agents that don't run JavaScript see the real content instead
// of an empty <div id="root">. Runs after `vite build` (client) and
// `vite build --ssr src/entry-server.tsx` (server). The client bundle still
// takes over on load, so users get the full interactive page.
//
// Run automatically as part of `npm run build`.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(here, '../dist/index.html');
const serverEntry = resolve(here, '../dist-ssr/entry-server.js');

const { render, faqJsonLd } = await import(pathToFileURL(serverEntry).href);

let html = readFileSync(htmlPath, 'utf8');

// 1) Inject the prerendered app markup into the root container.
const appHtml = render();
const ROOT = '<div id="root"></div>';
if (!html.includes(ROOT)) {
  throw new Error(`prerender: could not find ${ROOT} in dist/index.html`);
}
html = html.replace(ROOT, `<div id="root">${appHtml}</div>`);

// 2) Inject the data-derived FAQPage JSON-LD just before </head>. Escaping "<"
//    keeps a stray "</script>" in the copy from breaking out of the tag.
const faq = JSON.stringify(faqJsonLd()).replace(/</g, '\\u003c');
const faqScript = `    <script type="application/ld+json">${faq}</script>\n  </head>`;
html = html.replace('</head>', faqScript);

writeFileSync(htmlPath, html);
console.log(`Prerendered ${htmlPath} (${Buffer.byteLength(html)} bytes)`);
