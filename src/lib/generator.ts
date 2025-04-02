import fs from "fs";
import path from "path";

export function generateTranslationType(inputPath: string, outputPath: string) {
  try {
    const json = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

    const locales = Object.keys(json);
    const keys = Object.keys(json[locales[0]]);

    let out = `// Auto-generated from ${inputPath}. Do not edit manually.\n\n`;

    out += `export type Translations = {\n`;

    for (const key of keys) {
      out += `  "${key}": {\n`;
      for (const locale of locales) {
        const val = json[locale][key];
        if (val === null) {
          out += `    "${locale}": null;\n`;
        } else {
          const escaped = val.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
          out += `    "${locale}": "${escaped}";\n`;
        }
      }
      out += `  };\n`;
    }

    out += `};\n`;

    fs.writeFileSync(path.resolve(outputPath), out);
    console.log(`✅ Generated ${outputPath}`);
    return true;
  } catch (e) {
    console.error(
      "There was an error while generating translations typescript type",
      e,
    );
    return false;
  }
}
