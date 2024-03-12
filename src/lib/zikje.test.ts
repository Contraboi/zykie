import { test, expect } from "vitest";
import { createZikje } from "./zikje";

const locales = ["en", "de", "ba", "fr"] as const;
const currentLocale = "en";
const fallbackLocale = "ba";

const zikje = createZikje({
    locales,
    currentLocale,
    fallbackLocale,
});

const hello = zikje.create({
    en: "Hello!",
    de: "Hallo!",
    ba: "Zdravo!",
    fr: null,
});

const greet = zikje.create({
    en: "Hello var{name}, you work at var{company}",
    de: "Hallo var{name}, Sie arbeiten bei var{company}",
    ba: "Zdravo var{name}, vi radite kod var{company}",
    fr: null,
});

const birthdayInfo = zikje
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
    zikje.changeLocale("de");

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
    zikje.changeLocale("ba");

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
    zikje.changeLocale("fr");

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
        `Rođeni ste ${birthdayInfoStrings.date} u ${birthdayInfoStrings.place} i imate ${birthdayInfoStrings.age} godina`
    );
});

test("With overwritten locale from de to ba", () => {
    zikje.changeLocale("de");

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
