"use strict";

var FS_CLIENT_ID = "41QMSHIG4SMMYCJ4D4WTNAY1JQCE42R0THOR3ELWYFSXBK15",
    FS_CLIENT_SECRET = "CYSOZX0ZUTGST3NJTVNWY3W15UFWO4STUDZ0K30N3KZ2E0IO",
    FS_RESULT_LIMIT = 30,
    FS_CAT_ALL_RESTAURANT = "4bf58dd8d48988d1c4941735",
    FS_API_INTENT = "checkin",
    FS_API_VERSION = "20161001",
    FS_API_RESPONSE_TYPE = "foursquare";
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
    console.log(createSearchConfig());
});

function createSearchConfig(address) {
    return {
        client_id: FS_CLIENT_ID,
        client_secret: FS_CLIENT_SECRET,
        near: address,
        intent: FS_API_INTENT,
        limit: FS_RESULT_LIMIT,
        categoryId: FS_CAT_ALL_RESTAURANT,
        v: FS_API_VERSION,
        m: FS_API_RESPONSE_TYPE
    };
}