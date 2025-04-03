import fs from "fs";
import path from "path";
import { inputPath, outPath } from "../../utils.js";
import { logError, logInfo, logSuccess } from "../logger.js";

type JsonTranslations = Record<string, Record<string, string>>;

export function generateTranslationsDTS() {
  try {
    logInfo(`⌛ Generating ${outPath}`);

    const input = JSON.parse(
      fs.readFileSync(path.resolve(inputPath), "utf-8"),
    ) as JsonTranslations;

    let out = `// Auto-generated from ${inputPath}. Do not edit manually.\n\n`;
    out += `export type Translations = {\n`;

    for (const key of Object.keys(input)) {
      out += `  "${key}": {\n`;
      for (const locale of Object.keys(input[key])) {
        const val = input[key][locale];
        const escaped = val.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        out += `    "${locale}": "${escaped}";\n`;
      }
      out += `  };\n`;
    }

    out += `};\n`;

    fs.writeFileSync(path.resolve(outPath), out);
    logSuccess(`✅ Generated ${outPath}`);
  } catch (e) {
    logError(`There as an error while generating translations: ${e}`);
  }
}
