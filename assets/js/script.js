// Hiding API keys
const weatherApiKey = config.wApiKey;
const geocodeApiKey = config.gApiKey;
const momentFormat = "M/D/YYYY"
var todayDate = moment().format(momentFormat);
var buttonList = {};
var weatherObj = {};

async function getCityData(city, apiKey=geocodeApiKey){
    let apiUrl = `https://www.mapquestapi.com/geocoding/v1/address?location=${city}&key=${apiKey}`;
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
    let apiURL = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&appid=${apiKey}&units=metric`

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
            let cityStateName = cityData.adminArea5+cityData.adminArea3;
         
            if (!buttonList[cityStateName]){ // Check if the button is already created
                let cityButtonEl = $("<button>").addClass("btn btn-secondary btn-city w-100 my-1 ")
                    .text(`${cityData.adminArea5}, ${cityData.adminArea3}`)
                    .attr('data-citystate', cityStateName);
                $(".search-wrapper").append(cityButtonEl);
                // Update array for tracking and local storage
                cityObj = {
                    cityName: cityData.adminArea5,
                    state: cityData.adminArea3,
                    latitude: cityData.latLng.lat,
                    longitude: cityData.latLng.lng,
                    cityState: cityStateName
                };
            buttonList[cityStateName] = cityObj;
            saveWeather();
            generateWeatherData(cityStateName);
            }else{
                $(".city-form").after( $("<span>").addClass("not-found text-danger").text("The city exists below!"));
            }
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

        // Save weather data into our own weather object for local storage
        weatherObj[cityState] = {
                date: todayDate,
                city: cityStateObj.cityName,
                state: cityStateObj.state,
                temp: weatherData.current.temp,
                wind: weatherData.current.wind_speed,
                humidity: weatherData.current.humidity,
                UV: weatherData.current.uvi,
                weather: weatherData.current.weather[0].main,
                weatherIconURL: `http://openweathermap.org/img/wn/${weatherData.current.weather[0].icon}.png`
            };
        
        weatherObj[cityState]["daily"] = [];
            let tempDate = moment(todayDate, momentFormat);
        for (var i=0; i < 5; i++){
            tempDate.add(1,'d');
            weatherObj[cityState]["daily"][i] = {
                date: tempDate.format(momentFormat),
                tempMax: weatherData.daily[i].temp.max,
                tempMin:weatherData.daily[i].temp.min,
                wind: weatherData.daily[i].wind_speed,
                humidity: weatherData.daily[i].humidity,
                UV: weatherData.daily[i].uvi,
                weather: weatherData.daily[i].weather[0].main,
                weatherIconURL:`http://openweathermap.org/img/wn/${weatherData.daily[i].weather[0].icon}.png`
            };
        };
        createWeatherElements(cityState)
        saveWeather();
    });
    // .catch(error => {
    //     error.message;
    // });
}

var createWeatherElements = function(cityStateName){

    // If the date saved is not the same as today recall api
    if (moment(weatherObj[cityStateName].date, momentFormat).isAfter(moment())){ 
        console.log("After");
    }

    // Update elements and icons for main
    $(".city-title").text(`${weatherObj[cityStateName].city}, ${weatherObj[cityStateName].state} (${weatherObj[cityStateName].date})`)
        .append($("<img>").attr('src',weatherObj[cityStateName].weatherIconURL).addClass('border weather-icon rounded'));
    $(".temp-info").text(`Temp: ${weatherObj[cityStateName].temp} °C`);
    $(".wind-info").text(`Wind: ${weatherObj[cityStateName].wind} m/s`);
    $(".humidity-info").text(`Humidity: ${weatherObj[cityStateName].humidity} %`);
    $(".uv-info-value").text(weatherObj[cityStateName].UV).addClass("rounded px-2 text-white").removeClass("bg-success bg-warning bg-danger");
    
    // Update UV color
    if(weatherObj[cityStateName].UV < 3){
        $(".uv-info-value").addClass("bg-success")
    }else if(weatherObj[cityStateName].UV > 3 && weatherObj[cityStateName].UV < 6){
        $(".uv-info-value").addClass("bg-warning")
    }else if(weatherObj[cityStateName].UV > 6){
        $(".uv-info-value").addClass("bg-danger")
    }

    // Update cards
    let i = 0;
    
    $(".weather-card").each( function(){
        
        $(this).children(".card-header").text(weatherObj[cityStateName]["daily"][i].date);
        $(this).children(".card-weather-icon").attr('src',weatherObj[cityStateName]["daily"][i].weatherIconURL);
        $(this).children(".temp-card-max").text(`Temp (High): ${weatherObj[cityStateName]["daily"][i].tempMax} °C`);
        $(this).children(".temp-card-min").text(`Temp (Low): ${weatherObj[cityStateName]["daily"][i].tempMin} °C`);

        $(this).children(".wind-card").text(`Wind: ${weatherObj[cityStateName]["daily"][i].wind} m/s`);
        $(this).children(".humidity-card").text(`Humidity: ${weatherObj[cityStateName]["daily"][i].humidity} %`);
  
        i++;
    })


}

var updateWeatherHandler = function(){
    let cityStateName = $(this).attr('data-citystate');
    console.log(cityStateName, weatherObj[cityStateName]);
    if(weatherObj[cityStateName]){ // If exists
        createWeatherElements(cityStateName);
    }
}

var saveWeather = function(){
    localStorage.setItem('weatherObj',JSON.stringify(weatherObj));
    localStorage.setItem('buttonList',JSON.stringify(buttonList));

}

var loadWeather = function(){
    weatherObj = JSON.parse(localStorage.getItem('weatherObj'));
    buttonList = JSON.parse(localStorage.getItem('buttonList'));


    if(!weatherObj){ // if it doenst exist 
        weatherObj = {};
    }
    if(!buttonList){
        buttonList = {};
    }

    for(city in buttonList){

        let cityButtonEl = $("<button>").addClass("btn btn-secondary btn-city w-100 my-1 ")
                    .text(`${buttonList[city].cityName}, ${buttonList[city].state}`)
                    .attr('data-citystate', buttonList[city].cityState);
                $(".search-wrapper").append(cityButtonEl);
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

loadWeather();
//createCityButton("toronto ON");
//createCityButton("Vancouver");