import fs from 'node:fs';
import path from 'node:path';

// These tags are injected into the exported HTML instead of being rendered by
// React. React 19 hoists <script> and <meta> out of wherever they are authored,
// which reordered the document during hydration and remounted the whole tree on
// every page (React error #418).

const OUT_DIR = path.join(process.cwd(), 'out');
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || '';
const SITE_URL = 'https://atypicalesper.github.io/dev-atlas';

const clarityScript = CLARITY_ID ? ' https://*.clarity.ms' : '';
const clarityConnect = CLARITY_ID ? ' https://*.clarity.ms https://c.bing.com' : '';
const clarityImg = CLARITY_ID ? ' https://*.clarity.ms https://c.bing.com' : '';

const CSP = [
  `default-src 'none'`,
  `script-src 'self' 'unsafe-inline'${clarityScript}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob:${clarityImg}`,
  `font-src 'self'`,
  `connect-src 'self'${clarityConnect}`,
  `frame-src 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join('; ');

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'dev atlas',
  url: SITE_URL,
  description:
    'The complete developer knowledge base. JavaScript, TypeScript, React, Node.js, Python, AI/ML, system design, DSA, databases, cloud, and more.',
  author: { '@type': 'Person', name: 'Tarun Singh', url: 'https://atypicalesper.github.io' },
};

const clarityTag = CLARITY_ID
  ? `<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");</script>`
  : '';

const HEAD_TAGS = [
  `<meta http-equiv="Content-Security-Policy" content="${CSP}">`,
  `<script type="application/ld+json">${JSON.stringify(websiteJsonLd)}</script>`,
  clarityTag,
].join('');

const MARKER = '<meta http-equiv="Content-Security-Policy"';

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

if (!fs.existsSync(OUT_DIR)) {
  console.error('postbuild-html: out/ not found — run next build first');
  process.exit(1);
}

const files = walk(OUT_DIR);
let patched = 0;

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  // Match the tag, not the phrase — the security docs discuss CSP in prose
  if (html.includes(MARKER)) continue;
  const idx = html.indexOf('<head>');
  if (idx === -1) continue;
  const at = idx + '<head>'.length;
  fs.writeFileSync(file, html.slice(0, at) + HEAD_TAGS + html.slice(at));
  patched++;
}

console.log(`postbuild-html: patched ${patched}/${files.length} html files`);

if (patched !== files.length) {
  console.error(`postbuild-html: ${files.length - patched} file(s) were not patched`);
  process.exit(1);
}
