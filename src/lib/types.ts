export type GetVariablesFromString<S extends string> =
    S extends `${infer TPrefix}var{${infer TVariableName}}${infer TSuffix}`
        ? [TVariableName, ...GetVariablesFromString<TSuffix>]
        : [];

export type GetVariableFromString<String extends string> =
    GetVariablesFromString<String>[number];

export type RequiredByKeys<T, K = keyof T> = Omit<
    T & Required<Pick<T, K & keyof T>>,
    never
>;

export type TranslatableString<String extends string> = Record<string, String>;

export type TranslationsRecord<
    TKeys extends string,
    TValues extends string | null,
    TDefaultLocale,
> = RequiredByKeys<Partial<Record<TKeys, TValues>>, TDefaultLocale>;

export type Variables<TString extends string, TLocale extends string> = Record<
    GetVariableFromString<TranslatableString<TString>[TLocale]>,
    string
>;

export type Translations<TLocales extends readonly string[]> =
    TranslationsRecord<TLocales[number], string | null, TLocales[number]>;

export type Condition<
    TLocales extends readonly string[],
    TString extends string,
> = {
    function: (variables: Variables<TString, TLocales[number]>) => boolean;
    translations: Partial<Translations<TLocales>>;
};
