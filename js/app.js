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
      category: venue.categories[0].name,
      categoryIcon: venue.categories[0].icon.prefix + '64' + venue.categories[0].icon.suffix,
      lat: venue.location.lat,
      lng: venue.location.lng
    };
  });
  if (jsonResponse.response.geocode) {
    results.lat = jsonResponse.response.geocode.feature.geometry.center.lat;
    results.lng = jsonResponse.response.geocode.feature.geometry.center.lng;
  }
  return results;
}

function displayListingInfoWindow(state, marker, venue) {
  if (!state.infoWindow) {
    state.infoWindow = new google.maps.InfoWindow();
  }
  var contentString = '<article>' +
    '<h1>' + venue.name + '</h1>' +
    venue.addressHTML +
    '</article>' +
    '<a href="http://foursquare.com/venue/' + venue.id + '" target="_blank">Foursquare Page</a>';
  state.infoWindow.setContent(contentString);
  state.infoWindow.open(state.map, marker);
}

function placeMapMarkers(state) {
  var results = state.searchResults;
  var map = state.map;
  var markers = state.markers;
  var venues = state.searchResults.venues;
  if (state.markers) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
  }
  var newMarkers = [];
  for (i = 0; i < venues.length; i++) {
    var marker = new google.maps.Marker({
      position: {
        lat: venues[i].lat,
        lng: venues[i].lng
      },
      map: map,
      title: venues[i].name
    });
    newMarkers.push(marker);
    (function(_marker, n) { // eslint-disable-line no-loop-func
      marker.addListener('click', function() {
        displayListingInfoWindow(state, _marker, venues[n]);
      });
    })(marker, i);
  }
  if (results.lat && results.lng) {
    map.panTo({lat: results.lat, lng: results.lng });
  } else {
    map.panTo({lat: state.geo.lat, lng: state.geo.lng });
  }
  state.markers = newMarkers;
}

function populateResultList(searchResults) {
  var listContainer = $('#js-listings-container');
  listContainer.empty();

  var elem;
  var venue;
  for (var i = 0; i < searchResults.venues.length; i++) {
    venue = searchResults.venues[i];
    elem = '<article class="listing row">' +
            '<img src="' + venue.categoryIcon + '" alt="' + venue.category + '"> ' +
            '<h3>' +
            '<a href="#" class="js-listing" id="' + venue.id + '">' +
            venue.name + '</a></h3>' +
            venue.addressHTML +
            '<a href="http://foursquare.com/venue/' + venue.id + '" target="_blank">Foursquare Page</a>';
    '</article>';
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

function searchVenues(location, cuisine, geo) {
  var cuisineFilter = CUISINE_FILTERS[cuisine];
  var config = createSearchConfig(cuisineFilter);
  if (location === 'Current Location') {
    config.ll = geo.lat + ',' + geo.lng;
  } else {
    config.near = location;
  }

  return $.ajax({
    url: 'https://api.foursquare.com/v2/venues/search',
    jsonp: 'callback',
    data: config
  })
  .then(parseVenueSearchResponse);
}

function displayResults(state) {
  populateResultList(state.searchResults);
  placeMapMarkers(state);
  state.map.setZoom(13);
}

function handleSearch(state) {
  searchVenues($('#js-search-box').val(), $('#js-filter').val(), state.geo)
    .done(function(searchResults) {
      state.searchResults = searchResults;
      displayResults(state);
    });
}

function toggleMobileCollapsedView(map) {
  $('#js-sidebar').toggleClass('sidebar-collapsed');
  $('#js-listings-container').toggleClass('listings-container-collapsed');
  $('#js-show-listings-button').toggleClass('mobile-visible');
  $('#js-map-container').toggleClass('mobile-visible');
  google.maps.event.trigger(map, 'resize');
}

function handleListingClick(target, state) {
  var targetID = $(target).attr('id');
  var venue = state.searchResults.venues.find(function(elem) {
    return targetID === elem.id;
  });
  if (venue) {
    state.map.panTo({lat: venue.lat, lng: venue.lng});
    state.map.setZoom(14);
  }
  toggleMobileCollapsedView(state.map);
}

$(function main() {
  var state = {};

  populateFilterSelect();

  $('#js-search-form').submit(function(event) {
    event.preventDefault();
    handleSearch(state);
  });

  $('#js-search-box').click(function() {
    if ($(this).val() === 'Current Location') {
      $(this).val('');
    }
  });

  $('#js-search-box').blur(function() {
    if ($(this).val() === '' && state.geo) {
      $(this).val('Current Location');
    }
  });

  $('#js-filter').change(function() {
    handleSearch(state);
  });

  $('#js-listings-container').on('click', '.js-listing', function(event) {
    event.preventDefault();
    handleListingClick(this, state);
  });

  $('#js-show-listings-button').click(function() {
    toggleMobileCollapsedView();
  });

  $('#js-close-about').click(function() {
    $('#js-about').addClass('hidden');
  });

  loadMap().done(function mapReady(m) {
    state.map = m;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        state.geo = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        $('#js-search-box').val('Current Location');
        handleSearch(state);
      });
    }
  });
});


