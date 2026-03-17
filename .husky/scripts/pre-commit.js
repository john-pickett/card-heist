#!/usr/bin/env node

/**
 * scripts/pre-commit.js
 *
 * Run via .husky/pre-commit shell hook.
 * 1. Scans staged files for TODO / FIXME / HACK / NOTE comments.
 * 2. Runs `npm test` and blocks the commit if tests fail.
 *
 * Env flags:
 *   BLOCK_ON_TODO=1   Block commit when TODO-style comments are found.
 *   SKIP_TESTS=1      Skip the test runner (escape hatch for WIP commits).
 */

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// --- Config -----------------------------------------------------------------

const TAGS = ["TODO", "FIXME", "HACK", "NOTE"];
const TAG_PATTERN = new RegExp(`(${TAGS.join("|")})[:\\s](.*)`, "i");

const ALLOWED_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx",
  ".mjs", ".cjs",
]);

const IGNORED_PATHS = [
  "node_modules",
  ".expo",
  "dist",
  "build",
  ".husky",
  "scripts",
];

const BLOCK_ON_TODO = process.env.BLOCK_ON_TODO === "1";
const SKIP_TESTS    = process.env.SKIP_TESTS === "1";

// --- ANSI colors ------------------------------------------------------------

const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  green:  "\x1b[32m",
  cyan:   "\x1b[36m",
  gray:   "\x1b[90m",
};

const TAG_COLOR = {
  TODO:  c.yellow,
  FIXME: c.red,
  HACK:  c.red,
  NOTE:  c.cyan,
};

// --- Helpers ----------------------------------------------------------------

function getStagedFiles() {
  const output = execSync("git ls-files", { encoding: "utf8" });
  return output.trim().split("\n").filter(Boolean);
}

function isIgnored(filePath) {
  return IGNORED_PATHS.some((p) => filePath.includes(p));
}

function isAllowedExtension(filePath) {
  return ALLOWED_EXTENSIONS.has(path.extname(filePath));
}

function scanFile(filePath) {
  const results = [];
  let lines;
  try {
    lines = fs.readFileSync(filePath, "utf8").split("\n");
  } catch {
    return results;
  }
  lines.forEach((line, idx) => {
    const match = TAG_PATTERN.exec(line);
    if (match) {
      results.push({
        file: filePath,
        line: idx + 1,
        tag: match[1].toUpperCase(),
        text: match[2].trim(),
      });
    }
  });
  return results;
}

function header(emoji, label) {
  console.log(`\n${c.bold}${emoji}  ${label}${c.reset}`);
  console.log(c.dim + "─".repeat(50) + c.reset);
}

// --- Step 1: TODO scan ------------------------------------------------------

header("📋", "Scanning staged files for comments...");

const stagedFiles = getStagedFiles()
  .filter((f) => !isIgnored(f) && isAllowedExtension(f));

const allFindings = stagedFiles.flatMap(scanFile);

if (allFindings.length === 0) {
  console.log(`  ${c.green}✓ No TODO-style comments found.${c.reset}`);
} else {
  const byTag = allFindings.reduce((acc, f) => {
    acc[f.tag] = (acc[f.tag] || 0) + 1;
    return acc;
  }, {});

  const summary = Object.entries(byTag)
    .map(([tag, count]) => `${TAG_COLOR[tag]}${count} ${tag}${c.reset}`)
    .join("  ");

  console.log(`  Found: ${summary}\n`);

  const byFile = allFindings.reduce((acc, f) => {
    (acc[f.file] = acc[f.file] || []).push(f);
    return acc;
  }, {});

  for (const [file, findings] of Object.entries(byFile)) {
    console.log(`  ${c.bold}${file}${c.reset}`);
    for (const f of findings) {
      const tagColor = TAG_COLOR[f.tag] || "";
      console.log(
        `    ${c.gray}line ${String(f.line).padStart(4)}${c.reset}  ` +
        `${tagColor}${c.bold}${f.tag}${c.reset}  ` +
        `${c.dim}${f.text}${c.reset}`
      );
    }
    console.log();
  }

  if (BLOCK_ON_TODO) {
    console.log(`${c.red}${c.bold}  ✖ Commit blocked (BLOCK_ON_TODO=1).${c.reset}\n`);
    process.exit(1);
  } else {
    console.log(`  ${c.dim}Continuing — set BLOCK_ON_TODO=1 to block on these.${c.reset}`);
  }
}

// --- Step 2: Tests ----------------------------------------------------------

header("🧪", "Running tests...");

if (SKIP_TESTS) {
  console.log(`  ${c.yellow}⚠ Tests skipped (SKIP_TESTS=1).${c.reset}\n`);
  process.exit(0);
}

const result = spawnSync("npm", ["test", "--", "--watchAll=false"], {
  stdio: "inherit",  // stream test output directly to terminal
  shell: true,
});

if (result.status !== 0) {
  console.log(`\n${c.red}${c.bold}  ✖ Tests failed. Commit blocked.${c.reset}\n`);
  process.exit(1);
}

console.log(`\n${c.green}${c.bold}  ✓ All checks passed. Committing...${c.reset}\n`);
process.exit(0);