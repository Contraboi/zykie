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

const etst = zykie.create({
    en: "Hello! var{name}",
    de: "Hallo! var{name}",
    ba: "Zdravo! var{name}",
    fr: null,
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

const birthdayInfo = zykie
    .create({
        en: "You were born on var{date} in var{place} and you are var{age} years old",
        de: "Sie wurden am var{date} in var{place} geboren und sind var{age} Jahre alt",
        ba: "Rođeni ste var{date} u var{place} i imate var{age} godina",
        fr: null,
    })
    .variation(({ age }) => age === 1, {
        ba: "Rođeni ste var{date} u var{place} i imate var{age} godinu",
    })
    .variation(
        ({ age }) => {
            const number = Number(age);
            return (
                number % 10 == 2 ||
                number % 10 === 3 ||
                number % 10 === 4 ||
                (number > 1 && number < 5)
            );
        },
        {
            ba: "Rođeni ste var{date} u var{place} i imate var{age} godine",
        }
    );

// zykie
const variaton = zykie
    .create({
        en: "default var{variaton}",
        de: "Standard var{variaton}",
        ba: "Osnovni var{variaton}",
        fr: null,
    })
    .variation(({ variaton }) => variaton === "first", {
        en: "first var{variaton}",
        de: "erste var{variaton}",
        ba: "prvi var{variaton}",
    })
    .variation(({ variaton }) => variaton === "second", {
        en: "second var{variaton}",
        de: "zweite var{variaton}",
        ba: "drugi var{variaton}",
    })
    .variation(
        ({ variaton }) => variaton === "first" || variaton === "second",
        {
            en: "fourth var{variaton}",
            de: "vierte var{variaton}",
            ba: "četvrti var{variaton}",
        }
    );

const greetStrings = {
    name: "Contra",
    company: "Gengo",
};

const birthdayInfoStrings = {
    date: "01.01.2000",
    place: "Wonderland",
    age: "24",
};

test("Check default translations", () => {
    expect(hello.get({})).toBe("Hello!");
    expect(
        greet.get({ name: greetStrings.name, company: greetStrings.company })
    ).toBe(`Hello ${greetStrings.name}, you work at ${greetStrings.company}`);

    expect(
        birthdayInfo.get({
            date: birthdayInfoStrings.date,
            place: birthdayInfoStrings.place,
            age: birthdayInfoStrings.age,
        })
    ).toBe(
        `You were born on ${birthdayInfoStrings.date} in ${birthdayInfoStrings.place} and you are ${birthdayInfoStrings.age} years old`
    );
});

test("Check translations for de locale", () => {
    zykie.changeLocale("de");

    expect(hello.get({})).toBe("Hallo!");

    expect(
        greet.get({ name: greetStrings.name, company: greetStrings.company })
    ).toBe(
        `Hallo ${greetStrings.name}, Sie arbeiten bei ${greetStrings.company}`
    );

    expect(
        birthdayInfo.get({
            date: birthdayInfoStrings.date,
            place: birthdayInfoStrings.place,
            age: birthdayInfoStrings.age,
        })
    ).toBe(
        `Sie wurden am ${birthdayInfoStrings.date} in ${birthdayInfoStrings.place} geboren und sind ${birthdayInfoStrings.age} Jahre alt`
    );
});

test("Check translations for ba locale", () => {
    zykie.changeLocale("ba");

    expect(hello.get({})).toBe("Zdravo!");

    expect(
        greet.get({ name: greetStrings.name, company: greetStrings.company })
    ).toBe(
        `Zdravo ${greetStrings.name}, vi radite kod ${greetStrings.company}`
    );

    expect(
        birthdayInfo.get({
            date: birthdayInfoStrings.date,
            place: birthdayInfoStrings.place,
            age: birthdayInfoStrings.age,
        })
    ).toBe(
        `Rođeni ste ${birthdayInfoStrings.date} u ${birthdayInfoStrings.place} i imate ${birthdayInfoStrings.age} godine`
    );
});

test("Check translations for fr locale with fallback locale", () => {
    zykie.changeLocale("fr");

    expect(hello.get({})).toBe("Zdravo!");

    expect(
        greet.get({ name: greetStrings.name, company: greetStrings.company })
    ).toBe(
        `Zdravo ${greetStrings.name}, vi radite kod ${greetStrings.company}`
    );

    expect(
        birthdayInfo.get({
            date: birthdayInfoStrings.date,
            place: birthdayInfoStrings.place,
            age: birthdayInfoStrings.age,
        })
    ).toBe(
        `Rođeni ste ${birthdayInfoStrings.date} u ${birthdayInfoStrings.place} i imate ${birthdayInfoStrings.age} godine`
    );
});

test("With overwritten locale from de to ba", () => {
    zykie.changeLocale("de");

    expect(
        hello.get(
            {},
            {
                locale: "ba",
            }
        )
    ).toBe("Zdravo!");

    expect(
        greet.get(
            { name: greetStrings.name, company: greetStrings.company },
            {
                locale: "ba",
            }
        )
    ).toBe(
        `Zdravo ${greetStrings.name}, vi radite kod ${greetStrings.company}`
    );

    expect(
        birthdayInfo.get(
            {
                date: birthdayInfoStrings.date,
                place: birthdayInfoStrings.place,
                age: birthdayInfoStrings.age,
            },
            {
                locale: "ba",
            }
        )
    ).toBe(
        `Rođeni ste ${birthdayInfoStrings.date} u ${birthdayInfoStrings.place} i imate ${birthdayInfoStrings.age} godine`
    );
});

test("Check variations", () => {
    zykie.changeLocale("en");

    expect(variaton.get({ variaton: "fourth" })).toBe("default fourth");
    expect(variaton.get({ variaton: "first" })).toBe("first first");
    expect(variaton.get({ variaton: "second" })).toBe("second second");

    zykie.changeLocale("de");
    expect(variaton.get({ variaton: "fourth" })).toBe("Standard fourth");
    expect(variaton.get({ variaton: "first" })).toBe("erste first");
    expect(variaton.get({ variaton: "second" })).toBe("zweite second");

    zykie.changeLocale("ba");
    expect(variaton.get({ variaton: "fourth" })).toBe("Osnovni fourth");
    expect(variaton.get({ variaton: "first" })).toBe("prvi first");
    expect(variaton.get({ variaton: "second" })).toBe("drugi second");

    zykie.changeLocale("fr");
    expect(variaton.get({ variaton: "fourth" })).toBe("Osnovni fourth");
    expect(variaton.get({ variaton: "first" })).toBe("prvi first");
    expect(variaton.get({ variaton: "second" })).toBe("drugi second");
});
