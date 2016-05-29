var mapOptions = {
        zoom: 12,
        center: {lat: 42.309, lng: -71.07},
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_CENTER
        },
        zoomControl: true,
        zoomControlOptions: {
                position: google.maps.ControlPosition.LEFT_CENTER
        },
        scaleControl: true,
        streetViewControl: true,
        streetViewControlOptions: {
                position: google.maps.ControlPosition.LEFT_TOP
        },
        fullscreenControl: true
};

$(document).ready(function() {
        gmap = new google.maps.Map(document.getElementById("map"), mapOptions);
});
        