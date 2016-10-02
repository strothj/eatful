"use strict";

var FS_CLIENT_ID = "41QMSHIG4SMMYCJ4D4WTNAY1JQCE42R0THOR3ELWYFSXBK15",
    FS_CLIENT_SECRET = "CYSOZX0ZUTGST3NJTVNWY3W15UFWO4STUDZ0K30N3KZ2E0IO",
    FS_ENDPOINT = "https://api.foursquare.com/v2/venues",
    FS_RESULT_LIMIT = 30,
    FS_CAT_ALL_RESTAURANT = "4bf58dd8d48988d1c4941735",
    FS_API_INTENT = "checkin",
    FS_API_VERSION = "20161001",
    FS_API_RESPONSE_TYPE = "foursquare",
    FS_JSONP_CALLBACK = "callback";
var CUISINE_FILTERS = {
    "Any cuisine": FS_CAT_ALL_RESTAURANT,
    "American": "4bf58dd8d48988d14e941735",
    "Barbecue": "4bf58dd8d48988d1df931735",
    "Chinese": "4bf58dd8d48988d145941735",
    "French": "4bf58dd8d48988d10c941735",
    "Hamburger": "4bf58dd8d48988d16c941735",
    "Indian": "4bf58dd8d48988d10f941735",
    "Italian": "4bf58dd8d48988d110941735",
    "Japanese": "4bf58dd8d48988d111941735",
    "Mexican": "4bf58dd8d48988d1c1941735",
    "Pizza": "4bf58dd8d48988d1ca941735",
    "Seafood": "4bf58dd8d48988d1ce941735",
    "Steak": "4bf58dd8d48988d1cc941735",
    "Sushi": "4bf58dd8d48988d1d2941735",
    "Thai": "4bf58dd8d48988d149941735"
};

$(function () {
    populateFilterSelect();

    var map;
    getCurrentLocation()
        .then(function (location) {
            console.log(location);
            //return performSearch(location);
            return validSearchResponse;
        })
        .then(function (results) {
            map = initMap({
                lat: results.response.geocode.feature.geometry.center.lat,
                lng: results.response.geocode.feature.geometry.center.lng
            });
        })
        .fail(function (e) {
            console.log(e);
        });
});

function populateFilterSelect() {
    var select = $("#js-filter");
    var filters = Object.keys(CUISINE_FILTERS);
    for (var i = 0; i < filters.length; i++) {
        select.append('<option value="' + filters[i] + '">' + filters[i] + '</option>');
    }
    select.find('option[value="' + filters[0] + '"]').prop("selected", true);
}

function getCurrentLocation() {
    var lookup = $.Deferred();
    var placeholder = { placeholder: "Washington, DC" };
    try {
        navigator.geolocation.getCurrentPosition(
            function (location) {
                lookup.resolve({ ll: "" + location.coords.latitude + ", " + location.coords.longitude });
            },
            function (e) { lookup.resolve(placeholder); }
        );
    }
    catch (e) {
        lookup.resolve(placeholder);
    }
    finally {
        return lookup.promise();
    }
}

function initMap(location) {
    return new google.maps.Map(document.getElementById('map'), {
        center: location,
        scrollwheel: true,
        zoom: 15
    });
}

function performSearch(location) {
    var config = createSearchConfig(location);
    if (location.placeholder) { config.near = location.placeholder; }
    if (location.ll) { config.ll = location.ll; }
    return $.ajax({
        url: FS_ENDPOINT + "/search",
        jsonp: FS_JSONP_CALLBACK,
        data: config
    });
}

function createSearchConfig(address) {
    return {
        client_id: FS_CLIENT_ID,
        client_secret: FS_CLIENT_SECRET,
        intent: FS_API_INTENT,
        limit: FS_RESULT_LIMIT,
        categoryId: FS_CAT_ALL_RESTAURANT,
        v: FS_API_VERSION,
        m: FS_API_RESPONSE_TYPE
    };
}