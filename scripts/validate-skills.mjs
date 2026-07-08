#!/usr/bin/env node
// Validate that every skills/<name>/SKILL.md has well-formed frontmatter.
// Zero dependencies — parses the leading `---` block by hand.
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const SKILLS_DIR = "skills";
const REQUIRED = ["name", "description"];
const errors = [];

function parseFrontmatter(text) {
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return null;
  const block = text.slice(3, end).trim();
  const keys = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([a-zA-Z0-9_-]+):/);
    if (m) keys[m[1]] = line.slice(m[0].length).trim();
  }
  return keys;
}

if (!existsSync(SKILLS_DIR)) {
  console.error(`No ${SKILLS_DIR}/ directory found.`);
  process.exit(1);
}

const dirs = readdirSync(SKILLS_DIR).filter((d) =>
  statSync(join(SKILLS_DIR, d)).isDirectory(),
);

if (dirs.length === 0) errors.push("No skills found under skills/.");

for (const dir of dirs) {
  const path = join(SKILLS_DIR, dir, "SKILL.md");
  if (!existsSync(path)) {
    errors.push(`${dir}: missing SKILL.md`);
    continue;
  }
  const fm = parseFrontmatter(readFileSync(path, "utf8"));
  if (!fm) {
    errors.push(`${dir}: missing or malformed frontmatter block`);
    continue;
  }
  for (const key of REQUIRED) {
    if (!fm[key]) errors.push(`${dir}: frontmatter missing "${key}"`);
  }
  if (fm.name && fm.name !== dir) {
    errors.push(`${dir}: frontmatter name "${fm.name}" != folder name "${dir}"`);
  }
}

if (errors.length) {
  console.error("Skill validation failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log(`✓ ${dirs.length} skill(s) valid.`);
