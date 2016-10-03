'use strict';

var CUISINE_FILTERS = {
  'Any cuisine': '4bf58dd8d48988d1c4941735',
  'American': '4bf58dd8d48988d14e941735',
  'Barbecue': '4bf58dd8d48988d1df931735',
  'Chinese': '4bf58dd8d48988d145941735',
  'French': '4bf58dd8d48988d10c941735',
  'Hamburger': '4bf58dd8d48988d16c941735',
  'Indian': '4bf58dd8d48988d10f941735',
  'Italian': '4bf58dd8d48988d110941735',
  'Japanese': '4bf58dd8d48988d111941735',
  'Mexican': '4bf58dd8d48988d1c1941735',
  'Pizza': '4bf58dd8d48988d1ca941735',
  'Seafood': '4bf58dd8d48988d1ce941735',
  'Steak': '4bf58dd8d48988d1cc941735',
  'Sushi': '4bf58dd8d48988d1d2941735',
  'Thai': '4bf58dd8d48988d149941735'
};

var mapLoadState = $.Deferred(); // eslint-disable-line new-cap

function createSearchConfig(cuisine) {
  return {
    client_id: '41QMSHIG4SMMYCJ4D4WTNAY1JQCE42R0THOR3ELWYFSXBK15',
    client_secret: 'CYSOZX0ZUTGST3NJTVNWY3W15UFWO4STUDZ0K30N3KZ2E0IO',
    intent: 'checkin',
    limit: 30,
    categoryId: cuisine,
    radius: 5000,
    v: '20161001', // API version
    m: 'foursquare'
  };
}

function createHoursSearchConfig() {
  return {
    client_id: '41QMSHIG4SMMYCJ4D4WTNAY1JQCE42R0THOR3ELWYFSXBK15',
    client_secret: 'CYSOZX0ZUTGST3NJTVNWY3W15UFWO4STUDZ0K30N3KZ2E0IO',
    v: '20161001',
    m: 'foursquare'
  };
}

function parseVenueSearchResponse(jsonResponse) {
  var results = {};
  results.venues = jsonResponse.response.venues.map(function arrangeVenueData(venue) {
    return {
      id: venue.id,
      name: venue.name,
      addressHTML: '<address class="listing-address">' +
        venue.location.formattedAddress.reduce(function lineSeperate(p, addressLine) {
          return p + addressLine + '<br>';
        }, '') + '</address>',
      lat: venue.location.lat,
      lng: venue.location.lng
    };
  });
  results.lat = jsonResponse.response.geocode.feature.geometry.center.lat;
  results.lng = jsonResponse.response.geocode.feature.geometry.center.lng;
  return results;
}

function fetchOperatingHours(venuesSearchResult) {
  var operatingHoursReqs = [];
  var hoursSearchConfig = createHoursSearchConfig();
  for (var i = 0; i < venuesSearchResult.venues.length; i++) {
    operatingHoursReqs.push(
      $.ajax({
        url: 'https://api.foursquare.com/v2/venues/' + venuesSearchResult.venues[i].id + '/hours',
        jsonp: 'callback',
        data: hoursSearchConfig
      })
    );
  }
  var combinedVenuesAndHours = $.Deferred(); // eslint-disable-line new-cap
  var allOperatingHours = $.when.apply($, operatingHoursReqs); // resolves when all operating hours have been returned

  allOperatingHours.done(function addVenueHours() {
    var operatingHours = Array.prototype.slice.call(arguments).map(function mapHours(ajaxResponse) {
      return ajaxResponse[0].response.hours.timeframes;
    });
    for (var j = 0; j < venuesSearchResult.venues.length; j++) {
      venuesSearchResult.venues[j].timeframes = operatingHours[j];
    }
    combinedVenuesAndHours.resolve(venuesSearchResult);
  });
  return combinedVenuesAndHours.promise();
}

function placeMapMarkers(results, map, markers) {
  var venues = results.venues;
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  var newMarkers = [];
  for (i = 0; i < venues.length; i++) {
    newMarkers.push(new google.maps.Marker({
      position: {
        lat: venues[i].lat,
        lng: venues[i].lng
      },
      map: map,
      title: venues[i].name
    }));
  }
  map.panTo({lat: results.lat, lng: results.lng });
  return newMarkers;
}

function populateResultList(searchResults) {
  var listContainer = $('#js-listings-container');
  listContainer.empty();

  var elem;
  var venue;
  for (var i = 0; i < searchResults.venues.length; i++) {
    venue = searchResults.venues[i];
    elem = '<div class="listing row">' +
            '<h3><a href="#" class="js-listing">' + venue.name + '</a></h3>' +
            '<h4>Address</h4>' +
            venue.addressHTML +
            '<a href="http://foursquare.com/venue/' + venue.id + '">Foursquare Page</a>';
    '</div>';
    listContainer.append(elem);
  }
}

function populateFilterSelect() {
  var select = $('#js-filter');
  var filters = Object.keys(CUISINE_FILTERS);
  for (var i = 0; i < filters.length; i++) {
    select.append('<option value="' + filters[i] + '">' + filters[i] + '</option>');
  }
  select.find('option[value="' + filters[0] + '"]').prop('selected', true);
}

// This function is called by the Google Maps API
function initMap() { // eslint-disable-line no-unused-vars
  mapLoadState.resolve(new google.maps.Map(document.getElementById('map'), {
    center: { lat: 38.8993278, lng: -77.0846061 },
    scrollwheel: true,
    zoom: 13
  }));
}

function loadMap() {
  return mapLoadState.promise();
}

function searchVenues(location, cuisine) {
  var cuisineFilter = CUISINE_FILTERS[cuisine];
  var config = createSearchConfig(cuisineFilter);
  config.near = location;

  return $.ajax({
    url: 'https://api.foursquare.com/v2/venues/search',
    jsonp: 'callback',
    data: config
  })
  .then(parseVenueSearchResponse)
  .then(fetchOperatingHours);
}

$(function main() {
  var map;
  var mapMarkers = [];

  var showResults = function(searchResults) { // eslint-disable-line func-names
    populateResultList(searchResults);
    mapMarkers = placeMapMarkers(searchResults, map, mapMarkers);
  };

  var performSearch = function() { // eslint-disable-line func-names
    searchVenues($('#js-search-box').val(), $('#js-filter').val())
      .done(function filterHours(searchResults) {
        showResults(searchResults);
      });
  };

  populateFilterSelect();

  $('#js-search-form').submit(function() { // eslint-disable-line func-names
    event.preventDefault();
    performSearch();
  });

  $('#js-filter').change(function() { // eslint-disable-line func-names
    performSearch();
  });

  $('#js-search-form').focus();
  loadMap().done(function mapReady(m) {
    map = m;
  });
});


