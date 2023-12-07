/*
    Miniprojekt 3 (REST Countries) - FE23 Javascript 1
    Kristoffer Bengtsson
*/

// Informationsfält att visa om länder
const showFields = ["name", "population", "flags", "languages", "region", "subregion", "capital"];


// Hämta giltiga värden från API och bygg datalistor till inputfältet när sidan laddas
fetchJSON("https://restcountries.com/v3.1/all?fields=name,languages,capital", buildCountryLists, errorHandlerBuild);


/***************************************************************************************
 * EVENT HANDLERS
 ***************************************************************************************/


////////////////////////////////////////////////////////////////////////////////////////
// SUBMIT: Sökformuläret för länder
document.querySelector("#country-form").addEventListener("submit", (event) => {
    const filterType = document.querySelector("#country-search").value;
    const filterElem = document.querySelector("#country-filter");
    const filterInput = filterElem.value.trim();

    event.preventDefault();
    resetResultMessages();
    filterElem.select();

    if (filterInput.length > 0) {
        lockSearchForm(true);
        const requestURL = new URL(`https://restcountries.com/v3.1/${filterType}/${filterInput}`);
        requestURL.searchParams.append("fields", showFields.join(","));
        fetchJSON(requestURL, showCountries);
    }
    else {
        showUserError(`Please enter a ${getSearchType(filterType)} in the box above.`);
    }
});


////////////////////////////////////////////////////////////////////////////////////////
// CHANGE: Meny för ändring av söktyp, byter datalista på inmatningsfältet
document.querySelector("#country-search").addEventListener("change", (event) => {
    const filterInput = document.querySelector("#country-filter");
    filterInput.setAttribute("list", `country-${event.currentTarget.value}`);
    filterInput.value = "";
    filterInput.focus();
});


/***************************************************************************************
 * FUNKTIONER
 ***************************************************************************************/


////////////////////////////////////////////////////////////////////////////////////////
// Hämta data från URL och skicka som argument till angiven callback-funktion
async function fetchJSON(fetchURL, callbackFunc, errorFunc = errorHandler) {
    try {
        const response = await fetch(fetchURL);
        if (!response.ok)
            throw new ErrorWithCode(`Invalid response: ${response.statusText}`, response.status);

        const result = await response.json();
        callbackFunc(result);
        return result;
    }
    catch (err) {
        errorFunc(err);
    }
}


////////////////////////////////////////////////////////////////////////////////////////
// Bygg datalistor med förslag-värden för inmatningsfältet
function buildCountryLists(countries) {
    const countryData = document.querySelector("#country-name");
    const languageData = document.querySelector("#country-lang");
    const capitalData = document.querySelector("#country-capital");

    const languageList = [];
    const capitalList = [];

    // Sortera länderna efter kort namn i bokstavsordning
    countries.sort((a, b) =>  a.name.common.localeCompare(b.name.common));

    for (const country of countries) {
        // Bygg landsnamn-datalistan
        const countryOption = document.createElement("option");
        countryOption.value = country.name.common;
        countryOption.innerText = country.name.common;
        countryData.appendChild(countryOption);

        // Samla ihop alla språk (utan dubletter)
        if (country.languages !== undefined) {
            for (const lang in country.languages) {
                if (!languageList.includes(country.languages[lang]) && (country.languages[lang].length > 0)) {
                    languageList.push(country.languages[lang]);
                }
            }
        }

        // Samla ihop alla huvudstäder
        if (country.capital !== undefined) {
            if (!capitalList.includes(country.capital) && (country.capital.length > 0)) {
                capitalList.push(country.capital);
            }
        }
    }

    // Sortera datan i bokstavsordning innan HTML-datalistorna byggs
    languageList.sort();
    capitalList.sort();

    // Bygg språk-datalistan
    for (const language of languageList) {
        const langOption = document.createElement("option");
        langOption.value = language;
        langOption.innerText = language;
        languageData.appendChild(langOption);
    }

    // Bygg huvudstad-datalistan
    for (const capital of capitalList) {
        const capitalOption = document.createElement("option");
        capitalOption.value = capital;
        capitalOption.innerText = capital;
        capitalData.appendChild(capitalOption);
    }
}


////////////////////////////////////////////////////////////////////////////////////////
// Presentera länder på sidan
function showCountries(countries) {
    const resultCount = document.querySelector("#country-count");
    const outBox = document.querySelector("#country-output");
    
    outBox.innerHTML = "";
    resultCount.classList.add("show");
    resultCount.innerText = (countries.length > 0 ? countries.length : "No") + (countries.length == 1 ? " country found!" : " countries found!")

    // Sortera länderna efter folkmängd i fallande ordning.
    countries.sort( (a, b) => b.population - a.population );

    // Visa länderna
    for (const country of countries) {
        outBox.appendChild(getCountryElement(country));
    }

    lockSearchForm(false);
}


////////////////////////////////////////////////////////////////////////////////////////
// Returnera DOM-element för presentation av ett land
function getCountryElement(country) {
    const countryBox = document.createElement("div");
    countryBox.classList.add("countrybox");

    // Flaggan
    if (country.flags !== undefined) {
        const flagImg = document.createElement("img");
        flagImg.classList.add("flagbox");
        flagImg.src = country.flags.png;
        flagImg.alt = country.flags.alt;
        countryBox.appendChild(flagImg);
    }

    // Namn
    if (country.name !== undefined) {
        const nameField = document.createElement("h3");
        const nameNative = document.createElement("div");
        nameNative.classList.add("nativenames");
        nameField.innerText = country.name.common;

        // Officiella namn
        for (const inLanguage in country.name.nativeName) {
            const nameRow = document.createElement("div");
            nameRow.innerText = country.name.nativeName[inLanguage].official;
            nameNative.appendChild(nameRow);
        }
        countryBox.append(nameField, nameNative);
    }

    // Region
    if (country.subregion !== undefined) {
        const regionField = document.createElement("div");
        regionField.classList.add("subregion");
        regionField.innerHTML = `<strong>Region:</strong> ${country.subregion}`;
        countryBox.appendChild(regionField);
        if (country.region !== undefined) {
            regionField.innerHTML += ` (${country.region})`;
        }
    }

    // Huvudstad
    if (country.capital !== undefined) {
        const capitalField = document.createElement("div");
        capitalField.classList.add("capital");
        capitalField.innerHTML = `<strong>Capital:</strong> ${ country.capital.length > 0 ? country.capital : "None"}`;
        countryBox.appendChild(capitalField);
    }

    // Folkmängd
    if (country.population !== undefined) {
        const popField = document.createElement("div");
        popField.classList.add("population");

        // Visa folkmängd avrundat i miljoner istället om landet har över 1 miljon invånare
        const popRounded = (country.population >= 1000000) ? (country.population / 1000000).toFixed(1) + " million" : country.population;
        popField.innerHTML = `<strong>Population:</strong> ${popRounded}`;
        
        countryBox.appendChild(popField);
    }

    // Språk
    if (country.languages !== undefined) {
        const langBox = document.createElement("div");
        const langList = document.createElement("ul");
        const langsTitle = document.createElement("div");

        langsTitle.classList.add("subheading");
        langBox.classList.add("population");
        
        langsTitle.innerText = "Language(s):";

        for (const lang in country.languages) {
            const langItem = document.createElement("li");
            langItem.innerText = country.languages[lang];
            langList.appendChild(langItem);
        }

        langBox.append(langsTitle, langList);
        countryBox.appendChild(langBox);
    }

    return countryBox;
}


////////////////////////////////////////////////////////////////////////////////////////
// Återställ fält - rensa tidigare resultat och felmeddelanden
function resetResultMessages() {
    const errorBox = document.querySelector("#errormessage");
    const resultCount = document.querySelector("#country-count");
    
    document.querySelector("#country-output").innerHTML = "";
    resultCount.innerText = "";
    resultCount.classList.remove("show");
    errorBox.innerHTML = "";
    errorBox.classList.remove("show");
}


////////////////////////////////////////////////////////////////////////////////////////
// Lås sök-formuläret medan data laddas och visas
function lockSearchForm(isLocked) {
    document.querySelector("#country-submit").disabled = isLocked;
    document.querySelector("#country-search").disabled = isLocked;
    document.querySelector("#country-filter").disabled = isLocked;

    // Visa snurrande Laddar-indikator, om förfrågan skulle råka ta längre tid
    if (isLocked) {
        document.querySelector("#load-indicator").classList.add("show");
    }
    else {
        document.querySelector("#load-indicator").classList.remove("show");
        document.querySelector("#country-filter").focus();
    }
}


/***************************************************************************************
 * FELHANTERING
 ***************************************************************************************/


////////////////////////////////////////////////////////////////////////////////////////
// Allmän felhanterare för hämtning och behandling av data - visa och logga felmeddelande
function errorHandler(error) {
    if (error instanceof ErrorWithCode) {
        if (error.errorCode == 404) {
            showUserError("No countries were found matching your search!");
        }
        else if (error.errorCode == 429) {
            showUserError("Too many searches in a short time, wait a while and try again...");
        }
        else if ((error.errorCode >= 500) && (error.errorCode < 512)) {
            showUserError("There is a problem with the country database server at the moment. Try again later?");
        }
        else {
            showUserError(`An error occurred fetching data, please try again later. (${error.errorCode})`);
        }
        console.error("ERROR", error.errorCode, error.message);
    }
    else {
        showUserError(`An error occurred when loading data, please try again later.`);
        console.error("API error", error);
    }    
    // Lås upp formuläret igen om ett fel inträffade
    lockSearchForm(false);
}


////////////////////////////////////////////////////////////////////////////////////////
// Felhanterare för laddning av data för inmatningsfältets datalistor när sidan laddas
function errorHandlerBuild(error) {
    if (error instanceof ErrorWithCode) {
        if (error.errorCode == 404) {
            showUserError("Warning: Unable to load country data. Suggestions may be unavailable.");
        }
        console.error("Datalist Build", error.errorCode, error.message);
    }
    else {
        console.error("API error", error);
    }    
}


////////////////////////////////////////////////////////////////////////////////////////
// Visa felmeddelande för användaren i ruta under sökformuläret
function showUserError(message) {
    const errorBox = document.querySelector("#errormessage");
    if (message.length > 0) {   
        const errorMessage = document.createElement("div");
        errorMessage.innerText = message;
        errorBox.appendChild(errorMessage);
        errorBox.classList.add("show");
    }
}


////////////////////////////////////////////////////////////////////////////////////////
// Returnera en textetikett för en söktyp, att visa för användaren
function getSearchType(type) {
    switch (type) {
        case "name":    return "country name";
        case "lang":    return "language";
        case "capital": return "capital city";
        default:        return "search criteria";
    }
}


////////////////////////////////////////////////////////////////////////////////////////
// Subklass för att lägga till ny errorCode-property till Error,
// Används för att separera status-kod från felmeddelande i exception.
class ErrorWithCode extends Error {
    errorCode = 0;
    constructor(message, code) {
        super(message);
        this.errorCode = code;
    }
}