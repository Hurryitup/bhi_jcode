var stops_arr = [];
var stops_dict_by_name = {};
var stops_dict_by_oid = {};
var shortened_stops = {};
var cached_schedStopPairs = {};
var cached_routeInfo = {};
var replacementText = "____&nbsp;<span class='caret'></span>";
var ulTemplateFront_stops = "<li class='selection startorstop' role='presentation' data-roid=&&&&><a role='menuitem' tabindex='-1' href='#'>____</a></li>"

// utility function
function getKeyForValue(dict, val) {
    for (key in dict) {
        if (dict[key] == val) {
            return key;
        }
    }   
}

function cache_stop_data(stops) {
    stops.forEach(function (e) {
        stops_arr.push({"name":e.name, "osid":e.onestop_id});
        var route_ids = [];
        // saves only the salient information about each route – the route_onestop_id
        e.routes_serving_stop.forEach(function (e) {route_ids.push(e.route_onestop_id);});
        stops_dict_by_name[e.name] = {"oid":e.onestop_id, "coordinates":{"lng":e.geometry.coordinates[0], "lat":e.geometry.coordinates[1]}, "routes":route_ids};
        stops_dict_by_oid[e.onestop_id] = {"name":e.name};
        var splitText = e.name.split(" ");
        var short_name = "";
        // trims the last word off the name
        for (var i = 0; i < splitText.length - 1; i++) {
                short_name += splitText[i] + " ";
        }
        shortened_stops[e.name] = short_name.trim();
    });
}

function populate_dropdown(dropdown, stops, startorstop) {
    stops.forEach(function (e) {
        dropdown.append(((ulTemplateFront_stops.replace("____", e.name)).replace("startorstop", startorstop)).replace("&&&&", e.osid));
    });
}

function replace_button_text(dropdown_text, short_name) {
    dropdown_text.html(replacementText.replace("____", short_name));
}

function cache_schedStopPairs(this_name) {
    var this_osid = stops_dict_by_name[this_name].oid;
    $.getJSON("https://transit.land//api/v1/schedule_stop_pairs?origin_onestop_id="+this_osid+"&date=2016-06-29",
          function (data) {
                cached_schedStopPairs[this_name] = data;
          }
    );
}

$("document").ready(function() {
    // Initialize datepicker
    $(".hasDatepicker").datepicker("setDate", new Date());

    // Plus button trigger
    $("#add_point").click(function() {
        var prev_point = $(this).prev();
        var from = ((prev_point.children(".island:nth-child(1)")))[0];
        var to = ((prev_point.children(".island:nth-child(2)")))[0];
        var new_point = prev_point.clone();
        console.log(to);
        // console.log((new_point.children(".island:nth-child(1)"))[0]);
        // (new_point.children(".island:nth-child(2)"))[0].innerText = to;
        prev_point.before(new_point);
        button_triggers();
    });

    // Get stop data
    $.getJSON("https://transit.land//api/v1/stops?identifier_starts_with=gtfs://f-drt8-nps~boha~ferries",
            function (data) {
                // caches stop data for easier/faster use
                cache_stop_data(data.stops);

                button_triggers();

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
            }
    );
});

function button_triggers() {
    // populate initial drop downs
    populate_dropdown($(".From"), stops_arr, "start");
    populate_dropdown($(".To"), stops_arr, "stop");

    // add click trigger for dropdowns to populate main box when something has been selected
    // also GETs and caches direct journey's from selected stop
    $(".selection").click(function() {
        var dropdown_dom_elem = $(this).parent().prev();
        var short_name = shortened_stops[dropdown_dom_elem.context.innerText.trim()];

        replace_button_text(dropdown_dom_elem, short_name);

        if ($(this).hasClass("start")) {
            // caching direct schedule-stop pairs for origin
            cache_schedStopPairs($(this).context.firstChild.innerText);

            // clears the 'To' and 'Times' dropdowns whenever a new 'From' is selected
            dropdown_dom_elem.parent().parent().next().children().children(".btn").html(replacementText.replace("____", "To"));
            empty_times($(this));
        }
        else if ($(this).hasClass("stop")){
            var from_shortName = dropdown_dom_elem.parent().parent().prev().children().children(".btn").text().trim();
            var from_fullName = getKeyForValue(shortened_stops, from_shortName);
            var to_fullName = getKeyForValue(shortened_stops, short_name);
            var to_avail_routes = stops_dict_by_name[to_fullName].routes;
            var available_trips = cached_schedStopPairs[from_fullName].schedule_stop_pairs.filter(function (e) {
                if (to_avail_routes.includes(e.route_onestop_id)) return true;
            });
            if(available_trips.length > 0) {
                populate_times(available_trips, $(this));
            }
            else {
                alert("Sorry, there are no direct trips from " + from_fullName + " to " + to_fullName);
                empty_times($(this));
            }
        }
    });
}

// unnecessary right now
function populate_to_dropdowns(stops_served) {
    console.log(stops_served);
    var stops = [];
    stops_served.schedule_stop_pairs.forEach(function (e) {
        curr_stop = stops_dict_by_oid[e.destination_onestop_id].name;
        if (stops.includes(curr_stop) == false) {
            stops.push(curr_stop);
        }
    });
    stops.sort();
    stops.forEach(function (e) {
        $(".To").append((ulTemplateFront_stops.replace("____", e)).replace("startorstop", "stop"));
    })
}

function populate_times(available_trips, point) {
    empty_times(point);
    var ulTemplateFront_times = "<li class='selection time' role='presentation' data-roid=****><a role='menuitem' tabindex='-1' href='#'>____</a></li>"
    var available_times = point.parent().parent().parent().parent().children(".times").children().children("ul");
    var time_accumulator = {};
    available_trips.forEach(function (e, index, arr) {
        if(time_accumulator[e.route_onestop_id]) {
            time_accumulator[e.route_onestop_id].push(e.origin_departure_time);
        }
        else {
            time_accumulator[e.route_onestop_id] = [];
            time_accumulator[e.route_onestop_id].push(e.origin_departure_time);
        }
    });
    for (key in time_accumulator) {
        time_accumulator[key].sort(compare_times);
        time_accumulator[key].forEach(function (e) {
            var this_time = sanitize_time(e);
            available_times.append((ulTemplateFront_times.replace("____", this_time)).replace("****", key));
        });
        available_times.append("<li role='separator' class='divider'></li>");
    }
    $(".time").click(function () {
        var dropdown_text = $(this).parent().prev();
        var time = this.innerText;
        dropdown_text.html(replacementText.replace("____", time));
        clear_polylines();
        draw_polyline($(this));
    })
}

function compare_times(a, b) {
    var atomized = a.split(":");
    var btomized = b.split(":");
    if (parseInt(atomized[0]) < parseInt(btomized[0])) return -1;
    else if (parseInt(atomized[0]) > parseInt(btomized[0])) return 1;
    return 0;
}

function sanitize_time(dirty_time) {
    var x = dirty_time.split(":");
    var clean_time = "";
    var hour = parseInt(x[0], 10);
    if (hour > 12) hour %= 12;
    clean_time += hour.toString() + ":" + x[1];
    if ((parseInt(x[0], 10) / 12) < 1) clean_time += " am";
    else clean_time += " pm";
    return clean_time;
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



// EDIC - Thompson stuff
/*
    var edic_thompson_roids = [stops_dict_by_name["EDIC Pier"].oid, stops_dict_by_name["Thompson Island"].oid];
    if(this_name != "EDIC Pier" && this_name != "Thompson Island") {
        edic_thompson_roids.forEach(function (e) {
            var to = dropdown_dom_elem.parent().parent().next().children().children("ul").children("[data-roid='"+e+"']");
            to.remove();
        })    
    }
    else {
        var delete_all_but = "[data-roid!='"+edic_thompson_roids[0]+"'][data-roid!='"+edic_thompson_roids[1]+"']";
        var to = dropdown_dom_elem.parent().parent().next().children().children("ul").children(delete_all_but);
        to.remove();
    }
*/