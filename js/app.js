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

function placeMapMarkers(results, map, markers) {
  var venues = results.venues;
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  var newMarkers = [];
  for (i = 0; i < venues.length; i++) {
    newMarkers.push(new google.maps.Marker({
      position: {
        lat: venues[i].location.lat,
        lng: venues[i].location.lng
      },
      map: map,
      title: venues[i].name
    }));
  }
  return newMarkers;
}

function populateResultList(results) {
  var listContainer = $('#js-listings-container');
  listContainer.empty();

  var elem;
  var venue;
  for (var i = 0; i < results.venues.length; i++) {
    venue = results.venues[i];
    elem = '<div class="listing row">' +
            '<h3><a href="#" class="js-listing">' + venue.name + '</a></h3>' +
            '<h4>Address</h4>' +
            '<p class="listing-address">';
    for (var j = 0; j < venue.location.formattedAddress.length; j++) {
      elem += venue.location.formattedAddress[j] + '<br>';
    }
    elem += '</p>' +
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
    zoom: 15
  }));
}

function loadMap() {
  return mapLoadState.promise();
}

function createSearchConfig(cuisine) {
  return {
    client_id: '41QMSHIG4SMMYCJ4D4WTNAY1JQCE42R0THOR3ELWYFSXBK15',
    client_secret: 'CYSOZX0ZUTGST3NJTVNWY3W15UFWO4STUDZ0K30N3KZ2E0IO',
    intent: 'checkin',
    limit: 30,
    categoryId: cuisine,
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

function getVenues(location, cuisine) {
  var result = {};
  var cuisineFilter = CUISINE_FILTERS[cuisine];
  var config = createSearchConfig(cuisineFilter);
  config.near = location;

  return $.ajax({
    url: 'https://api.foursquare.com/v2/venues/search',
    jsonp: 'callback',
    data: config

  }).then(function fetchVenues(jqxhrData) {
    result.venues = jqxhrData.response.venues;
    var getHoursReqs = [];
    var hoursSearchConfig = createHoursSearchConfig();
    for (var i = 0; i < result.venues.length; i++) {
      getHoursReqs.push(
                $.ajax({
                  url: 'https://api.foursquare.com/v2/venues/' + result.venues[i].id + '/hours',
                  jsonp: 'callback',
                  data: hoursSearchConfig
                })
            );
    }
    return $.when.apply($, getHoursReqs);
  }).then(function fetchVenueHours() {
    result.hours = Array.prototype.slice.call(arguments).map(function mapHours(jqxhr) {
      return jqxhr[0].response.hours;
    });
    return result;
  });
}

function filterVenueByHours(venues, hours, filter) {
  // console.log(filter);
  if (filter === 'Any time') {
    return { venues: venues, hours: hours };
  }

  var results = {
    venues: [],
    hours: []
  };
    // debugger;
  for (var i = 0; i < venues.length; i++) {
    if (!hours[i].timeframes) continue;
    for (var j = 0; j < hours[i].timeframes.length; j++) {
      if (!hours[i].timeframes[j].includesToday) continue;
      for (var k = 0; k < hours[i].timeframes[j].open.length; k++) {
        var openTimeframe = hours[i].timeframes[j].open[k];
        var open = moment()
                    .hour(parseInt(openTimeframe.start.slice(0, 2), 10))
                    .minute(parseInt(openTimeframe.start.slice(2), 10));
        var close = moment()
                    .hour(parseInt(openTimeframe.end.slice(0, 2), 10))
                    .minute(parseInt(openTimeframe.end.slice(2), 10));

        if (moment().isBetween(open, close, null, '[]')) {
          results.venues.push(venues[i]);
          results.hours.push(hours[i]);
        }
      }
    }
  }
  return results;
}

$(function main() {
//   var state = {};
  var map;
  var mapMarkers = [];

  populateFilterSelect();
  $('#js-search-box').focus();

  $('#js-search-form').submit(function performSearch(event) {
    event.preventDefault();
    getVenues($('#js-search-box').val(), $('#js-filter').val())
            .done(function filterHours(result) {
              var filteredResults = filterVenueByHours(result.venues, result.hours, $('#js-open-now').val());
              populateResultList(filteredResults);
              mapMarkers = placeMapMarkers(filteredResults, map, mapMarkers);
            });
  });

  loadMap().done(function mapReady(m) {
    map = m;
  });
});


