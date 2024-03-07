const fs = require('node:fs');
const availableLang = ['en', 'el'];
const defaultLang = 'en';

let translateToLang, translations;

if (process.argv.length > 2) {
    const [,, lang] = process.argv;

    if (availableLang.includes(lang)) {
        translateToLang = lang;
    } else {
        translateToLang = defaultLang;
    }
} else {
    translateToLang = [...availableLang];
}

try {
    if (typeof translateToLang === 'string') {
        translations = getTranslation(translateToLang);
    }
    if (typeof translateToLang === 'object' && translateToLang instanceof Array) {
        translations = [];

        for (const lang of translateToLang) {
            translations.push(getTranslation(lang));
        }
    }
} catch (error) {
    console.error(error);
}

if (translations) {
    try {
        const indexHtml = fs.readFileSync('index.html', 'utf8');
        let translatedIndexHtml;

        if (translations instanceof Array) {
            translatedIndexHtml = [];

            for (const translation of translations) {
                translatedIndexHtml.push(translate(indexHtml, translation));
            }
        } else {
            translatedIndexHtml = translate(indexHtml, translations);
        }

        if (
            translatedIndexHtml instanceof Array &&
            translateToLang instanceof Array
        ) {
            for (let i = 0; i < translatedIndexHtml.length; i++) {
                fs.writeFileSync(`../${translateToLang[i]}/index.html`, translatedIndexHtml[i]);
            }
        } else {
            fs.writeFileSync(`../${translateToLang}/index.html`, translatedIndexHtml);
        }
    } catch (error) {
        console.error(error);
    }
}

function getTranslation(lang) {
    if (!lang) {
        throw new Error('[getTranslation]: The argument lang must not be empty!');
    }

    try {
        const translations = fs.readFileSync(`i18n/${lang}.json`, 'utf8');
        return JSON.parse(translations);
    } catch (error) {
        throw new Error(error);
    }
}

function translate(html, translations) {
    if (!html) {
        throw new Error('[translate]: The argument html must not be empty!');
    }

    if (!translations) {
        throw new Error('[translate]: The argument translations must not be empty!');
    }

    if (typeof html !== 'string') {
        throw new Error('[translate]: The argument html must be a string!');
    }

    for (const translationKey in translations) {
        html = html.replace(new RegExp(`{{${translationKey}}}`), translations[translationKey]);
    }

    return html;
}
