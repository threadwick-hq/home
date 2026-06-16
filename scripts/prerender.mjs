// Bakes the homepage into a fully static dist/index.html: the rendered markup,
// Ant Design's extracted CSS-in-JS styles, the page's own (small) stylesheets
// inlined, and the FAQ structured data — then strips the client JavaScript so the
// page ships zero JS. This is a landing page; its only interactive bits are a
// native <details> FAQ and a CSS :has() toggle, neither of which needs a runtime.
// Search engines, AI agents and people all get the finished, styled page on first
// paint with nothing to download or execute.
//
// It also (a) asserts the output actually contains the expected content — so a
// regression fails the build instead of silently shipping a broken page — and
// (b) regenerates dist/sitemap.xml with a fresh <lastmod>.
//
// Runs after `vite build` (client) + `vite build --ssr src/entry-server.tsx`, as
// part of `npm run build`.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '../dist');
const assetsDir = resolve(distDir, 'assets');
const htmlPath = resolve(distDir, 'index.html');
const sitemapPath = resolve(distDir, 'sitemap.xml');
const serverEntry = resolve(here, '../dist-ssr/entry-server.js');

const { render, faqJsonLd } = await import(pathToFileURL(serverEntry).href);

let html = readFileSync(htmlPath, 'utf8');

// 1) Inject the prerendered app markup into the root container.
//    Function replacers throughout: a string replacement would interpret "$"
//    sequences ($&, $`, $$, …) in the markup / CSS / JSON and corrupt the output
//    if any copy ever contains one.
const { html: appHtml, styles: antdStyles } = render();
const ROOT = '<div id="root"></div>';
if (!html.includes(ROOT)) {
  throw new Error(`prerender: could not find ${ROOT} in dist/index.html`);
}
html = html.replace(ROOT, () => `<div id="root">${appHtml}</div>`);

// 2) Inline the build's own stylesheets so there are no render-blocking CSS
//    requests, then drop the <link>s. The @font-face url(/assets/…) references
//    stay valid (the font files remain on disk).
for (const m of [...html.matchAll(/[ \t]*<link\b[^>]*\brel="stylesheet"[^>]*>\n?/g)]) {
  const tag = m[0];
  const href = tag.match(/href="([^"]+)"/)?.[1];
  if (!href) continue;
  let css;
  try {
    css = readFileSync(resolve(distDir, href.replace(/^\//, '')), 'utf8');
  } catch {
    continue; // leave the link in place if the file can't be read
  }
  html = html.replace(tag, () => `    <style>${css}</style>\n`);
}

// 3) Inject Ant Design's extracted styles last in <head> (so they layer over the
//    inlined base CSS, matching how antd injects at runtime), then the
//    data-derived FAQPage JSON-LD. Escaping "<" keeps a stray "</script>" in the
//    copy from breaking out of the tag.
const faq = JSON.stringify(faqJsonLd()).replace(/</g, '\\u003c');
const headInjection = `    ${antdStyles}\n    <script type="application/ld+json">${faq}</script>\n  </head>`;
html = html.replace('</head>', () => headInjection);

// 4) Preload the above-the-fold web fonts (content-hashed each build, so resolve
//    them from dist/assets) so the hero text paints without a swap delay.
//    crossorigin is required for font preloads to match the CORS font fetch.
const fontFiles = readdirSync(assetsDir);
const fontPreloads = [
  /^space-grotesk-latin-700-normal-.*\.woff2$/, // hero <h1> (display)
  /^inter-latin-400-normal-.*\.woff2$/, // body copy
]
  .map((re) => fontFiles.find((f) => re.test(f)))
  .filter(Boolean)
  .map((f) => `    <link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />\n`)
  .join('');
if (fontPreloads) {
  html = html.replace('  </head>', () => `${fontPreloads}  </head>`);
}

// 5) Strip the client JavaScript: this page is fully static, so the React/antd
//    runtime never loads. Remove the module script and its modulepreload hints.
html = html
  .replace(/[ \t]*<script\b[^>]*\btype="module"[^>]*><\/script>\n?/g, '')
  .replace(/[ \t]*<link\b[^>]*\brel="modulepreload"[^>]*>\n?/g, '');

// 6) Guard against shipping a broken page: the things crawlers, AI agents and
//    people rely on must be present — and the client JS must be gone.
const required = [
  'Design your stitches the way you make them', // hero <h1> — render() produced content
  'Everything in one place', // a feature card — deep content, not just the shell
  'Good to know', // FAQ section heading
  '<details', // the no-JS FAQ accordion
  'Single crochet', // US legend (the CSS-only US/UK toggle renders both)
  'Half treble', // UK legend
  '.ant-', // Ant Design styles were extracted and inlined (step 3)
  '"@type":"FAQPage"', // the FAQ JSON-LD injected in step 3
];
const missing = required.filter((needle) => !html.includes(needle));
if (missing.length > 0) {
  throw new Error(`prerender: output is missing expected content: ${missing.join(', ')}`);
}
if (/type="module"/.test(html)) {
  throw new Error('prerender: a client <script type="module"> survived — the page would ship JS');
}

writeFileSync(htmlPath, html);
console.log(`Prerendered ${htmlPath} (${Buffer.byteLength(html)} bytes)`);

// 7) Delete the now-orphaned client JS and CSS chunks (CSS is inlined; JS is
//    unused) so the static deploy carries only what it serves. Fonts/images stay.
const orphans = readdirSync(assetsDir).filter((f) => f.endsWith('.js') || f.endsWith('.css'));
for (const f of orphans) rmSync(resolve(assetsDir, f));
if (orphans.length) console.log(`Removed ${orphans.length} orphaned JS/CSS chunk(s): page is fully static`);

// 8) Regenerate the sitemap with a real <lastmod> — the date of the latest commit
//    (what actually changed the site), falling back to the build date.
let lastmod;
try {
  lastmod = execSync('git log -1 --format=%cs', { cwd: here }).toString().trim();
} catch {
  lastmod = undefined;
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod ?? '')) {
  lastmod = new Date().toISOString().slice(0, 10);
}

const urls = [
  { loc: 'https://threadwick.com/', changefreq: 'monthly', priority: '1.0' },
  { loc: 'https://threadwick.com/studio', changefreq: 'weekly', priority: '0.9' },
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`;
writeFileSync(sitemapPath, sitemap);
console.log(`Wrote ${sitemapPath} (lastmod ${lastmod})`);
