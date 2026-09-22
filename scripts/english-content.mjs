import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  KINDS,
  LEVELS,
  validateContent,
  validateA1Bundle,
} from "../src/english/validation.mjs";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/data/english",
);
export async function validateFiles(directory = root, publishedOnly = false) {
  const names = (await fs.readdir(directory)).filter(
    (n) => n.endsWith(".json"),
  );
  const errors = [],
    files = {};
  for (const name of names) {
    const [level, kind, ...suffix] = name.split(".");
    if (
      !LEVELS.includes(level) ||
      !KINDS.includes(kind) ||
      suffix.join(".") !== "json"
    ) {
      errors.push(
        `${name}: noncanonical filename; place batches outside runtime directory`,
      );
      continue;
    }
    try {
      files[name] = JSON.parse(
        await fs.readFile(path.join(directory, name), "utf8"),
      );
    } catch (e) {
      errors.push(`${name}: ${e.message}`);
    }
  }
  for (const [name, data] of Object.entries(files)) {
    const [level, kind] = name.split(".");
    if (Array.isArray(data) && data.some(item => item?.source !== "seed")) errors.push(name+": runtime files must contain reviewed seed content only");
    const sentenceIds = (files[`${level}.sentences.json`] || []).map(
      (s) => s?.id,
    );
    errors.push(
      ...validateContent(kind, data, { level, sentenceIds }).errors.map(
        (e) => `${name}: ${e}`,
      ),
    );
  }
  const a1 = Object.fromEntries(
    ["sentences", "vocab", "theory"].map((k) => [k, files[`A1.${k}.json`]]),
  );
  errors.push(...validateA1Bundle(a1).errors);
  for (const level of LEVELS) {
    const kinds = level === 'K' ? ['vocab','phrases'] : level === 'C3' ? ['vocab','theory','passages','rewrites'] : ['sentences','vocab','theory'];
    for (const kind of kinds) if (!files[level+'.'+kind+'.json']) errors.push(level+': missing '+kind);
    if ((files[level+'.vocab.json']?.length || 0) < 100) errors.push(level+': requires 100 vocabulary entries');
    if (!['K','C3'].includes(level) && (files[level+'.sentences.json']?.length || 0) < 200) errors.push(level+': requires 200 sentences');
    if (level === 'K' && (files['K.phrases.json']?.length || 0) < 50) errors.push('K: requires 50 phrases');
    if (level === 'C3' && ((files['C3.rewrites.json']?.length || 0) < 200 || (files['C3.passages.json']?.length || 0) < 40)) errors.push('C3: requires 200 rewrites and 40 passages');
  }
  if (errors.length) throw new Error([...new Set(errors)].join("\n"));
  return {
    schemaVersion: 1,
    contentVersion: createHash("sha256")
      .update(JSON.stringify(files))
      .digest("hex")
      .slice(0, 16),
    files: names.length,
    sentences: a1.sentences.length,
    vocab: a1.vocab.length,
  };
}
async function main() {
  const [command = "validate", kind, level, output, ...inputs] =
    process.argv.slice(2);
  if (command === "validate") {
    console.log(JSON.stringify(await validateFiles(), null, 2));
    return;
  }
  if (
    command !== "merge" ||
    !KINDS.includes(kind) ||
    kind === "theory" ||
    !LEVELS.includes(level) ||
    !output ||
    !inputs.length
  )
    throw new Error(
      "Usage: node scripts/english-content.mjs validate | merge <sentences|vocab|passages|rewrites|phrases> <level> <new-output.json> <batch1.json> ...",
    );
  const batches = await Promise.all(
    inputs.map(async (input) => JSON.parse(await fs.readFile(input, "utf8"))),
  );
  if (batches.some((batch) => !Array.isArray(batch)))
    throw new Error("Each batch must be a JSON array");
  const merged = batches.flat();
  const result = validateContent(kind, merged, { level });
  if (!result.valid) throw new Error(result.errors.join("\n"));
  // Never overwrite Gemini's content or silently collapse duplicate IDs.
  await fs.writeFile(output, JSON.stringify(merged, null, 2) + "\n", {
    flag: "wx",
  });
  console.log(`Wrote ${merged.length} validated entries to ${output}`);
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
