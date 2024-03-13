import {
    Condition,
    GetVariableFromString,
    TranslationsRecord,
    Variables,
} from "./types";

let __currentLocale = "";

export class Zykie<TLocales extends readonly string[]> {
    private fallbackLocale?: TLocales[number];

    constructor({
        locales,
        currentLocale,
        fallbackLocale,
    }: {
        locales: TLocales;
        currentLocale: TLocales[number];
        fallbackLocale: TLocales[number];
    }) {
        if (!locales.includes(currentLocale)) {
            throw new Error(
                `Current locale "${currentLocale}" is not included in the list of locales`
            );
        }

        if (!locales.includes(fallbackLocale)) {
            throw new Error(
                `Default locale "${fallbackLocale}" is not included in the list of locales`
            );
        }

        __currentLocale = currentLocale;
        this.fallbackLocale = fallbackLocale;
    }

    public create<TString extends string>(
        translations: TranslationsRecord<
            TLocales[number],
            TString | null,
            TLocales[number]
        >
    ) {
        return new CreateTranslastion<TString, TLocales>({
            translations,
            fallbackLocale: this.fallbackLocale,
        });
    }

    public changeLocale(newLocale: TLocales[number]): void {
        __currentLocale = newLocale;
    }
}

type CurrentTranslations<TLocales extends readonly string[]> =
    TranslationsRecord<TLocales[number], string | null, TLocales[number]>;

class CreateTranslastion<
    TString extends string,
    TLocales extends readonly string[],
> {
    private fallbackLocale: TLocales[number];
    private conditions: Condition<TLocales, TString>[] = [];
    translations: CurrentTranslations<TLocales>;

    constructor({ translations, fallbackLocale }) {
        this.fallbackLocale = fallbackLocale;
        this.translations = translations;
    }

    get(
        variables: Variables<TString, TLocales[number]>,
        options?: {
            locale?: TLocales[number];
        }
    ) {
        const locale = options?.locale ?? __currentLocale;
        let translatedString = this.getTranslatedStringByCondition(
            locale,
            variables
        );

        if (!translatedString) {
            translatedString = this.getFallbackTranslatedString(locale);
        }

        return this.setVariables(translatedString, variables);
    }

    private getTranslatedStringByCondition(
        locale: TLocales[number],
        variables: Variables<TString, TLocales[number]>
    ): string | null {
        const condition = this.conditions.find((condition) =>
            condition.function(variables)
        );
        let translatedString =
            condition?.translations[locale] ??
            this.translations[locale] ??
            condition?.translations[this.fallbackLocale];

        return translatedString ?? null;
    }

    private getFallbackTranslatedString(locale: TLocales[number]) {
        const translatedString = this.translations[this.fallbackLocale];

        if (!translatedString) {
            throw new Error(
                `No translation for locale "${locale}" found and no fallback locale provided`
            );
        }

        console.warn(
            `No translation for locale "${locale}" found, returning fallback locale translation: "${this.fallbackLocale}"`
        );

        return translatedString;
    }

    private setVariables(
        translatedString: string,
        variables: Variables<TString, TLocales[number]>
    ) {
        const keys = Object.keys(variables) as (keyof typeof variables)[];
        for (const key of keys) {
            translatedString = translatedString.replace(
                `var{${key}}`,
                variables[key]
            );
        }

        return translatedString;
    }

    variation(
        condition: (
            values: Record<GetVariableFromString<TString>, string | number>
        ) => boolean,
        translations: Partial<CurrentTranslations<TLocales>>
    ) {
        this.conditions.push({
            function: condition,
            translations,
        });

        return this;
    }
}
