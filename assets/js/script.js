const weatherApiKey = config.wApiKey;
const geocodeApiKey = config.gApiKey;

var buttonList = [];
var weatherObj = {};

async function getCityData(city, apiKey=geocodeApiKey){
    let apiUrl = `http://www.mapquestapi.com/geocoding/v1/address?location=${city}&key=${apiKey}`;
    // condensed wait of api fetch
    let response = await fetch(apiUrl);

    if (!response.ok) { // Catch errors
        let message = `Error with status: ${response.status}`;
        throw new Error(message);
    }
    let data = await response.json();
    // Return only the first result
    return data.results[0].locations[0];
}

async function getWeatherData(lat, long, apiKey=weatherApiKey){
    let apiURL = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&appid=${apiKey}`

    let response = await fetch(apiURL);
    if (!response.ok) { // Catch errors
        let message = `Error with status: ${response.status}`;
        throw new Error(message);
    }
    let data = await response.json();
    return data;

    // Return only the first result
}

// calling the api/manipulation
var createCityButton = function(city, gApiKey=geocodeApiKey){

    if(!city){ // If input empty
        $(".city-form").after($("<span>").addClass("no-input text-danger").text("Input should not be empty!").after(".city-form"));
        return;
    }
   
    getCityData(city, gApiKey).then(cityData => {

        if (!cityData.adminArea5 || !cityData.adminArea3 ){ // Make sure city and state can be displayed
           $(".city-form").after( $("<span>").addClass("not-found text-danger").text("City Not Found!"));
           return
        } else {
            let cityButtonEl = $("<button>").addClass("btn btn-secondary btn-city w-100 my-1 ").text(`${cityData.adminArea5}, ${cityData.adminArea3}`);
            $(".search-wrapper").append(cityButtonEl);
            // Update array for tracking
            cityObj = {
                "cityName": cityData.adminArea5,
                "state": cityData.adminArea3,
                "latitude": cityData.latLng.lat,
                "longitude": cityData.latLng.lng
            };
            let cityStateName = cityData.adminArea5+cityData.adminArea3;
            buttonList[cityStateName] = cityObj;
            generateWeatherData(cityStateName);
        }
    })
    // .catch(error => {
    //     error.message;
    // });    
}

var generateWeatherData = function(cityState, wApiKey=weatherApiKey){
    
    cityStateObj = buttonList[cityState];
    console.log(buttonList[cityState]);

    getWeatherData(cityStateObj.latitude, cityStateObj.longitude, wApiKey).then(weatherData => {
        console.log(weatherData);
        weatherObj[cityState] = {
                temp: weatherData.current.temp,
                wind: weatherData.current.wind_speed,
                humidity: weatherData.current.humidity,
                UV: weatherData.current.uvi,
                weather: weatherData.current.weather[0].main,
                weatherIconURL: `http://openweathermap.org/img/wn/${weatherData.current.weather[0].icon}.png`
            };
        
        weatherObj[cityState]["daily"] = [];

        for (var i=0; i < 5; i++){

            weatherObj[cityState]["daily"][i] = {
                tempMax: weatherData.daily[i].temp.max,
                tempMin:weatherData.daily[i].temp.min,
                wind: weatherData.daily[i].wind_speed,
                humidity: weatherData.daily[i].humidity,
                UV: weatherData.daily[i].uvi,
                weather: weatherData.daily[i].weather[0].main,
                weatherIcon:`http://openweathermap.org/img/wn/${weatherData.daily[i].weather[0].icon}.png`
            };
        };
        console.log(weatherObj);
        saveWeather();
    });
    // .catch(error => {
    //     error.message;
    // });
}

var createWeatherElements = function(){

}

var updateWeatherHandler = function(){

}

var saveWeather = function(){
    localStorage.setItem('weatherObj',JSON.stringify(weatherObj));
}

var loadWeather = function(){
    weatherObj = JSON.parse(localStorage.getItem('weatherObj'));

    if(!weatherObj){ // if it doenst exist 
        weatherObj = {};
    }

}

var searchButtonHandler = function(event){
    event.preventDefault();

    // Clear alerts
    $(".not-found").remove();
    $(".no-input").remove();

    let searchInput = $("#city-input").val().trim();
    createCityButton(searchInput);
    // Reset Search Area
    searchInput = $("#city-input").val("") ;
}

$(".city-form").on("submit", searchButtonHandler);
$(".search-wrapper").on("click", ".btn-city", updateWeatherHandler)


createCityButton("toronto ON");
//createCityButton("Vancouver");