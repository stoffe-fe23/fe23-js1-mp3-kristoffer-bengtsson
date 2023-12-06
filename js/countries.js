/*
    Miniprojekt 3 (REST Countries) - FE23 Javascript 1
    Kristoffer Bengtsson
*/

// Informationsfält att visa om länder
const showFields = ["name", "population", "flags", "languages", "region", "subregion", "capital"];


// Hämta giltiga värden från API och bygg datalistor till inputfältet med förslag till inmatning
fetchJSON("https://restcountries.com/v3.1/all?fields=cca2,name,languages,capital", buildCountryLists, errorHandlerBuild);


/***************************************************************************************
 * EVENT HANDLERS
 ***************************************************************************************/


////////////////////////////////////////////////////////////////////////////////////////
// SUBMIT: Formuläret för sökning av länder
document.querySelector("#country-form").addEventListener("submit", (event) => {
    event.preventDefault();
    
    resetSearchForm();

    const filterType = document.querySelector("#country-search").value;
    const filterElem = document.querySelector("#country-filter");
    const filterInput = filterElem.value;
    filterElem.select();

    if (filterInput.length > 0) {
        const requestURL = new URL(`https://restcountries.com/v3.1/${filterType}/${filterInput}`);
        requestURL.searchParams.append("fields", showFields.join(","));
        fetchJSON(requestURL, showCountries);
    }
    else {
        showUserError(`Please enter a ${getSearchType(filterType)} in the box above.`);
    }
});


////////////////////////////////////////////////////////////////////////////////////////
// CHANGE: Meny för ändring av söktyp, byter datalista och rensar inmatningsfältet
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
// Bygg datalistor med förslags-värden för inmatningsfältet
function buildCountryLists(countries) {
    const countryData = document.querySelector("#country-name");
    const languageData = document.querySelector("#country-lang");
    const capitalData = document.querySelector("#country-capital");

    const languageList = [];
    const capitalList = [];

    // Sortera länderna efter kort namn i bokstavsordning
    countries.sort((a, b) =>  a.name.common.localeCompare(b.name.common));

    for (const country of countries) {
        // Bygg landsnamn-listan
        const countryOption = document.createElement("option");
        countryOption.value = country.name.common;
        countryOption.innerText = country.name.common;
        countryData.appendChild(countryOption);

        // Samla ihop alla språk (utan dubletter) i separat lista
        if (country.languages !== undefined) {
            for (const lang in country.languages) {
                if (!languageList.includes(country.languages[lang]) && (country.languages[lang].length > 0)) {
                    languageList.push(country.languages[lang]);
                }
            }
        }

        // Samla ihop alla huvudstäder i separat lista
        if (country.capital !== undefined) {
            if (!capitalList.includes(country.capital) && (country.capital.length > 0)) {
                capitalList.push(country.capital);
            }
        }
    }

    // Sortera listorna i bokstavsordning innan HTML-datalistorna byggs
    languageList.sort();
    capitalList.sort();

    // Bygg språk-listan
    for (const language of languageList) {
        const langOption = document.createElement("option");
        langOption.value = language;
        langOption.innerText = language;
        languageData.appendChild(langOption);
    }

    // Bygg huvudstad-listan
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
    const outBox = document.querySelector("#country-output");
    outBox.innerHTML = "";

    setSearchResultCount(countries.length);

    // Sortera länderna efter folkmängd.
    countries.sort( (a, b) => b.population - a.population );

    // Visa länderna på sidan
    for (const country of countries) {
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
            let popRounded = parseInt(country.population);

            popField.classList.add("population");

            // Visa folkmängd avrundat i miljoner istället om landet har över 1 miljon invånare
            if (popRounded >= 1000000) {
                popRounded = (popRounded / 1000000).toFixed(1) + " million";
            }

            popField.innerHTML = `<strong>Population:</strong> ${popRounded}`;
            countryBox.appendChild(popField);
        }

        // Språk
        if (country.languages !== undefined) {
            const langBox = document.createElement("div");
            const langList = document.createElement("ul");
            const langsTitle = document.createElement("div");

            langsTitle.innerText = "Language(s):";
            langsTitle.classList.add("subheading");
            langBox.classList.add("population");

            for (const lang in country.languages) {
                const langItem = document.createElement("li");
                langItem.innerText = country.languages[lang];
                langList.appendChild(langItem);
            }

            langBox.append(langsTitle, langList);
            countryBox.appendChild(langBox);
        }

        outBox.appendChild(countryBox);
    }
}


////////////////////////////////////////////////////////////////////////////////////////
// Återställ sökformuläret - rensa tidigare resultat och felmeddelanden
function resetSearchForm() {
    const resultCount = document.querySelector("#country-count");

    clearUserError();
    document.querySelector("#country-output").innerHTML = "";
    resultCount.innerText = "";
    resultCount.classList.remove("show");
}


////////////////////////////////////////////////////////////////////////////////////////
// Visa för användaren hur många länder som hittades i en sökning
function setSearchResultCount(count) {
    const resultCount = document.querySelector("#country-count");
    resultCount.classList.add("show");
    resultCount.innerText = (count > 0 ? count : "No") + (count == 1 ? " country found!" : " countries found!")
}


////////////////////////////////////////////////////////////////////////////////////////
// Hämta och behandla data från API
async function fetchJSON(fetchURL, callbackFunc, errorFunc = errorHandler) {
    try {
        const response = await fetch(fetchURL);
        if (!response.ok)
            throw new ErrorWithCode(`Fetch: ${response.statusText}`, response.status);
        const result = await response.json();
        callbackFunc(result);
    }
    catch (err) {
        errorFunc(err);
    }
}


/***************************************************************************************
 * FELHANTERING
 ***************************************************************************************/


////////////////////////////////////////////////////////////////////////////////////////
// Allmän felhanterare för hämtning/behandling av data - visa och logga felmeddelande
function errorHandler(error) {
    if (error instanceof ErrorWithCode) {
        if (error.errorCode == 404) {
            showUserError("No countries were found matching your search!");
        }
        else {
            showUserError(`An error occurred: ${error.message} (${error.errorCode})`);
        }
        console.log("ERROR", error.errorCode, error.message);
    }
    else {
        showUserError("Error loading data: " + error);
        console.log("API error", error);
    }    
}


////////////////////////////////////////////////////////////////////////////////////////
// Felhanterare för laddning av data för inmatningsfältets datalistor
function errorHandlerBuild(error) {
    if (error instanceof ErrorWithCode) {
        if (error.errorCode == 404) {
            showUserError("Warning: Unable to load country data...");
        }
        console.log("Build error", error.errorCode, error.message);
    }
    else {
        console.log("API error", error);
    }    
}


////////////////////////////////////////////////////////////////////////////////////////
// Visa felmeddelande i ruta vid sökformuläret
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
// Dölj och rensa felmeddelande-rutan
function clearUserError() {
    const errorBox = document.querySelector("#errormessage");
    errorBox.innerHTML = "";
    errorBox.classList.remove("show");
}


////////////////////////////////////////////////////////////////////////////////////////
// Returnera en textetikett för angiven söktyp att visa för användaren
function getSearchType(type) {
    switch (type) {
        case "name":    return "country name";
        case "lang":    return "language";
        case "capital": return "capital city";
        default:        return "search criteria";
    }
}


////////////////////////////////////////////////////////////////////////////////////////
// Subklass för att lägga till ny errorCode-property till Error
class ErrorWithCode extends Error {
    errorCode = 0;
    constructor(message, code) {
        super(message);
        this.errorCode = code;
    }
}