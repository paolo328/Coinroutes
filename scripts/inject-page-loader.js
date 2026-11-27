/**
 * Inject page-transition loader (inline head + deferred script) into all HTML pages.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const THEME_END = '})();</script>';

const LOADER_INLINE =
  '<script>(function(){if(sessionStorage.getItem("axiom-page-loading")==="1")document.documentElement.classList.add("axiom-page-loading");})();</script>';

const LOADER_SCRIPT =
  '<script src="PATH_PREFIXassets/js/axiom-page-loader.js" defer></script>';

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'hts-cache', 'scripts', 'assets'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name.endsWith('.html')) files.push(p);
  }
  return files;
}

function depthPrefix(filePath) {
  const rel = path.relative(ROOT, filePath);
  const depth = rel.split(path.sep).length - 1;
  return depth === 0 ? '' : '../'.repeat(depth);
}

let inlineCount = 0;
let scriptCount = 0;

for (const file of walk(ROOT)) {
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;
  const prefix = depthPrefix(file);

  if (!html.includes('axiom-page-loader.js')) {
    const inject = LOADER_SCRIPT.replace(/PATH_PREFIX/g, prefix);
    html = html.replace(/<\/body>/i, `${inject}</body>`);
    changed = true;
    scriptCount++;
  }

  if (!html.includes('axiom-page-loading') || !html.includes('sessionStorage.getItem("axiom-page-loading")')) {
    const themeEnd = html.indexOf(THEME_END);
    if (themeEnd !== -1) {
      const insertAt = themeEnd + THEME_END.length;
      html = html.slice(0, insertAt) + LOADER_INLINE + html.slice(insertAt);
      changed = true;
      inlineCount++;
    }
  }

  if (changed) fs.writeFileSync(file, html, 'utf8');
}

console.log(
  `Page loader: added script to ${scriptCount} file(s), inline hook to ${inlineCount} file(s).`
);