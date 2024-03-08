const fs = require('node:fs');
const availableLang = ['en', 'el'];
const defaultLang = 'en';

let translateToLang, translations, webData;

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
        webData = getWebData(translateToLang);
    }
    if (typeof translateToLang === 'object' && translateToLang instanceof Array) {
        translations = [];
        webData = [];

        for (const lang of translateToLang) {
            translations.push(getTranslation(lang));
            webData.push(getWebData(lang));
        }
    }
} catch (error) {
    console.error(error);
}

if (translations) {
    try {
        const indexHtml = fs.readFileSync('index.html', 'utf8');

        let indexHtmlWithWebData;

        if (webData instanceof Array) {
            indexHtmlWithWebData = [];

            for (const wd of webData) {
                let indexHtmlWithWebDataAdded = addRooms(indexHtml, wd['rooms']);
                indexHtmlWithWebDataAdded = addServicesAndFacilities(indexHtmlWithWebDataAdded, wd['rooms'], wd['facilities']);

                indexHtmlWithWebData.push(indexHtmlWithWebDataAdded);
            }
        } else {
            let indexHtmlWithWebDataAdded = addRooms(indexHtml, webData['rooms']);
            indexHtmlWithWebDataAdded = addServicesAndFacilities(indexHtmlWithWebDataAdded, webData['rooms'], webData['facilities']);

            indexHtmlWithWebData = indexHtmlWithWebDataAdded;
        }

        let translatedIndexHtml;

        if (translations instanceof Array) {
            translatedIndexHtml = [];

            for (let i = 0; i < translations.length; i++) {
                translatedIndexHtml.push(translate(indexHtmlWithWebData[i], translations[i]));
            }
        } else {
            translatedIndexHtml = translate(indexHtmlWithWebData, translations);
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

function getWebData(lang) {
    if (!lang) {
        throw new Error('[getWebData]: The argument lang must not be empty!');
    }

    try {
        const webData = fs.readFileSync(`web-data/web-data.${lang}.json`, 'utf8');
        return JSON.parse(webData);
    } catch (error) {
        throw new Error(error);
    }
}

function translate(indexHtml, translations) {
    if (!indexHtml) {
        throw new Error('[translate]: The argument indexHtml must not be empty!');
    }

    if (!translations) {
        throw new Error('[translate]: The argument translations must not be empty!');
    }

    for (const key in translations) {
        indexHtml = indexHtml.replaceAll(`{{${key}}}`, translations[key]);
    }

    return indexHtml;
}

function addRooms(indexHtml, rooms) {
    if (!indexHtml) {
        throw new Error('[addRooms]: The argument indexHtml must not be empty!');
    }

    if (!rooms) {
        throw new Error('[addRooms]: The argument rooms must not be empty!');
    }

    if (indexHtml.includes('{{WEB_DATA_ROOMS}}')) {
        let roomsHtml = '';

        for (const room of rooms) {
            let roomHtml = fs.readFileSync('room.html', 'utf8');

            if (
                room['roomSrc'].length &&
                roomHtml.includes('{{WEB_DATA_ROOMS.roomSrc}}')
            ) {
                let carouselItemsHtml = '';

                for (let i = 0; i < room['roomSrc'].length; i++) {
                    let carouselItemHtml = fs.readFileSync('carousel-item.html', 'utf8');

                    if (i === 0) {
                        carouselItemHtml = carouselItemHtml.replace(new RegExp('{{isActive}}'), 'active');
                    }

                    carouselItemHtml = carouselItemHtml.replace(new RegExp('{{roomSrc}}'), room['roomSrc'][i]);
                    carouselItemHtml = carouselItemHtml.replace(new RegExp('{{name}}'), room['name']);
                    carouselItemsHtml += carouselItemHtml;
                }

                roomHtml = roomHtml.replace(new RegExp('{{WEB_DATA_ROOMS.roomSrc}}'), carouselItemsHtml);
            }

            if (
                room['services'].length &&
                roomHtml.includes('{{WEB_DATA_ROOMS.services}}')
            ) {
                roomHtml = roomHtml.replace(new RegExp('{{WEB_DATA_ROOMS.services}}'), addItems(room['services']));
            }

            for (const key in room) {
                roomHtml = roomHtml.replaceAll(`{{${key}}}`, room[key]);
            }

            roomsHtml += roomHtml;
        }

        indexHtml = indexHtml.replace(new RegExp('{{WEB_DATA_ROOMS}}'), roomsHtml);
    }

    return indexHtml;
}

function addServicesAndFacilities(indexHtml, rooms, facilities) {
    if (!indexHtml) {
        throw new Error('[addRooms]: The argument indexHtml must not be empty!');
    }

    if (!rooms) {
        throw new Error('[addRooms]: The argument rooms must not be empty!');
    }

    if (!facilities) {
        throw new Error('[addRooms]: The argument facilities must not be empty!');
    }

    if (indexHtml.includes('{{WEB_DATA_SERVICES}}')) {
        let servicesHtml = '';

        for (const room of rooms) {
            let serviceHtml = fs.readFileSync('service.html', 'utf8');

            serviceHtml = serviceHtml.replace('{{id}}', room['id']);
            serviceHtml = serviceHtml.replace('{{name}}', room['name']);

            if (
                room['services'].length &&
                serviceHtml.includes('{{WEB_DATA_ROOMS.services}}')
            ) {
                serviceHtml = serviceHtml.replace('{{WEB_DATA_ROOMS.services}}', addItems(room['services']));
            }

            servicesHtml += serviceHtml;
        }

        indexHtml = indexHtml.replace('{{WEB_DATA_SERVICES}}', servicesHtml);
    }

    if (indexHtml.includes('{{WEB_DATA_FACILITIES}}')) {
        indexHtml = indexHtml.replace(`{{WEB_DATA_FACILITIES}}`, addItems(facilities));
    }

    return indexHtml;
}

function addItems(items) {
    let itemsHtml = '';

    for (const item of items) {
        let itemHtml = fs.readFileSync('item.html', 'utf8');

        itemHtml = itemHtml.replace(new RegExp('{{icon}}'), item['icon']);
        itemHtml = itemHtml.replace(new RegExp('{{label}}'), item['label']);
        itemsHtml += itemHtml;
    }

    return itemsHtml;
}
