import {
    GetVariableFromString,
    TranslatableString,
    Translations,
} from "./types";

export const createZikje = <TLocales extends Readonly<string[]>>({
    locales,
    currentLocale,
    fallbackLocale,
}: {
    locales: TLocales;
    currentLocale: TLocales[number];
    fallbackLocale?: TLocales[number];
}) => {
    if (!locales.includes(currentLocale)) {
        throw new Error(
            `Current locale "${currentLocale}" is not included in the list of locales`
        );
    }

    if (fallbackLocale && !locales.includes(fallbackLocale)) {
        throw new Error(
            `Default locale "${fallbackLocale}" is not included in the list of locales`
        );
    }

    return generateZikjeUtility({
        locales,
        currentLocale,
        fallbackLocale,
    });
};

function generateZikjeUtility<TLocales extends readonly string[]>({
    currentLocale,
    fallbackLocale,
}: {
    locales: TLocales;
    currentLocale: TLocales[number];
    fallbackLocale?: TLocales[number];
}) {
    type FallbackLocale = typeof fallbackLocale;
    type CurrentLocale = typeof currentLocale;
    let conditions: {
        function: (variables: object) => boolean;
        translations: Partial<
            Translations<TLocales[number], string | null, FallbackLocale>
        >;
    }[] = [];

    return {
        create: <TString extends string>(
            translations: Translations<
                TLocales[number],
                TString | null,
                FallbackLocale
            >
        ) => {
            type Variables = Record<
                GetVariableFromString<
                    TranslatableString<TString>[CurrentLocale]
                >,
                string
            >;

            function get(
                variables: Variables,
                options?: {
                    locale?: TLocales[number];
                }
            ) {
                const locale = options?.locale || currentLocale;
                let translatedString =
                    conditions.find((condition) =>
                        condition.function(variables)
                    )?.translations[locale] ??
                    (translations[locale] as string | null);

                if (fallbackLocale && !translatedString) {
                    console.warn(
                        `No translation for locale "${locale}" found, returning fallback locale translation: ` +
                            translations[fallbackLocale]
                    );

                    translatedString = translations[fallbackLocale] as string;
                }

                if (!translatedString) {
                    throw new Error(
                        `No translation for locale "${locale}" found and no fallback locale provided`
                    );
                }

                const keys = Object.keys(variables) as (keyof Variables)[];
                if (keys.length > 0) {
                    for (const key of keys) {
                        translatedString = translatedString.replace(
                            `var{${key}}`,
                            variables[key]
                        );
                    }
                }

                return translatedString;
            }

            function variation(
                condition: (
                    values: Record<
                        GetVariableFromString<TString>,
                        string | number
                    >
                ) => boolean,
                translations: Partial<
                    Translations<
                        TLocales[number],
                        string | null,
                        FallbackLocale
                    >
                >
            ) {
                conditions.push({
                    function: condition,
                    translations,
                });

                return {
                    get,
                    variation,
                };
            }

            return {
                translations,
                variation,
                get,
            };
        },

        changeLocale: (newLocale: TLocales[number]) =>
            (currentLocale = newLocale),
    };
}
