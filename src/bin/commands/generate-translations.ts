import fs from "fs";
import path from "path";
import { inputPath, outPath } from "../../utils.js";

export function generateTranslationsDTS() {
  console.log(`⌛ Generating ${outPath}`);

  const input = JSON.parse(fs.readFileSync(path.resolve(inputPath), "utf-8"));
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
  console.log(`✅ Generated ${outPath}`);
}
