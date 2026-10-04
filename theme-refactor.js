#!/usr/bin/env node

/**
 * Theme / Design Token Refactor
 *
 * Usage:
 *   node theme-refactor.js . --dry-run
 *   node theme-refactor.js . --write
 *
 * Purpose:
 *   Safely replace hardcoded design values with existing CSS design tokens.
 *
 * Important:
 *   Token matching is PROPERTY/CATEGORY AWARE.
 *
 *   Example:
 *     border-radius: 12px
 *
 *   can NEVER become:
 *     var(--font-size-14)
 *
 *   A typography token can only replace typography values.
 *   A radius token can only replace radius values.
 *   A color token can only replace colors.
 *
 *   Ambiguous or missing matches are reported but NOT modified.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const rootArg = process.argv[2] || '.';
const ROOT = path.resolve(rootArg);

const DRY_RUN = process.argv.includes('--dry-run');
const WRITE = process.argv.includes('--write');

if (!DRY_RUN && !WRITE) {
  console.error('');
  console.error('ERROR: Choose one mode:');
  console.error('  node theme-refactor.js . --dry-run');
  console.error('  node theme-refactor.js . --write');
  console.error('');
  process.exit(1);
}

if (DRY_RUN && WRITE) {
  console.error('ERROR: --dry-run and --write cannot be used together.');
  process.exit(1);
}

const IGNORE_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.cache',
]);

const EXTENSIONS = new Set([
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.tsx',
  '.ts',
  '.jsx',
  '.js',
]);

const CSS_VARIABLE_RE =
  /(--[a-zA-Z0-9_-]+)\s*:\s*([^;{}]+)\s*;/g;

const CSS_DECLARATION_RE =
  /([a-zA-Z-]+)\s*:\s*([^;{}]+)(?:;|(?=\}))/g;

/**
 * Property -> design-token category.
 *
 * A property may ONLY match tokens from its category.
 */
const PROPERTY_CATEGORY = {
  'font-family': 'typography',
  'font-size': 'typography',
  'font-weight': 'typography',
  'font-style': 'typography',
  'line-height': 'typography',
  'letter-spacing': 'typography',
  'text-indent': 'typography',

  'border-radius': 'radius',
  'border-top-left-radius': 'radius',
  'border-top-right-radius': 'radius',
  'border-bottom-left-radius': 'radius',
  'border-bottom-right-radius': 'radius',

  color: 'color',
  'text-decoration-color': 'color',
  'caret-color': 'color',
  'accent-color': 'color',
  'column-rule-color': 'color',

  background: 'background',
  'background-color': 'background',
  'background-image': 'gradient',

  'border-color': 'border-color',
  'border-top-color': 'border-color',
  'border-right-color': 'border-color',
  'border-bottom-color': 'border-color',
  'border-left-color': 'border-color',
  'outline-color': 'border-color',

  'box-shadow': 'shadow',
  'text-shadow': 'shadow',

  'opacity': 'opacity',
};

const CATEGORY_LABELS = {
  typography: 'typography',
  radius: 'radius',
  color: 'color',
  background: 'background',
  'border-color': 'border-color',
  border: 'border',
  gradient: 'gradient',
  shadow: 'shadow',
  opacity: 'opacity',
  other: 'other',
};

/**
 * Known semantic token-name hints.
 *
 * These are intentionally conservative.
 */
const TOKEN_NAME_HINTS = [
  {
    category: 'typography',
    patterns: [
      /font/i,
      /text-size/i,
      /line-height/i,
      /letter-spacing/i,
    ],
  },
  {
    category: 'radius',
    patterns: [
      /radius/i,
      /rounded/i,
    ],
  },
  {
    category: 'shadow',
    patterns: [
      /shadow/i,
    ],
  },
  {
    category: 'gradient',
    patterns: [
      /gradient/i,
    ],
  },
  {
    category: 'background',
    patterns: [
      /background/i,
      /surface/i,
      /^--bg/i,
      /-bg-/i,
    ],
  },
  {
    category: 'border-color',
    patterns: [
      /border/i,
      /divider/i,
    ],
  },
  {
    category: 'color',
    patterns: [
      /color/i,
      /wine/i,
      /sage/i,
      /text/i,
      /ink/i,
      /muted/i,
      /cream/i,
      /gold/i,
      /error/i,
      /warning/i,
      /success/i,
      /info/i,
      /danger/i,
    ],
  },
];

function inferTokenCategory(name, value) {
  for (const group of TOKEN_NAME_HINTS) {
    if (group.patterns.some((pattern) => pattern.test(name))) {
      return group.category;
    }
  }

  const normalized = value.trim().toLowerCase();

  if (isGradient(normalized)) {
    return 'gradient';
  }

  if (isColor(normalized)) {
    return 'color';
  }

  if (isLength(normalized)) {
    return 'other';
  }

  return 'other';
}

function getPropertyCategory(property) {
  const normalized = property.trim().toLowerCase();

  if (PROPERTY_CATEGORY[normalized]) {
    return PROPERTY_CATEGORY[normalized];
  }

  if (normalized.startsWith('border')) {
    if (normalized === 'border') {
      return 'border';
    }

    return 'border-color';
  }

  if (normalized.startsWith('background')) {
    return normalized === 'background-image'
      ? 'gradient'
      : 'background';
  }

  return null;
}

function normalizeValue(value) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ',')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .toLowerCase();
}

function isColor(value) {
  const v = value.trim().toLowerCase();

  return (
    /^#[0-9a-f]{3,8}$/i.test(v) ||
    /^rgba?\(/i.test(v) ||
    /^hsla?\(/i.test(v) ||
    /^(transparent|currentcolor|inherit|initial|unset)$/i.test(v)
  );
}

function isGradient(value) {
  return (
    /gradient\s*\(/i.test(value) ||
    value.includes('color-mix(')
  );
}

function isLength(value) {
  return /^-?\d*\.?\d+(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/i.test(
    value.trim()
  );
}

function isShadow(value) {
  return (
    /\b(inset|rgba?\(|hsla?\(|#[0-9a-f]+\b)/i.test(value) &&
    /(?:\d+\.?\d*px|\d+\.?\d*rem)/i.test(value)
  );
}

function isBorderShorthand(value) {
  return (
    /^(?:thin|medium|thick|\d*\.?\d+(?:px|rem|em|pt))\s+/i.test(value) ||
    /\bsolid\b|\bdashed\b|\bdotted\b|\bdouble\b|\binset\b|\boutset\b/i.test(
      value
    )
  );
}

function inferValueCategory(property, value) {
  const propertyCategory = getPropertyCategory(property);

  if (propertyCategory) {
    return propertyCategory;
  }

  const normalized = value.trim().toLowerCase();

  if (isGradient(normalized)) {
    return 'gradient';
  }

  if (isShadow(normalized)) {
    return 'shadow';
  }

  if (isColor(normalized)) {
    return 'color';
  }

  if (isBorderShorthand(normalized)) {
    return 'border';
  }

  if (isLength(normalized)) {
    return 'other';
  }

  return 'other';
}

function extractCssVariables(files) {
  const tokens = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');

    let match;

    CSS_VARIABLE_RE.lastIndex = 0;

    while ((match = CSS_VARIABLE_RE.exec(content))) {
      const name = match[1];
      const value = match[2].trim();

      tokens.push({
        name,
        value,
        normalizedValue: normalizeValue(value),
        category: inferTokenCategory(name, value),
        file,
      });
    }
  }

  return tokens;
}

function findBestToken(value, property, tokens) {
  const propertyCategory = getPropertyCategory(property);

  if (!propertyCategory) {
    return {
      status: 'unsupported-property',
      token: null,
      category: null,
    };
  }

  const normalizedValue = normalizeValue(value);

  let candidates = tokens.filter(
    (token) =>
      token.category === propertyCategory &&
      token.normalizedValue === normalizedValue
  );

  if (candidates.length === 1) {
    return {
      status: 'safe',
      token: candidates[0],
      category: propertyCategory,
    };
  }

  if (candidates.length > 1) {
    return {
      status: 'ambiguous',
      tokens: candidates,
      category: propertyCategory,
    };
  }

  /**
   * Special handling:
   *
   * A background may legitimately use a token classified as "color".
   *
   * But only for simple color values. We do NOT cross-match arbitrary
   * categories.
   */
  if (
    propertyCategory === 'background' &&
    isColor(value)
  ) {
    candidates = tokens.filter(
      (token) =>
        (token.category === 'background' || token.category === 'color') &&
        token.normalizedValue === normalizedValue
    );

    if (candidates.length === 1) {
      return {
        status: 'safe',
        token: candidates[0],
        category: propertyCategory,
      };
    }

    if (candidates.length > 1) {
      return {
        status: 'ambiguous',
        tokens: candidates,
        category: propertyCategory,
      };
    }
  }

  /**
   * Same conservative rule for border-color.
   */
  if (
    propertyCategory === 'border-color' &&
    isColor(value)
  ) {
    candidates = tokens.filter(
      (token) =>
        token.category === 'border-color' &&
        token.normalizedValue === normalizedValue
    );

    if (candidates.length === 1) {
      return {
        status: 'safe',
        token: candidates[0],
        category: propertyCategory,
      };
    }
  }

  return {
    status: 'unmapped',
    token: null,
    category: propertyCategory,
  };
}

function getAllFiles(dir) {
  const results = [];

  function walk(current) {
    let entries;

    try {
      entries = fs.readdirSync(current, {
        withFileTypes: true,
      });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();

      if (EXTENSIONS.has(extension)) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);

  return results.sort();
}

function relative(file) {
  return path.relative(ROOT, file);
}

function formatToken(token) {
  return `var(${token.name})`;
}

function addMapCount(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function collectDeclarations(content) {
  const declarations = [];

  let match;

  CSS_DECLARATION_RE.lastIndex = 0;

  while ((match = CSS_DECLARATION_RE.exec(content))) {
    const property = match[1].trim().toLowerCase();
    const value = match[2].trim();

    if (!property || !value) {
      continue;
    }

    if (property.startsWith('--')) {
      continue;
    }

    declarations.push({
      property,
      value,
      index: match.index,
      length: match[0].length,
    });
  }

  return declarations;
}

function isInsideCssVariableDeclaration(content, index) {
  const before = content.slice(0, index);

  const lastOpen = before.lastIndexOf('{');
  const lastClose = before.lastIndexOf('}');

  if (lastClose > lastOpen) {
    return false;
  }

  const currentBlock = before.slice(lastOpen + 1);

  return /--[a-zA-Z0-9_-]+\s*:\s*[^;]*$/s.test(currentBlock);
}

function makeReplacement(content, declaration, token) {
  const original = content.slice(
    declaration.index,
    declaration.index + declaration.length
  );

  const propertyPattern = new RegExp(
    `^(${escapeRegExp(declaration.property)}\\s*:\\s*)`,
    'i'
  );

  const match = original.match(propertyPattern);

  if (!match) {
    return null;
  }

  const prefix = match[1];

  /**
   * Preserve !important.
   */
  const importantMatch = declaration.value.match(
    /\s*!important\s*$/i
  );

  const important = importantMatch
    ? ' !important'
    : '';

  return `${prefix}${formatToken(token)}${important};`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function scanFile(file, tokens, stats) {
  const content = fs.readFileSync(file, 'utf8');

  const declarations = collectDeclarations(content);

  const replacements = [];
  const fileSafe = [];
  const fileWrongCategory = [];
  const fileUnmapped = [];

  for (const declaration of declarations) {
    if (isInsideCssVariableDeclaration(content, declaration.index)) {
      continue;
    }

    const category = inferValueCategory(
      declaration.property,
      declaration.value
    );

    /**
     * We only refactor properties that have a known design-token category.
     */
    if (!getPropertyCategory(declaration.property)) {
      continue;
    }

    const result = findBestToken(
      declaration.value,
      declaration.property,
      tokens
    );

    if (result.status === 'safe') {
      const replacement = makeReplacement(
        content,
        declaration,
        result.token
      );

      if (!replacement) {
        continue;
      }

      replacements.push({
        start: declaration.index,
        end: declaration.index + declaration.length,
        replacement,
      });

      fileSafe.push({
        property: declaration.property,
        value: declaration.value,
        token: result.token,
        category,
      });

      stats.safe++;

      continue;
    }

    if (result.status === 'ambiguous') {
      fileWrongCategory.push({
        property: declaration.property,
        value: declaration.value,
        category,
        reason: 'ambiguous',
        tokens: result.tokens || [],
      });

      stats.ambiguous++;

      continue;
    }

    if (result.status === 'unmapped') {
      fileUnmapped.push({
        property: declaration.property,
        value: declaration.value,
        category,
      });

      const key = `${declaration.property}|||${declaration.value}|||${category}`;

      if (!stats.unmapped.has(key)) {
        stats.unmapped.set(key, {
          property: declaration.property,
          value: declaration.value,
          category,
          count: 0,
          files: new Set(),
        });
      }

      stats.unmapped.get(key).count++;
      stats.unmapped.get(key).files.add(file);

      continue;
    }
  }

  /**
   * Apply replacements only once, from bottom to top.
   *
   * This prevents index offsets from corrupting the file.
   */
  if (WRITE && replacements.length > 0) {
    let updated = content;

    replacements
      .sort((a, b) => b.start - a.start)
      .forEach((replacement) => {
        updated =
          updated.slice(0, replacement.start) +
          replacement.replacement +
          updated.slice(replacement.end);
      });

    if (updated !== content) {
      fs.writeFileSync(file, updated, 'utf8');
      stats.modifiedFiles.add(file);
    }
  }

  /**
   * Dry-run output.
   *
   * Deduplicate identical property/value/token combinations so the
   * report stays readable.
   */
  const safeGroups = new Map();

  for (const item of fileSafe) {
    const key =
      `${item.property}|${item.value}|${item.token.name}`;

    if (!safeGroups.has(key)) {
      safeGroups.set(key, {
        ...item,
        count: 0,
      });
    }

    safeGroups.get(key).count++;
  }

  if (safeGroups.size > 0) {
    for (const item of safeGroups.values()) {
      const countSuffix =
        item.count > 1
          ? ` (${item.count} occurrences)`
          : '';

      console.log(
        `SAFE: ${relative(file)}`
      );

      console.log(
        `  ${item.property}: ${item.value} → ${formatToken(
          item.token
        )}${countSuffix}`
      );
    }
  }

  /**
   * Wrong-category matches.
   *
   * These are specifically useful for catching the bug that caused:
   *
   *   border-radius: 12px → var(--font-size-14)
   */
  if (fileWrongCategory.length > 0) {
    for (const item of fileWrongCategory) {
      stats.wrongCategory.push({
        file,
        ...item,
      });
    }
  }

  return {
    replacements,
    safe: fileSafe,
    wrongCategory: fileWrongCategory,
    unmapped: fileUnmapped,
  };
}

function printWrongCategory(stats) {
  if (stats.wrongCategory.length === 0) {
    return;
  }

  console.log('');
  console.log('IGNORED — AMBIGUOUS TOKEN MATCHES');
  console.log('================================');

  for (const item of stats.wrongCategory) {
    console.log('');
    console.log(`${item.value}`);

    console.log(
      `  ${relative(item.file)}`
    );

    console.log(
      `    ${item.property} (${CATEGORY_LABELS[item.category] || item.category})`
    );

    if (item.tokens && item.tokens.length > 0) {
      console.log(
        `    Candidate token(s): ${item.tokens
          .map((token) => token.name)
          .join(', ')}`
      );
    }
  }
}

function printUnmapped(stats) {
  if (stats.unmapped.size === 0) {
    return;
  }

  const entries = Array.from(stats.unmapped.values())
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.value.localeCompare(b.value);
    });

  console.log('');
  console.log('UNMAPPED DESIGN VALUES');
  console.log('======================');

  for (const item of entries) {
    const category =
      CATEGORY_LABELS[item.category] || item.category;

    console.log(
      `${item.value} — ${item.count} occurrence${
        item.count === 1 ? '' : 's'
      } [${category}]`
    );

    const files = Array.from(item.files)
      .sort()
      .map(relative);

    for (const file of files) {
      console.log(`  ${file}`);
    }
  }
}

function main() {
  console.log('');
  console.log('Theme / Design Token Refactor');
  console.log('=============================');
  console.log('');

  const files = getAllFiles(ROOT);

  console.log(`Scanning ${files.length} files...`);
  console.log('');

  const tokens = extractCssVariables(files);

  console.log(`Found ${tokens.length} CSS variables.`);
  console.log('');

  const stats = {
    safe: 0,
    ambiguous: 0,
    wrongCategory: [],
    unmapped: new Map(),
    modifiedFiles: new Set(),
  };

  for (const file of files) {
    scanFile(file, tokens, stats);
  }

  console.log('');
  console.log('-----------------------------');
  console.log('SUMMARY');
  console.log('-----------------------------');
  console.log(`Files scanned:          ${files.length}`);
  console.log(`CSS variables:          ${tokens.length}`);
  console.log(`Safe replacements:      ${stats.safe}`);
  console.log(`Ambiguous matches:      ${stats.ambiguous}`);
  console.log(
    `Modified files:         ${stats.modifiedFiles.size}`
  );
  console.log(
    `Unmapped values:        ${Array.from(
      stats.unmapped.values()
    ).reduce((total, item) => total + item.count, 0)}`
  );

  printWrongCategory(stats);
  printUnmapped(stats);

  console.log('');

  if (DRY_RUN) {
    console.log(
      'DRY RUN: No files were modified.'
    );
    console.log(
      'Run --write to apply ONLY the safe replacements.'
    );
  } else {
    console.log(
      `WRITE COMPLETE: ${stats.modifiedFiles.size} files modified.`
    );
  }

  console.log('');
}

main();
