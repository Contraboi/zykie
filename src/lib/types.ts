export type GetVariablesFromString<S extends string> =
    S extends `${infer TPrefix}var{${infer TVariableName}}${infer TSuffix}`
        ? [TVariableName, ...GetVariablesFromString<TSuffix>]
        : [];

export type GetVariableFromString<String extends string> =
    GetVariablesFromString<String>[number];

export type Condition<
    TLocales extends readonly string[],
    TString extends string,
> = {
    function: (variables: {
        [key in GetVariableFromString<TString>]: string;
    }) => boolean;
    translations: Partial<{
        [key in TLocales[number]]: string;
    }>;
};
