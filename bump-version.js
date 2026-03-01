#!/usr/bin/env node

/**
 * bump-version.js
 * Auto-increments version in package.json and app.json before builds.
 *
 * Usage (via npm scripts):
 *   node bump-version.js          → patch (1.0.0 → 1.0.1)
 *   node bump-version.js minor    → minor (1.0.0 → 1.1.0)
 *   node bump-version.js major    → major (1.0.0 → 2.0.0)
 */

const fs = require("fs");
const path = require("path");

const PACKAGE_JSON = path.resolve(__dirname, "package.json");
const APP_JSON = path.resolve(__dirname, "app.json");

// --- Helpers ----------------------------------------------------------------

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function bumpSemver(version, releaseType) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid semver: "${version}"`);
  }
  let [major, minor, patch] = parts;
  switch (releaseType) {
    case "major": major++; minor = 0; patch = 0; break;
    case "minor": minor++; patch = 0; break;
    case "patch": default: patch++; break;
  }
  return `${major}.${minor}.${patch}`;
}

/**
 * Derive an integer build number from a semver string.
 * e.g. "1.4.23" → 10423  (major*10000 + minor*100 + patch)
 * This keeps the build number always increasing alongside the version.
 */
function buildNumberFromSemver(version) {
  const [major, minor, patch] = version.split(".").map(Number);
  return major * 10000 + minor * 100 + patch;
}

// --- Main -------------------------------------------------------------------

const releaseType = (process.argv[2] || "patch").toLowerCase();
if (!["major", "minor", "patch"].includes(releaseType)) {
  console.error(`❌  Unknown release type: "${releaseType}". Use major | minor | patch.`);
  process.exit(1);
}

// 1. package.json
const pkg = readJson(PACKAGE_JSON);
const oldVersion = pkg.version;
const newVersion = bumpSemver(oldVersion, releaseType);
pkg.version = newVersion;
writeJson(PACKAGE_JSON, pkg);
console.log(`📦  package.json  ${oldVersion} → ${newVersion}`);

// 2. app.json
const app = readJson(APP_JSON);
const expo = app.expo ?? app; // support both { expo: {...} } and flat shapes

const oldAppVersion = expo.version;
expo.version = newVersion;

// iOS buildNumber (string)
const oldIosBuild = expo.ios?.buildNumber;
const newIosBuild = String(buildNumberFromSemver(newVersion));
if (expo.ios) {
  expo.ios.buildNumber = newIosBuild;
}

// Android versionCode (integer)
const oldAndroidCode = expo.android?.versionCode;
const newAndroidCode = buildNumberFromSemver(newVersion);
if (expo.android) {
  expo.android.versionCode = newAndroidCode;
}

writeJson(APP_JSON, app);
console.log(`📱  app.json      version: ${oldAppVersion} → ${newVersion}`);
if (expo.ios)     console.log(`    iOS          buildNumber: ${oldIosBuild} → ${newIosBuild}`);
if (expo.android) console.log(`    Android      versionCode: ${oldAndroidCode} → ${newAndroidCode}`);

console.log(`\n✅  Version bumped to ${newVersion} (${releaseType})`);