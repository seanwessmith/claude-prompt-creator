# Historically-Grounded VS Code Theme System
A Claude Code implementation guide you can follow end-to-end to produce two testable themes (dark + light) and a third ANSI-informed option, all driven by an OKLCH palette pipeline, semantic highlighting, accessibility gates, and an A/B testing harness.

Sections:
1) Project overview and setup
2) Design philosophy integration
3) Step-by-step implementation sequence
4) Specific code examples and file structures
5) Testing and validation procedures
6) Troubleshooting and optimization notes

——————————

1) Project overview and setup

Goal
- Build a maintainable VS Code theme system with:
  - Historically grounded bases (terminal and print lineages)
  - Perceptual color system (OKLCH) for consistent luminance across hues
  - Semantic highlighting priority with TextMate fallbacks
  - WCAG contrast gates (targets: 7:1 for core text, 4.5:1 for all tokens)
  - A/B chroma tuning (low-arousal vs higher-energy variants)
  - Terminal ANSI parity for cognitive continuity

Deliverables
- themes/Calm Terminal-color-theme.json (dark; CRT Phosphor lineage)
- themes/Paper & Ink-color-theme.json (light; print/paper lineage)
- themes/Heritage Dark-color-theme.json (dark; ANSI lineage)
- Automation pipeline (build.js) that converts OKLCH roles to sRGB hex, gamut-maps, enforces contrast thresholds, and emits theme JSON
- docs/palette.html with swatches and contrast matrix

Prerequisites
- Node.js 18+
- VS Code
- Yeoman and VS Code generator
  - npm i -g yo generator-code
- VSCE for packaging
  - npm i -g vsce
- Git

Create project
- mkdir historically-grounded-vscode-theme && cd historically-grounded-vscode-theme
- git init
- npm init -y
- npm i culori wcag-contrast fs-extra yargs js-yaml

Recommended file structure
- historically-grounded-vscode-theme/
  - package.json
  - build.js
  - palette.roles.json
  - mappings.json
  - themes/ (generated)
  - docs/ (generated)
  - test-workspace/
    - sample files: demo.ts, demo.py, demo.rs, demo.go, index.html, styles.css, data.json
  - README.md
  - CHANGELOG.md

——————————

2) Design philosophy integration

Historical grounding (why this works)
- CRT terminal dark: retro-terminal readability with minimal hue variety, low glare at night
- Humanist paper light: print-informed clarity on warm off-white with ink-like accents, perfect for daylight and long reading
- ANSI heritage dark: terminal familiarity and strong diffs, modernized with perceptual tuning

Emotional resonance targets
- Low-to-mid arousal, high perceived control, pleasant neutrals
- Gentle alerts: reserve saturated red for diagnostics; amber for warnings; blue/teal for info
- Comments remain legible (>= 4.5:1), not ghosted

Accessibility targets
- Core code text vs editor background: >= 7:1 preferred
- All tokens: >= 4.5:1 minimum
- Non-text UI: >= 3:1
- Do not rely on red/green alone for diffs; ensure luminance separation and add patterns/underlines for redundancy

Color system
- Define roles in OKLCH so hues share consistent perceived luminance
- Keep 70–80% of text in neutrals; allocate a small, stable set of accent hues for keywords, types, functions, strings, numbers/constants
- Cap chroma for long sessions; provide global chromaDelta knob for A/B tests

——————————

3) Step-by-step implementation sequence

Step 0 — Scaffold a VS Code theme extension
- yo code
  - New Color Theme → Start fresh → name (placeholder)
- This generates a basic extension. You will overwrite the generated theme JSON with outputs from build.js.

Step 1 — Add palette roles and mappings
- Create palette.roles.json with OKLCH roles for three bases (dark, light, ANSI)
- Create mappings.json to connect roles to VS Code keys and token scopes, with simple functions like alpha(), blend(), raise()

Step 2 — Implement build.js (the automation pipeline)
- Reads palette.roles.json and mappings.json
- Parses OKLCH and relative expressions (e.g., selection = relative(bg0 + 0.12L, 0.03C@240))
- Converts to sRGB hex; gamut-maps by reducing chroma if needed
- Computes WCAG contrast ratios and auto-adjusts minor failures
- Writes theme JSONs into themes/

Step 3 — Generate initial themes
- node build.js --variant crt_phosphor_dark --name "Calm Terminal"
- node build.js --variant humanist_paper_light --name "Paper & Ink"
- node build.js --variant ansi_heritage_dark --name "Heritage Dark"
- Optional A/B: add --chromaDelta -0.02 for calmer or +0.02 for brighter runs

Step 4 — Wire into VS Code extension
- Replace the scaffolded theme JSON with the files generated into themes/
- In package.json contributes.themes, reference the generated files

Step 5 — Local test
- Press F5 in VS Code to launch an Extension Development Host
- Open test-workspace/ with multi-language files
- Verify syntax tokens, diff readability, diagnostics, selection clarity, terminal ANSI parity

Step 6 — Iterate with the testing plan
- Run contrast gates and behavioral checks (see Section 5)
- Adjust OKLCH L/C (or chromaDelta) until targets pass and the theme feels calm, clear, and trustworthy

Step 7 — Package and publish preview
- vsce package
- vsce publish (after creating a publisher and PAT)

——————————

4) Specific code examples and file structures

4.1 palette.roles.json (source of truth; OKLCH roles)
Copy-paste this file at project root.

{
  "meta": {
    "space": "oklch",
    "variants": ["crt_phosphor_dark", "humanist_paper_light", "ansi_heritage_dark"]
  },
  "crt_phosphor_dark": {
    "neutrals": {
      "bg0": "oklch(0.18 0.02 250)",
      "bg1": "oklch(0.21 0.02 250)",
      "bg2": "oklch(0.25 0.02 250)",
      "fg": "oklch(0.93 0.02 250)",
      "muted": "oklch(0.75 0.02 250)",
      "comment": "oklch(0.68 0.02 250)"
    },
    "accents": {
      "keyword": "oklch(0.90 0.12 220)",
      "type": "oklch(0.90 0.10 200)",
      "function": "oklch(0.90 0.10 150)",
      "string": "oklch(0.90 0.10 80)",
      "number": "oklch(0.90 0.12 55)",
      "constant": "oklch(0.90 0.12 55)",
      "error": "oklch(0.78 0.20 30)",
      "warning": "oklch(0.84 0.18 85)",
      "info": "oklch(0.86 0.12 230)",
      "diffAdded": "oklch(0.64 0.12 150)",
      "diffRemoved": "oklch(0.60 0.18 30)",
      "selection": "relative(bg0 + 0.12L, 0.03C@240)"
    }
  },
  "humanist_paper_light": {
    "neutrals": {
      "bg0": "oklch(0.96 0.01 85)",
      "bg1": "oklch(0.93 0.01 85)",
      "bg2": "oklch(0.90 0.01 85)",
      "fg": "oklch(0.13 0.02 85)",
      "muted": "oklch(0.35 0.02 85)",
      "comment": "oklch(0.45 0.02 85)"
    },
    "accents": {
      "keyword": "oklch(0.32 0.12 230)",
      "type": "oklch(0.32 0.10 160)",
      "function": "oklch(0.32 0.12 310)",
      "string": "oklch(0.35 0.10 50)",
      "number": "oklch(0.30 0.14 30)",
      "constant": "oklch(0.30 0.12 310)",
      "error": "oklch(0.35 0.20 25)",
      "warning": "oklch(0.40 0.18 85)",
      "info": "oklch(0.35 0.12 230)",
      "selection": "relative(bg0 - 0.12L, 0.03C@220)"
    }
  },
  "ansi_heritage_dark": {
    "neutrals": {
      "bg0": "oklch(0.20 0.02 250)",
      "bg1": "oklch(0.24 0.02 250)",
      "bg2": "oklch(0.28 0.02 250)",
      "fg": "oklch(0.93 0.02 250)",
      "muted": "oklch(0.72 0.02 250)",
      "comment": "oklch(0.66 0.02 250)"
    },
    "accents": {
      "keyword": "oklch(0.86 0.14 240)",
      "type": "oklch(0.86 0.12 100)",
      "function": "oklch(0.86 0.13 320)",
      "string": "oklch(0.85 0.14 150)",
      "number": "oklch(0.86 0.12 95)",
      "constant": "oklch(0.82 0.17 30)",
      "error": "oklch(0.78 0.22 30)",
      "warning": "oklch(0.87 0.18 90)",
      "info": "oklch(0.86 0.14 240)",
      "diffAdded": "oklch(0.66 0.12 150)",
      "diffRemoved": "oklch(0.62 0.18 30)",
      "selection": "relative(bg0 + 0.12L, 0.03C@230)"
    }
  }
}

4.2 mappings.json (role → VS Code keys + token scopes)
Copy-paste this file at project root.

{
  "colors": {
    "editor.background": "neutrals.bg0",
    "editor.foreground": "neutrals.fg",
    "editorLineNumber.foreground": "neutrals.comment",
    "editor.selectionBackground": "accents.selection",
    "editor.inactiveSelectionBackground": "blend(accents.selection, neutrals.bg0, 0.7)",
    "editor.lineHighlightBackground": "neutrals.bg1",
    "editorBracketMatch.border": "accents.keyword",
    "editorBracketHighlight.foreground1": "accents.keyword",
    "editorBracketHighlight.foreground2": "accents.function",
    "editorBracketHighlight.foreground3": "accents.string",
    "editorBracketHighlight.unexpectedBracket.foreground": "accents.error",
    "editorIndentGuide.activeBackground": "neutrals.bg2",
    "editorIndentGuide.background": "blend(neutrals.bg0, neutrals.bg2, 0.6)",
    "editorGutter.addedBackground": "accents.diffAdded",
    "editorGutter.deletedBackground": "accents.diffRemoved",
    "editorGutter.modifiedBackground": "accents.keyword",
    "diffEditor.insertedTextBackground": "alpha(accents.diffAdded, 0x22)",
    "diffEditor.removedTextBackground": "alpha(accents.diffRemoved, 0x22)",
    "editorError.foreground": "accents.error",
    "editorWarning.foreground": "accents.warning",
    "editorInfo.foreground": "accents.info",
    "terminal.ansiBlack": "neutrals.bg0",
    "terminal.ansiRed": "accents.error",
    "terminal.ansiGreen": "accents.function",
    "terminal.ansiYellow": "accents.warning",
    "terminal.ansiBlue": "accents.keyword",
    "terminal.ansiMagenta": "accents.function",
    "terminal.ansiCyan": "accents.type",
    "terminal.ansiWhite": "neutrals.fg",
    "terminal.ansiBrightBlack": "blend(neutrals.bg2, neutrals.fg, 0.2)",
    "terminal.ansiBrightRed": "raise(accents.error, L:+0.06, C:+0.04)",
    "terminal.ansiBrightGreen": "raise(accents.function, L:+0.06, C:+0.04)",
    "terminal.ansiBrightYellow": "raise(accents.warning, L:+0.06, C:+0.04)",
    "terminal.ansiBrightBlue": "raise(accents.keyword, L:+0.06, C:+0.04)",
    "terminal.ansiBrightMagenta": "raise(accents.function, L:+0.06, C:+0.04)",
    "terminal.ansiBrightCyan": "raise(accents.type, L:+0.06, C:+0.04)",
    "terminal.ansiBrightWhite": "oklch(1 0 0)"
  },
  "semanticTokenColors": {
    "keyword": "accents.keyword",
    "type": "accents.type",
    "class": "accents.type",
    "interface": "accents.type",
    "function": "accents.function",
    "method": "accents.function",
    "string": "accents.string",
    "number": "accents.number",
    "variable": "neutrals.fg",
    "variable.readonly": "neutrals.fg",
    "variable.constant": "accents.constant",
    "enumMember": "accents.string",
    "property": "neutrals.fg",
    "parameter": "neutrals.fg",
    "comment": "neutrals.comment",
    "macro": "accents.function",
    "namespace": "neutrals.muted"
  },
  "tokenColors": [
    {
      "scope": ["comment", "punctuation.definition.comment"],
      "settings": { "foreground": "neutrals.comment", "fontStyle": "italic" }
    },
    {
      "scope": ["keyword", "storage.type", "storage.modifier"],
      "settings": { "foreground": "accents.keyword", "fontStyle": "bold" }
    },
    {
      "scope": ["entity.name.function", "support.function", "meta.function-call"],
      "settings": { "foreground": "accents.function" }
    },
    {
      "scope": ["entity.name.type", "support.type", "support.class"],
      "settings": { "foreground": "accents.type" }
    },
    {
      "scope": ["string"],
      "settings": { "foreground": "accents.string" }
    },
    {
      "scope": ["constant.numeric"],
      "settings": { "foreground": "accents.number" }
    },
    {
      "scope": ["variable"],
      "settings": { "foreground": "neutrals.fg" }
    }
  ]
}

4.3 build.js (automation pipeline)
Copy-paste this CommonJS script at project root.

Note: This implementation handles:
- OKLCH parsing and conversion
- Simple relative() expression for selection
- alpha(), blend(), raise() function evaluation in mappings
- sRGB gamut mapping by reducing chroma
- WCAG contrast gates with auto-nudge

/* eslint-disable no-console */
const fs = require('fs-extra');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const wcag = require('wcag-contrast');
const culori = require('culori');

const { parse, formatHex, converter, inGamut } = culori;

const args = yargs(hideBin(process.argv))
  .option('variant', { type: 'string', demandOption: true })
  .option('name', { type: 'string', demandOption: true })
  .option('type', { type: 'string' }) // optional override: dark/light
  .option('chromaDelta', { type: 'number', default: 0 })
  .argv;

const ROOT = process.cwd();
const ROLES_FILE = path.join(ROOT, 'palette.roles.json');
const MAPPINGS_FILE = path.join(ROOT, 'mappings.json');
const THEMES_DIR = path.join(ROOT, 'themes');
const DOCS_DIR = path.join(ROOT, 'docs');

const toRgb = converter('rgb');
const toOklch = converter('oklch');
const inRgbGamut = inGamut('rgb');

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function applyChromaDelta(oklchObj, delta) {
  const c = Math.max(0, (oklchObj.c || 0) + delta);
  return { ...oklchObj, c };
}

function ensureInGamut(oklchObj, maxSteps = 50) {
  // Reduce chroma until the sRGB conversion fits
  let candidate = { ...oklchObj };
  let rgb = toRgb(candidate);
  let steps = 0;
  while (!inRgbGamut(rgb) && steps < maxSteps) {
    candidate.c = Math.max(0, (candidate.c || 0) - 0.005);
    rgb = toRgb(candidate);
    steps++;
  }
  return candidate;
}

function hexFromOklch(oklchObj) {
  const clamped = ensureInGamut(oklchObj);
  return formatHex(toRgb(clamped));
}

function oklchFromString(str) {
  // Accept "oklch(L C h)" or "#rrggbb"
  if (typeof str !== 'string') return null;
  if (str.startsWith('oklch(')) {
    const parsed = parse(str);
    // culori returns object with mode: 'oklch', l/c/h
    return toOklch(parsed);
  }
  if (str.startsWith('#')) {
    const parsed = parse(str);
    return toOklch(parsed);
  }
  return null;
}

function parseRelative(expr, roles) {
  // Format: relative(bg0 + 0.12L, 0.03C@240)
  // group1: baseKey; group2: signed L delta; group3: C value; group4: hue
  const m = expr.match(/relative\(\s*([a-zA-Z0-9_.]+)\s*([+-]\s*[\d.]+)L\s*,\s*([\d.]+)C@([\d.]+)\s*\)/);
  if (!m) throw new Error(`Unsupported relative() expression: ${expr}`);
  const [, baseRef, lDeltaRaw, cStr, hStr] = m;
  const base = resolveRoleRefToOklch(baseRef, roles);
  const lDelta = parseFloat(lDeltaRaw.replace(/\s+/g, ''));
  const c = parseFloat(cStr);
  const h = parseFloat(hStr);
  const l = Math.min(1, Math.max(0, (base.l || 0) + lDelta));
  return { mode: 'oklch', l, c, h };
}

function resolveRoleRefToOklch(ref, roles) {
  // ref like "neutrals.bg0" or "accents.keyword"
  const parts = ref.split('.');
  if (parts.length !== 2) throw new Error(`Invalid role ref: ${ref}`);
  const [group, key] = parts;
  const str = roles[group][key];
  if (typeof str !== 'string') {
    // Already resolved?
    return str;
  }
  if (str.startsWith('oklch(') || str.startsWith('#')) {
    return toOklch(parse(str));
  }
  if (str.startsWith('relative(')) {
    return parseRelative(str, roles);
  }
  throw new Error(`Unsupported color spec for ${ref}: ${str}`);
}

function evaluateColorExpr(expr, roles) {
  // Accept:
  // - role path "neutrals.bg0"
  // - function alpha(roleRef, 0x22)
  // - function blend(roleA, roleB, t)
  // - function mix(roleA, roleB, t)
  // - function raise(roleRef, L:+0.06, C:+0.04)
  // - explicit "oklch(...)"
  // Returns: hex color string (#rrggbb or #rrggbbaa for alpha)
  if (expr.startsWith('oklch(')) {
    const o = oklchFromString(expr);
    return hexFromOklch(o);
  }
  if (!expr.includes('(')) {
    // role ref
    const o = resolveRoleRefToOklch(expr, roles);
    return hexFromOklch(o);
  }
  if (expr.startsWith('alpha(')) {
    const m = expr.match(/alpha\(\s*([^,]+)\s*,\s*(0x[0-9a-fA-F]{2})\s*\)/);
    if (!m) throw new Error(`Invalid alpha() expr: ${expr}`);
    const [, roleRef, alphaHex] = m;
    const baseHex = evaluateColorExpr(roleRef.trim(), roles);
    return baseHex + alphaHex.replace('0x', '');
  }
  if (expr.startsWith('blend(') || expr.startsWith('mix(')) {
    const m = expr.match(/(blend|mix)\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([\d.]+)\s*\)/);
    if (!m) throw new Error(`Invalid blend/mix expr: ${expr}`);
    const [, , refA, refB, tStr] = m;
    const t = Math.min(1, Math.max(0, parseFloat(tStr)));
    const oa = resolveRoleRefToOklch(refA.trim(), roles);
    const ob = resolveRoleRefToOklch(refB.trim(), roles);
    // Interpolate in OKLCH
    const hInterp = (a, b) => {
      const diff = (((b - a + 540) % 360) - 180);
      return (a + diff * t + 360) % 360;
    };
    const l = (oa.l || 0) * (1 - t) + (ob.l || 0) * t;
    const c = (oa.c || 0) * (1 - t) + (ob.c || 0) * t;
    const h = hInterp(oa.h || 0, ob.h || 0);
    return hexFromOklch({ mode: 'oklch', l, c, h });
  }
  if (expr.startsWith('raise(')) {
    // raise(roleRef, L:+0.06, C:+0.04)
    const m = expr.match(/raise\(\s*([^,]+)\s*,\s*L:([+-][\d.]+)\s*,\s*C:([+-][\d.]+)\s*\)/);
    if (!m) throw new Error(`Invalid raise() expr: ${expr}`);
    const [, ref, lDeltaStr, cDeltaStr] = m;
    const base = resolveRoleRefToOklch(ref.trim(), roles);
    const l = Math.min(1, Math.max(0, (base.l || 0) + parseFloat(lDeltaStr)));
    const c = Math.max(0, (base.c || 0) + parseFloat(cDeltaStr));
    const h = base.h;
    return hexFromOklch({ mode: 'oklch', l, c, h });
  }
  throw new Error(`Unsupported expression: ${expr}`);
}

function applyGlobalChromaDelta(roles, delta) {
  const out = deepClone(roles);
  for (const group of Object.keys(out)) {
    for (const key of Object.keys(out[group])) {
      const spec = out[group][key];
      if (typeof spec === 'string') {
        if (spec.startsWith('oklch(')) {
          const o = toOklch(parse(spec));
          out[group][key] = applyChromaDelta(o, delta);
        } else if (spec.startsWith('relative(')) {
          // Resolve then apply
          const o = parseRelative(spec, out);
          out[group][key] = applyChromaDelta(o, delta);
        } else if (spec.startsWith('#')) {
          const o = toOklch(parse(spec));
          out[group][key] = applyChromaDelta(o, delta);
        } else {
          // Leave function refs (like alpha/mix/raise) to mappings stage
          // No action here
        }
      } else {
        // Already resolved object: apply delta
        out[group][key] = applyChromaDelta(spec, delta);
      }
    }
  }
  return out;
}

function computeContrast(hexFg, hexBg) {
  try {
    return wcag.hex(hexFg, hexBg);
  } catch (_) {
    // if alpha present in fg, strip alpha for conservative estimate
    const fg = hexFg.slice(0, 7);
    return wcag.hex(fg, hexBg);
  }
}

function autoAdjustForContrast(themeObj, bgHex, requirements) {
  // requirements:
  // - core text >= 7:1: editor.foreground vs bg
  // - all tokens >= 4.5:1: scan semanticTokenColors and tokenColors
  // This is a gentle nudge: if fail, darken/lighten by moving L slightly
  const adjustHex = (hex, direction = 'increase', step = 0.02, maxTries = 6) => {
    let o = toOklch(parse(hex));
    for (let i = 0; i < maxTries; i++) {
      o.l = Math.max(0, Math.min(1, o.l + (direction === 'increase' ? 1 : -1) * step));
      const next = hexFromOklch(o);
      const ratio = computeContrast(next, bgHex);
      if (ratio >= 4.5) return next;
    }
    return hex;
  };

  // Core text
  const coreFg = themeObj.colors['editor.foreground'];
  if (computeContrast(coreFg, bgHex) < (requirements.coreText || 7)) {
    themeObj.colors['editor.foreground'] = adjustHex(coreFg, 'increase');
  }

  // Token colors (semantic)
  if (themeObj.semanticTokenColors) {
    for (const k of Object.keys(themeObj.semanticTokenColors)) {
      const v = themeObj.semanticTokenColors[k];
      if (typeof v === 'string' && v.startsWith('#')) {
        if (computeContrast(v, bgHex) < (requirements.tokens || 4.5)) {
          themeObj.semanticTokenColors[k] = adjustHex(v, 'increase');
        }
      }
    }
  }

  // Token colors (TextMate array)
  if (themeObj.tokenColors && Array.isArray(themeObj.tokenColors)) {
    for (const entry of themeObj.tokenColors) {
      const fg = entry.settings && entry.settings.foreground;
      if (!fg || typeof fg !== 'string' || !fg.startsWith('#')) continue;
      if (computeContrast(fg, bgHex) < (requirements.tokens || 4.5)) {
        entry.settings.foreground = adjustHex(fg, 'increase');
      }
    }
  }
}

async function main() {
  const rolesJson = await fs.readJson(ROLES_FILE);
  const mappings = await fs.readJson(MAPPINGS_FILE);
  const variant = args.variant;
  const themeName = args.name;
  const chromaDelta = Number(args.chromaDelta || 0);

  if (!rolesJson[variant]) {
    console.error(`Variant "${variant}" not found in ${ROLES_FILE}`);
    process.exit(1);
  }

  // Resolve roles for this variant
  const baseRoles = rolesJson[variant];
  // Apply chroma delta globally (only to OKLCH specs / resolved entries)
  const rolesResolved = applyGlobalChromaDelta(baseRoles, chromaDelta);

  // Assemble theme
  const colors = {};
  const semanticTokenColors = {};
  const tokenColors = [];

  // Resolve UI colors
  for (const key of Object.keys(mappings.colors)) {
    const expr = mappings.colors[key];
    const hex = evaluateColorExpr(expr, rolesResolved);
    colors[key] = hex;
  }

  // Resolve semantic token colors
  for (const key of Object.keys(mappings.semanticTokenColors)) {
    const ref = mappings.semanticTokenColors[key];
    const hex = evaluateColorExpr(ref, rolesResolved);
    semanticTokenColors[key] = hex;
  }

  // Resolve TextMate tokenColors
  for (const entry of mappings.tokenColors) {
    const settings = { ...entry.settings };
    if (settings.foreground) {
      settings.foreground = evaluateColorExpr(settings.foreground, rolesResolved);
    }
    tokenColors.push({ scope: entry.scope, settings });
  }

  // Determine theme type if not provided (dark if bg is low L)
  const bgHex = colors['editor.background'];
  const bgL = toOklch(parse(bgHex)).l || 0.5;
  const type = args.type || (bgL < 0.5 ? 'dark' : 'light');

  const themeObj = {
    name: `${themeName}`,
    type,
    semanticHighlighting: true,
    colors,
    tokenColors,
    semanticTokenColors
  };

  // Contrast gates and auto-adjust
  autoAdjustForContrast(themeObj, bgHex, { coreText: 7, tokens: 4.5 });

  await fs.ensureDir(THEMES_DIR);
  const fileSafeName = themeName.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim().replace(/\s/g, '-');
  const outPath = path.join(THEMES_DIR, `${fileSafeName}-color-theme.json`);
  await fs.writeJson(outPath, themeObj, { spaces: 2 });
  console.log(`Wrote ${outPath}`);

  // Minimal docs: swatches + contrast matrix for core tokens
  await fs.ensureDir(DOCS_DIR);
  const docPath = path.join(DOCS_DIR, `${fileSafeName}-palette.html`);
  const basicDoc = `
<!doctype html><meta charset="utf-8">
<title>${themeName} Palette</title>
<style>body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial} .sw{display:inline-block;width:140px;margin:6px;padding:6px;border:1px solid #ccc;border-radius:6px} .sw div{height:40px;border-radius:4px}</style>
<h1>${themeName} Palette</h1>
<p>Background: <code>${colors['editor.background']}</code> Foreground: <code>${colors['editor.foreground']}</code></p>
<h2>Semantic Tokens</h2>
<div>
${Object.entries(semanticTokenColors).map(([k,v])=>`<div class="sw"><div style="background:${v}"></div><small>${k}<br>${v}</small></div>`).join('')}
</div>`;
  await fs.writeFile(docPath, basicDoc, 'utf8');
  console.log(`Wrote ${docPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

4.4 package.json (augment)
Add scripts and make sure this extension can package/publish. Replace fields as needed.

{
  "name": "historically-grounded-vscode-theme",
  "version": "0.1.0",
  "private": true,
  "displayName": "Historically Grounded VS Code Theme",
  "description": "Calm Terminal (dark), Paper & Ink (light), Heritage Dark (ANSI) with an OKLCH pipeline and WCAG gates.",
  "publisher": "your-publisher-id",
  "engines": { "vscode": "^1.90.0" },
  "categories": ["Themes"],
  "contributes": {
    "themes": [
      { "label": "Calm Terminal", "uiTheme": "vs-dark", "path": "./themes/Calm-Terminal-color-theme.json" },
      { "label": "Paper & Ink", "uiTheme": "vs", "path": "./themes/Paper-&-Ink-color-theme.json" },
      { "label": "Heritage Dark", "uiTheme": "vs-dark", "path": "./themes/Heritage-Dark-color-theme.json" }
    ]
  },
  "scripts": {
    "build:dark": "node build.js --variant crt_phosphor_dark --name 'Calm Terminal'",
    "build:light": "node build.js --variant humanist_paper_light --name 'Paper & Ink'",
    "build:ansi": "node build.js --variant ansi_heritage_dark --name 'Heritage Dark'",
    "build": "npm run build:dark && npm run build:light && npm run build:ansi",
    "build:calmer": "node build.js --variant crt_phosphor_dark --name 'Calm Terminal' --chromaDelta -0.02",
    "build:brighter": "node build.js --variant ansi_heritage_dark --name 'Heritage Dark' --chromaDelta 0.02",
    "package": "vsce package"
  },
  "devDependencies": {
    "fs-extra": "^11.2.0",
    "wcag-contrast": "^4.0.0",
    "culori": "^3.3.0",
    "yargs": "^17.7.2",
    "js-yaml": "^4.1.0"
  }
}

4.5 Test workspace samples
Create minimal files in test-workspace/ to visually check tokens.

- demo.ts
export interface User { id: number; name: string }
export const ANSWER = 42;
function greet(u: User): string {
  const msg = `Hello, ${u.name}!`;
  return msg;
}
console.log(greet({ id: 1, name: 'Ada' }));

- demo.py
ANSWER = 42
def greet(name: str) -> str:
    msg = f"Hello, {name}!"
    return msg

print(greet("Ada"))

- demo.rs
const ANSWER: i32 = 42;
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
fn main() { println!("{}", greet("Ada")); }

- demo.go
package main
import "fmt"
const Answer int = 42
func greet(name string) string { return fmt.Sprintf("Hello, %s!", name) }
func main() { fmt.Println(greet("Ada")) }

- index.html
<!doctype html><title>Demo</title>
<link rel="stylesheet" href="styles.css">
<h1 class="title">Hello</h1><script>const x=42; console.log("hi",x)</script>

- styles.css
:root { --primary: #0366d6; }
body { font: 14px/1.5 system-ui, sans-serif; color: #222; }
.title { color: var(--primary); }

- data.json
{ "name": "Ada", "answer": 42, "greeting": "Hello" }

——————————

5) Testing and validation procedures

5.1 Build and launch
- npm run build
- Press F5 in VS Code to open Extension Development Host
- In the Dev Host, open test-workspace/
- Switch themes: Calm Terminal, Paper & Ink, Heritage Dark
- Toggle semantic highlighting: true/false in user settings to validate fallbacks

5.2 Contrast gates (automated)
- The build script automatically checks:
  - editor.foreground vs editor.background >= 7:1
  - All semantic token colors and TextMate token colors >= 4.5:1
  - Performs gentle luminance nudges to pass thresholds where feasible
- Inspect docs/*.html for a quick palette overview
- If you want a raw report, extend build.js to dump ratios per token

5.3 Visual checks
- Syntax scan (3 minutes): find functions, types, keywords in unfamiliar code
- Diff review (~100 LOC):
  - Create a quick git repo in test-workspace
  - Make changes; run "View: Toggle Diff Editor" in VS Code
  - Ensure added/removed backgrounds are distinct, token foreground remains legible atop diff backgrounds
- Diagnostics:
  - Introduce a syntax error and watch error color + wavy underline
  - Confirm warning/info are distinct and calmer than errors
- Selection behavior:
  - Ensure selection reads ~3:1 vs background, cool and not glaring
- Terminal parity:
  - Open integrated terminal
  - Run ls, git status, git diff
  - Verify ANSI colors match editor accents; brights reserved for alerts/diffs

5.4 CVD checks
- Install a color vision deficiency simulator (e.g., Stark or browser-based screenshots)
- Verify diffs do not rely on red/green alone:
  - Clear luminance separation present
  - Underlines/patterns (wavy) reinforce meaning

5.5 A/B arousal tuning
- Calmer build: node build.js --variant crt_phosphor_dark --name "Calm Terminal" --chromaDelta -0.02
- Brighter build: node build.js --variant ansi_heritage_dark --name "Heritage Dark" --chromaDelta 0.02
- Compare for eye strain and detection speed in diffs; pick the sweet spot

5.6 Acceptance criteria
- Core code text >= 7:1; all tokens >= 4.5:1
- Diff added/removed instantly distinguishable without glare complaints
- Keywords/types/functions findable within ~2 seconds in unfamiliar code
- Terminal ANSI aligned with editor accents; brights not overused
- Low reported strain after 20-minute sessions; arousal feels low-to-mid, controlled

——————————

6) Troubleshooting and optimization notes

Contrast failures persist
- Raise or lower L a bit more for specific tokens in build.js’s autoAdjustForContrast
- If a hue collapses at target luminance, reduce chroma slightly (C −0.02) before bumping L further
- Check your monitor brightness; light themes can wash out in bright rooms
  - Consider a “Paper+” variant with slightly darker accents and stronger selection

Out-of-gamut colors shift unexpectedly
- This build reduces chroma until sRGB-safe; if a hue still feels off, reduce C in palette.roles.json for that accent
- Wide-gamut displays can amplify saturation; test on multiple devices

Semantic vs TextMate conflicts
- VS Code prefers semanticTokenColors when available
- Ensure tokenColors don’t fight semanticTokenColors (keep scopes aligned with roles)
- If a language lacks semantic tokens, your TextMate fallbacks should still look coherent

Windows ClearType and italics
- Italics can look rough with certain monospace fonts on Windows
- If comments feel fuzzy, consider removing italics or raising weight; keep >= 4.5:1 contrast regardless

Selection feels too bright or too dull
- Dark themes: selection ≈ bg0 + 0.12L with cool hue, low chroma
- Light themes: selection ≈ bg0 − 0.12L with cool hue, low chroma
- Adjust selection OKLCH in palette.roles.json (selection = relative(...)) and rebuild

Diff readability with overlays
- If tokens on inserted/removed backgrounds drop below 4.5:1, reduce alpha (use 0x22 → 0x1A) or slightly darken bg0 to raise contrast
- Ensure editorGutter.added/deleted align with diff hues

Confetti effect from bracket pairs
- Keep 3–4 muted hues max for bracket highlights
- In mappings.json, we only specify a few bracket highlight colors; avoid too many distinct hues

Performance and maintenance
- Keep role names stable across variants (neutrals.*, accents.*)
- If you add new UI surfaces, map them through roles (avoid hard-coded hex)
- Document meaningful color changes in CHANGELOG with rationale

Publishing issues
- Make sure themes/*.json paths match contributes.themes in package.json
- Create a VS Code publisher and PAT; then run vsce publish
- Validate extension in a clean VS Code instance

——————————

Quickstart commands

- npm install
- npm run build
- F5 in VS Code to test
- Optional A/B:
  - node build.js --variant crt_phosphor_dark --name "Calm Terminal" --chromaDelta -0.02
  - node build.js --variant ansi_heritage_dark --name "Heritage Dark" --chromaDelta 0.02
- vsce package

——————————

Choosing your base quickly

- Want calm night focus? Choose CRT Phosphor Dark → Calm Terminal
- Want daylight readability and book-like feel? Choose Humanist Paper Light → Paper & Ink
- Want terminal familiarity and energetic diffs? Choose ANSI Heritage Dark → Heritage Dark

You can ship a matched pair for day/night:
- Day = Paper & Ink, Night = Calm Terminal (emotional continuity: calm day → quiet night)

——————————

What to improve next

- Add bracket pair role colors (3–4 muted accents), indent guide L-steps as roles
- Generate a richer docs/palette.html with full contrast matrices and CVD previews
- Add CLI flags to tweak selection L or diagnostics intensity per variant
- Export matching terminal schemes (iTerm, Windows Terminal) from roles to ensure parity across tools

If you want, tell me your preferred vibe (calm retro, bookish light, or ANSI energy), and I’ll generate a prebuilt theme JSON and a preview screenshot grid to get you moving in minutes.