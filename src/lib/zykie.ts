import fs from "fs";
import {
  Condition,
  ConditionFunction,
  ConditionTranslations,
  GeneratorEntry,
  GetVariablesFromString,
} from "./types";
import { tryCatch } from "./utils";

let __currentLocale = "";

type GenerateFromJsonOpts = {
  in: string;
};

export class Zykie<
  TLocales extends readonly string[],
  TFallbackLocale extends string,
> {
  private readonly fallbackLocale: TFallbackLocale;

  constructor({
    locales,
    currentLocale,
    fallbackLocale,
  }: {
    locales: TLocales;
    currentLocale: TLocales[number];
    fallbackLocale: TFallbackLocale;
  }) {
    if (!locales.includes(currentLocale)) {
      throw new Error(
        `Current locale "${currentLocale}" is not included in the list of locales`,
      );
    }

    if (!locales.includes(fallbackLocale)) {
      throw new Error(
        `Default locale "${fallbackLocale}" is not included in the list of locales`,
      );
    }

    __currentLocale = currentLocale;
    this.fallbackLocale = fallbackLocale;
  }

  async generateFromJson<
    TTranslationMap extends {
      [K in keyof TTranslationMap]: Array<
        GeneratorEntry<
          TTranslationMap[K][number]["translation"] & string,
          TLocales[number]
        >
      >;
    },
  >(
    opts: GenerateFromJsonOpts,
  ): Promise<{
    [K in keyof TTranslationMap]: ZykieTranslation<
      TTranslationMap[K][number]["translation"] & string,
      TTranslationMap[K][number]["locale"] extends TFallbackLocale
        ? TTranslationMap[K][number]["translation"] & string
        : never,
      TLocales
    >;
  }> {
    0;
    const file = fs.readFileSync(opts.in, "utf-8");
    const json = await tryCatch<TTranslationMap>(JSON.parse(file));

    if (json.error) {
      throw new Error(
        "There was an error while generating from json ${opts.in} file",
      );
    }

    const map = {} as {
      [K in keyof TTranslationMap]: ZykieTranslation<
        TTranslationMap[K][number]["translation"] & string,
        TTranslationMap[K][number]["locale"] extends TFallbackLocale
          ? TTranslationMap[K][number]["translation"] & string
          : never,
        TLocales
      >;
    };

    const keys = Object.keys(json.data);

    for (const key of keys) {
      const entries = json.data[key] as Array<GeneratorEntry<string, string>>;
      const defaults = {} as Record<TLocales[number], string>;
      const variations = {} as Record<string, Record<TLocales[number], string>>;
      let defaultT: string | null = null;

      for (const entry of entries) {
        if (entry.type === "default") {
          defaults[entry.locale] = entry.translation;
          if (!defaultT && entry.locale === this.fallbackLocale)
            defaultT = entry.translation;
        }
        if (entry.type === "variation") {
          variations[entry.condition] = {
            ...variations[entry.condition],
            [entry.locale]: entry.translation,
          };
        }
      }

      const t = this.create(defaults);
      const varKeys = Object.keys(variations);

      for (const k of varKeys) {
        // Extract all var{...} variable names
        const varNames = [...(defaultT?.matchAll(/var{([^}]+)}/g) || [])].map(
          (m) => m[1],
        );

        // Split on AND operator
        const conditionParts = k.split("&&").map((part) => part.trim());

        // Parse each condition expression
        const parsedConditions = conditionParts
          .map((part) => {
            const match = part.match(/(.*?)([%><=])(.*)/);
            if (!match) return null;

            const [, leftRaw, operator, rightRaw] = match;
            const left = leftRaw.trim();
            const right = rightRaw.trim();

            return { left, operator, right };
          })
          .filter(Boolean);

        t.conditions.push({
          function: (opts) => {
            return parsedConditions.every(({ left, operator, right }) => {
              // Only allow access to variables defined in var{...}
              if (!varNames.includes(left)) return false;

              const a = opts[left];
              const b = isNaN(Number(right)) ? right : Number(right);
              const numA = isNaN(Number(a)) ? a : Number(a);

              console.log(variations[k]);

              switch (operator) {
                case "=":
                  return numA == b;
                case ">":
                  return numA > b;
                case "<":
                  return numA < b;
                case "%":
                  return Number(numA) % Number(b) === 0;
                default:
                  return false;
              }
            });
          },
          translations: variations[k],
        });
      }

      map[key] = t;
    }

    return map;
  }

  public create<TString extends string, TDefaultString extends string>(
    translations: GetVariablesFromString<TString> extends GetVariablesFromString<TDefaultString>
      ? {
          [key in TFallbackLocale]: TDefaultString;
        } & {
          [key in Exclude<TLocales[number], TFallbackLocale>]: TString | null;
        }
      : `The variables in the translations do not match the variables in the fallback '${TFallbackLocale}' translation`,
  ) {
    return new ZykieTranslation<TString, TDefaultString, TLocales>({
      translations: translations as {
        [key in TLocales[number]]: TString;
      },
      fallbackLocale: this.fallbackLocale,
    });
  }

  public changeLocale(newLocale: TLocales[number]): void {
    __currentLocale = newLocale;
  }
}

type GetOptions<T extends readonly string[]> = {
  locale?: T[number];
};

class ZykieTranslation<
  TString extends string,
  TDefaultString extends string,
  TLocales extends readonly string[],
> {
  private readonly fallbackLocale: TLocales[number];
  public conditions: Condition<TLocales, TString>[] = [];
  translations: {
    [key in TLocales[number]]: TString;
  };

  constructor({
    translations,
    fallbackLocale,
  }: {
    translations: {
      [key in TLocales[number]]: TString;
    };
    fallbackLocale: TLocales[number];
  }) {
    this.fallbackLocale = fallbackLocale;
    this.translations = translations;
  }

  public get(
    ...args: GetVariablesFromString<TString>[number] extends never
      ? [options?: GetOptions<TLocales>]
      : [
          variables: {
            [key in GetVariablesFromString<TString>[number]]: string;
          },
          options?: GetOptions<TLocales>,
        ]
  ) {
    const { variables, options } = this.normalizeArgs(args);
    const locale = options?.locale ?? this.getCurrentLocale();

    let translatedString = this.getTranslatedStringByCondition(
      locale,
      variables,
    );

    if (!translatedString) {
      translatedString = this.getFallbackTranslatedString(locale);
    }

    return this.setVariables(translatedString, variables);
  }

  private getTranslatedStringByCondition(
    locale: TLocales[number],
    variables: {
      [key in GetVariablesFromString<TString>[number]]: string;
    },
  ): string | null {
    const condition = this.conditions.find((condition) =>
      condition.function(variables),
    );
    let translatedString =
      condition?.translations[locale] ??
      this.translations[locale] ??
      condition?.translations[this.fallbackLocale];

    return translatedString ?? null;
  }

  private normalizeArgs(args: any[]): {
    variables: { [key in GetVariablesFromString<TString>[number]]: string };
    options?: GetOptions<TLocales>;
  } {
    const fallbackTranslation = this.translations[this.fallbackLocale];
    const hasVariables = fallbackTranslation.match(/var{(.+?)}/g);

    if (hasVariables && args.length === 0) {
      throw new Error("Missing variables");
    }

    if (hasVariables || args.length === 2) {
      return {
        variables: args[0],
        options: args[1],
      };
    }

    return {
      variables: {},
      options: args[0],
    };
  }

  private getFallbackTranslatedString(locale: TLocales[number]) {
    const translatedString = this.translations[this.fallbackLocale];

    if (!translatedString) {
      throw new Error(
        `No translation for locale "${locale}" found and no fallback locale provided`,
      );
    }

    console.warn(
      `No translation for locale "${locale}" found, returning fallback locale translation: "${this.fallbackLocale}"`,
    );

    return translatedString;
  }

  private setVariables(
    translatedString: string,
    variables: {
      [key in GetVariablesFromString<TString>[number]]: string;
    },
  ) {
    for (const key in variables) {
      translatedString = translatedString.replace(
        `var{${key}}`,
        variables[key],
      );
    }

    return translatedString;
  }

  public variation<TVariation extends string>(
    condition: ConditionFunction<TString>,
    translations: Partial<{
      [key in TLocales[number]]: GetVariablesFromString<TVariation> extends GetVariablesFromString<TString>
        ? TVariation
        : `The variables in the translations do not match the variables in the ${TDefaultString} translation`;
    }>,
  ) {
    this.conditions.push({
      function: condition,
      translations: translations as ConditionTranslations<TLocales>,
    });

    return this;
  }

  public getCurrentLocale() {
    return __currentLocale;
  }
}
