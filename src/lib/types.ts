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

export type Translations<
    TKeys extends string,
    TValues extends string | null,
    TDefaultLocale,
> = RequiredByKeys<Partial<Record<TKeys, TValues>>, TDefaultLocale>;

