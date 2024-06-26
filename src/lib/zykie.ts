import {
  Condition,
  ConditionFunction,
  ConditionTranslations,
  GetVariablesFromString,
} from "./types";

let __currentLocale = "";

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
  private conditions: Condition<TLocales, TString>[] = [];
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
