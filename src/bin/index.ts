#!/usr/bin/env node

import { generateTranslationsDTS } from "./commands/generate-translations.js";
import { logError, logInfo } from "./logger.js";

type ArgOpts = {
  fn: () => void;
  desc: string;
};
const actions: Record<string, ArgOpts> = {
  generate: {
    fn: generateTranslationsDTS,
    desc: "Generate translations from cloud",
  },
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !(command in actions)) {
    logInfo("Usage: zykie <command>");
    logInfo("Available commands:");
    Object.keys(actions).forEach((cmd) =>
      logInfo(`  - ${cmd}:  ${actions[cmd].desc}`),
    );
    process.exit(1);
  }

  try {
    await actions[command].fn();
  } catch (err) {
    logError("An error occurred:");
    console.error(err);
    process.exit(1);
  }
}

main();
