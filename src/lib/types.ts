export type GetVariablesFromString<S extends string> =
    S extends `${infer TPrefix}var{${infer TVariableName}}${infer TSuffix}`
        ? [TVariableName, ...GetVariablesFromString<TSuffix>]
        : [];

export type ConditionFunction<TString extends string> = (
    variables: {
        [key in GetVariablesFromString<TString>[number]]: string;
    }
) => boolean;

export type ConditionTranslations<TLocales extends readonly string[]> = {
    [key in TLocales[number]]: string;
}

export type Condition<
    TLocales extends readonly string[],
    TString extends string,
> = {
    function: ConditionFunction<TString>
    translations: ConditionTranslations<TLocales>
};
