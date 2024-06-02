import { test, expect } from "vitest";
import { Zykie } from "./zykie";

const locales = ["en", "de", "ba", "fr"] as const;
const currentLocale = "en";
const fallbackLocale = "ba";

const zykie = new Zykie({
  locales,
  currentLocale,
  fallbackLocale,
});

const hello = zykie.create({
  en: "Hello!",
  de: "Hallo!",
  ba: "Zdravo!",
  fr: null,
});

const greet = zykie.create({
  en: "Hello var{name}, you work at var{company}",
  de: "Hallo var{name}, Sie arbeiten bei var{company}",
  ba: "Zdravo var{name}, vi radite kod var{company}",
  fr: null,
});

const youHaveNDollars = zykie
  .create({
    en: "You have var{amount} dollars",
    de: "Sie haben var{amount} Dollar",
    ba: "Imate var{amount} dolara",
    fr: null,
  })
  .variation(({ amount }) => parseInt(amount) === 1, {
    en: "You have var{amount} dollar",
    ba: "Imate var{amount} dolar",
  })
  .variation(
    ({ amount }) => {
      const number = parseInt(amount);
      return number > 20 && number % 10 === 1;
    },
    {
      ba: "Imate var{amount} dolar",
    },
  );

const variation = zykie
  .create({
    en: "default var{variation}",
    de: "Standard var{variation}",
    ba: "Osnovni var{variation}",
    fr: null,
  })
  .variation(({ variation }) => variation === "first", {
    en: "first var{variation}",
    de: "erste var{variation}",
    ba: "prvi var{variation}",
  })
  .variation(({ variation }) => variation === "second", {
    en: "second var{variation}",
    de: "zweite var{variation}",
    ba: "drugi var{variation}",
  });

const greetStrings = {
  name: "Contra",
  company: "Zykie",
};

test("Check default translations", () => {
  expect(hello.get({})).toBe("Hello!");
  expect(
    greet.get({ name: greetStrings.name, company: greetStrings.company }),
  ).toBe(`Hello ${greetStrings.name}, you work at ${greetStrings.company}`);

  expect(
    youHaveNDollars.get({
      amount: "1",
    }),
  ).toBe(`You have 1 dollar`);
});

test("Check translations for de locale", () => {
  zykie.changeLocale("de");

  expect(hello.get({})).toBe("Hallo!");

  expect(
    greet.get({ name: greetStrings.name, company: greetStrings.company }),
  ).toBe(
    `Hallo ${greetStrings.name}, Sie arbeiten bei ${greetStrings.company}`,
  );

  expect(
    youHaveNDollars.get({
      amount: "1",
    }),
  ).toBe(`Sie haben 1 Dollar`);
});

test("Check translations for ba locale", () => {
  zykie.changeLocale("ba");

  expect(hello.get({})).toBe("Zdravo!");

  expect(
    greet.get({ name: greetStrings.name, company: greetStrings.company }),
  ).toBe(`Zdravo ${greetStrings.name}, vi radite kod ${greetStrings.company}`);

  expect(
    youHaveNDollars.get({
      amount: "1",
    }),
  ).toBe(`Imate 1 dolar`);
});

test("Check translations for fr locale with fallback locale", () => {
  zykie.changeLocale("fr");

  expect(hello.get({})).toBe("Zdravo!");

  expect(
    greet.get({
      name: greetStrings.name,
      company: greetStrings.company,
    }),
  ).toBe(`Zdravo ${greetStrings.name}, vi radite kod ${greetStrings.company}`);

  expect(
    youHaveNDollars.get({
      amount: "1",
    }),
  ).toBe(`Imate 1 dolar`);
});

test("With overwritten locale from de to ba", () => {
  zykie.changeLocale("de");

  expect(hello.get({ locale: "ba" })).toBe("Zdravo!");

  expect(
    greet.get(
      { name: greetStrings.name, company: greetStrings.company },
      {
        locale: "ba",
      },
    ),
  ).toBe(`Zdravo ${greetStrings.name}, vi radite kod ${greetStrings.company}`);

  expect(youHaveNDollars.get({ amount: "1" }, { locale: "ba" })).toBe(
    `Imate 1 dolar`,
  );
});

test("Check variations", () => {
  zykie.changeLocale("en");

  expect(variation.get({ variation: "fourth" })).toBe("default fourth");
  expect(variation.get({ variation: "first" })).toBe("first first");
  expect(variation.get({ variation: "second" })).toBe("second second");

  zykie.changeLocale("de");
  expect(variation.get({ variation: "fourth" })).toBe("Standard fourth");
  expect(variation.get({ variation: "first" })).toBe("erste first");
  expect(variation.get({ variation: "second" })).toBe("zweite second");

  zykie.changeLocale("ba");
  expect(variation.get({ variation: "fourth" })).toBe("Osnovni fourth");
  expect(variation.get({ variation: "first" })).toBe("prvi first");
  expect(variation.get({ variation: "second" })).toBe("drugi second");

  zykie.changeLocale("fr");
  expect(variation.get({ variation: "fourth" })).toBe("Osnovni fourth");
  expect(variation.get({ variation: "first" })).toBe("prvi first");
  expect(variation.get({ variation: "second" })).toBe("drugi second");

  zykie.changeLocale("ba");
  expect(
    youHaveNDollars.get({
      amount: "21",
    }),
  ).toBe("Imate 21 dolar");
  expect(
    youHaveNDollars.get({
      amount: "31",
    }),
  ).toBe("Imate 31 dolar");
  expect(
    youHaveNDollars.get({
      amount: "44",
    }),
  ).toBe("Imate 44 dolara");
});
