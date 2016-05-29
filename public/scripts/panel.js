var stops_arr = [];
var stops_dict = {};
var shortened_stops = {};
var cached_schedStopPairs = {};
var cached_routeInfo = {};
var replacementText = "____&nbsp;<span class='caret'></span>";


function getKeyForValue(dict, val) {
    for (key in dict) {
        if (dict[key] == val) {
            return key;
            break;                                            
        }
    }   
}

$("document").ready(function() {
        // Initialize datepicker
        $(".hasDatepicker").datepicker("setDate", new Date());
        // Get stop data
        $.getJSON("https://transit.land//api/v1/stops?identifier_starts_with=gtfs://f-drt8-nps~boha~ferries", 
                function (data) {
                    console.log(data.stops);
                        data.stops.forEach(function (e) {
                                stops_arr.push({"name":e.name, "osid":e.onestop_id});
                                stops_dict[e.name] = {"oid":e.onestop_id, "coordinates":{"lng":e.geometry.coordinates[0], "lat":e.geometry.coordinates[1]}};
                        });
                        // populate initial drop downs
                        var ulTemplateFront_stops = "<li class='selection startorstop' role='presentation'><a role='menuitem' tabindex='-1' href='#'>____</a></li>"
                        stops_arr.forEach(function (e) {
                                $(".From").append((ulTemplateFront_stops.replace("____", e.name)).replace("startorstop", "start"));
                                $(".To").append((ulTemplateFront_stops.replace("____", e.name)).replace("startorstop", "stop"));
                                var splitText = e.name.split(" ");
                                var short_name = "";
                                // trims the last word off the name
                                for (var i = 0; i < splitText.length - 1; i++) {
                                        short_name += splitText[i] + " ";
                                }
                                shortened_stops[e.name] = short_name.trim();
                        });
                        // add click trigger for dropdowns to populate main box when something has been selected
                        // also GETs and caches direct journey's from selected stop
                        $(".selection").click(function() {
                                var dropdown_text = $(this).parent().prev();
                                var short_name = shortened_stops[this.innerText.trim()];
                                dropdown_text.html(replacementText.replace("____", short_name));
                                if ($(this).hasClass("start")) {
                                    // caching direct schedule-stop pairs for origin
                                    var this_name = $(this).context.firstChild.innerText;
                                    var this_osid = stops_dict[this_name].oid;
                                    $.getJSON("https://transit.land//api/v1/schedule_stop_pairs?origin_onestop_id="+this_osid+"&date=2016-06-29",
                                          function (data) {
                                                cached_schedStopPairs[this_name] = data;
                                                // console.log(cached_schedStopPairs);
                                          }
                                    );
                                    // clears the 'To' and 'Times' dropdowns whenever a new 'From' is selected
                                    dropdown_text.parent().parent().next().children().children(".btn").html(replacementText.replace("____", "To"));
                                    empty_times($(this));
                                }
                                else if ($(this).hasClass("stop")){
                                    var from_shortName = dropdown_text.parent().parent().prev().children().children(".btn").text().trim();
                                    var from_fullName = getKeyForValue(shortened_stops, from_shortName);
                                    var to_fullName = getKeyForValue(shortened_stops, short_name);
                                    var available_trips = cached_schedStopPairs[from_fullName].schedule_stop_pairs.filter(function (e) {
                                        if (e.trip_headsign == to_fullName) return true;
                                    });
                                    if(available_trips) {
                                        populate_times(available_trips, $(this));                                        
                                    }
                                    else {
                                        alert("No trips available");
                                    }
                                }
                        });
                }
        );
        $.getJSON("https://transit.land//api/v1/routes?operated_by=o-drt8-bostonharborislandsnationalandstatepark",
                function (data) {
                    data.routes.forEach(function (e) {
                        cached_routeInfo[e.onestop_id] = {
                            "name": e.name,
                            "shape": create_polyline(e.geometry.coordinates)
                        }
                    });
                    // console.log(cached_routeInfo);
                }
        );
});

function populate_times(available_trips, point) {
    empty_times(point);
    console.log(available_trips);
    var ulTemplateFront_times = "<li class='selection time' role='presentation' data-roid=****><a role='menuitem' tabindex='-1' href='#'>____</a></li>"
    var available_times = point.parent().parent().parent().parent().children(".times").children().children("ul");
    var prev_roid;
    var curr_roid;
    available_trips.forEach(function (e, index, arr) {
        if (index > 0 && arr[index].route_onestop_id != arr[index - 1].route_onestop_id) {
            available_times.append("<li role='separator' class='divider'></li>");
        }
        available_times.append((ulTemplateFront_times.replace("____", e.origin_departure_time)).replace("****", e.route_onestop_id));
    });
    $(".time").click(function () {
        var dropdown_text = $(this).parent().prev();
        var time = this.innerText;
        dropdown_text.html(replacementText.replace("____", time));
        clear_polylines();
        draw_polyline($(this));
    })
}

function empty_times(point) {
    var times = point.parent().parent().parent().parent().children(".times").children().children("ul");
    times.empty();
    times.parent().html("<button type='button' data-toggle='dropdown' class='btn btn-default dropdown-toggle'>Times&nbsp;<span class='caret'></span></button><ul role='menu' aria-labelledby='dropdownMenu1' class='dropdown-menu Times'></ul>");
    clear_polylines();
}

function create_polyline(coordinates) {
    var arr = [];
    coordinates.forEach(function (i) {
        i.forEach(function (j) {
            var obj = {"lng":j[0], "lat":j[1]};
             arr.push(obj);
        });
    });
    return new google.maps.Polyline({
        path: arr,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    })
}

function draw_polyline(time_li) {
    var roid = time_li.attr('data-roid');
    cached_routeInfo[roid].shape.setMap(gmap);
}

function clear_polylines() {
    for (key in cached_routeInfo) {
        cached_routeInfo[key].shape.setMap(null);
    }
}