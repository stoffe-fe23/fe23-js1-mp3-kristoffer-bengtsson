/*
    Miniprojekt 3 (REST Countries API) - FE23 Javascript 1
    Kristoffer Bengtsson
*/

// Hämta giltiga värden från API och bygg datalistor till inputfältet (förslag)
fetchJSON("https://restcountries.com/v3.1/all?fields=name,languages,capital", buildCountryLists, errorHandlerBuild);


/***************************************************************************************
 * EVENT HANDLERS
 ***************************************************************************************/


////////////////////////////////////////////////////////////////////////////////////////
// SUBMIT: Sökformuläret för länder
document.querySelector("#country-form").addEventListener("submit", (event) => {
    event.preventDefault();
    
    const filterElem = document.querySelector("#country-filter");
    const filterType = document.querySelector("#country-search").value;
    const filterInput = filterElem.value.trim();

    // Informationsfält att visa om länder
    const showFields = ["name", "population", "flags", "languages", "region", "subregion", "capital"];

    resetResultMessages();

    if (filterInput.length > 0) {
        // Lås sökformuläret och visa indikator medan behandling av sökning pågår
        lockSearchForm(true);

        const requestURL = new URL(`https://restcountries.com/v3.1/${filterType}/${filterInput}`);
        requestURL.searchParams.append("fields", showFields.join(","));
        fetchJSON(requestURL, showCountries);
    }
    else {
        const filterTypeSelected = document.querySelector("#country-search option:checked");
        showUserError(`Please enter a ${filterTypeSelected.innerText.toLowerCase()} in the search box above.`);
        filterElem.select();
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
            throw new ErrorWithCode(response.statusText, response.status);

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
    countries.sort((countryA, countryB) =>  countryA.name.common.localeCompare(countryB.name.common));

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

    // Sortera datan i bokstavsordning
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
// Presentera sökresultatet på sidan
function showCountries(countries) {
    const resultCount = document.querySelector("#country-count");
    const outBox = document.querySelector("#country-output");
    
    outBox.innerHTML = "";
    resultCount.classList.add("show");
    resultCount.innerText = (countries.length > 0 ? countries.length : "No") + (countries.length == 1 ? " country found!" : " countries found!")

    // Sortera länderna efter folkmängd i fallande ordning.
    countries.sort( (countryA, countryB) => countryB.population - countryA.population );

    // Visa länderna
    for (const country of countries) {
        outBox.appendChild(getCountryCard(country));
    }

    lockSearchForm(false);
}


////////////////////////////////////////////////////////////////////////////////////////
// Returnera ett kort med info om ett land
function getCountryCard(country) {
    const countryBox = document.createElement("div");
    countryBox.classList.add("countrybox");

    // Flaggan
    if (country.flags !== undefined) {
        const flagImg = document.createElement("img");
        flagImg.src = country.flags.png;
        flagImg.alt = country.flags.alt;
        countryBox.appendChild(flagImg);
    }

    // Namn
    if (country.name !== undefined) {
        const nameField = document.createElement("h3");
        const nameNative = document.createElement("ul");
        const displayedNames = [];
        nameField.innerText = country.name.common;
        for (const inLanguage in country.name.nativeName) {
            // Filtrera dubletter då vissa länder har exakt samma namn listat flera gånger (looking at you Zimbabwe...)
            if (!displayedNames.includes(country.name.nativeName[inLanguage].official)) {
                const nameRow = document.createElement("li");
                nameRow.innerText = country.name.nativeName[inLanguage].official;
                displayedNames.push(country.name.nativeName[inLanguage].official);
                nameNative.appendChild(nameRow);
            }
        }
        countryBox.append(nameField, nameNative);
    }

    // Region
    if (country.subregion !== undefined) {
        const regionField = document.createElement("div");
        regionField.innerHTML = `<strong>Region:</strong> ${country.subregion}`;
        countryBox.appendChild(regionField);
        if (country.region !== undefined) {
            regionField.innerHTML += ` (${country.region})`;
        }
    }

    // Huvudstad
    if (country.capital !== undefined) {
        const capitalField = document.createElement("div");
        capitalField.innerHTML = `<strong>Capital:</strong> ${ country.capital.length > 0 ? country.capital : "None"}`;
        countryBox.appendChild(capitalField);
    }

    // Folkmängd
    if (country.population !== undefined) {
        const popField = document.createElement("div");
        // Visa folkmängd avrundat i miljoner om landet har över 1 miljon invånare
        const popRounded = (country.population >= 1000000) ? (country.population / 1000000).toFixed(1) + " million" : country.population;
        popField.innerHTML = `<strong>Population:</strong> ${popRounded}`;
        countryBox.appendChild(popField);
    }

    // Språk
    if (country.languages !== undefined) {
        const langList = document.createElement("ul");
        const langsTitle = document.createElement("div");
        let langCount = 0;
        for (const lang in country.languages) {
            langCount++;
            const langItem = document.createElement("li");
            langItem.innerText = country.languages[lang];
            langList.appendChild(langItem);
        }
        langsTitle.classList.add("languages");        
        langsTitle.innerText = `Language${langCount == 1 ? "" : "s"}:`;
        countryBox.append(langsTitle, langList);
    }

    return countryBox;
}


////////////////////////////////////////////////////////////////////////////////////////
// Återställ fält - rensa ev. befintliga resultat och felmeddelanden
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
    const filterElem = document.querySelector("#country-filter");

    document.querySelector("#country-submit").disabled = isLocked;
    document.querySelector("#country-search").disabled = isLocked;
    filterElem.disabled = isLocked;

    // Visa snurrande Laddar-indikator (om förfrågan skulle råka ta lång tid)
    if (isLocked) {
        document.querySelector("#load-indicator").classList.add("show");
    }
    else {
        document.querySelector("#load-indicator").classList.remove("show");
        filterElem.focus();
        filterElem.select();
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
        else {
            showUserError(`An error occurred fetching data, please try again later. (${error.errorCode})`);
        }
        console.log("ERROR", error.errorCode, error.message);
    }
    else {
        showUserError(`An error occurred when loading country data, please try again later.`);
        console.error("API error", error);
    }    
    // Lås upp sökformuläret igen om ett fel inträffade
    lockSearchForm(false);
}


////////////////////////////////////////////////////////////////////////////////////////
// Felhanterare för laddning av data för inmatningsfältets datalistor (när sidan laddas)
function errorHandlerBuild(error) {
    if (error instanceof ErrorWithCode) {
        if (error.errorCode == 404) {
            showUserError("Warning: Unable to load country data. Suggestions may be unavailable.");
        }
        console.log("Datalist Build", error.errorCode, error.message);
    }
    else {
        console.error("API error", error);
    }    
}


////////////////////////////////////////////////////////////////////////////////////////
// Visa felmeddelande för användaren i ruta under sökformuläret
function showUserError(message) {
    if (message.length > 0) {   
        const errorBox = document.querySelector("#errormessage");
        const errorMessage = document.createElement("div");
        errorMessage.innerText = message;
        errorBox.appendChild(errorMessage);
        errorBox.classList.add("show");
    }
}


////////////////////////////////////////////////////////////////////////////////////////
// Subklass för att lägga till en extra errorCode-property till Error,
// Används för att separera status-kod från felmeddelande i egna exceptions.
class ErrorWithCode extends Error {
    errorCode = 0;
    constructor(message, code) {
        super(message);
        this.errorCode = code;
    }
}