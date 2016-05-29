var stops = [];
$("document").ready(function() {
        // Initialize datepicker
        $(".hasDatepicker").datepicker("setDate", new Date());
        // Get stop data
        $.getJSON("https://transit.land//api/v1/stops?identifier_starts_with=gtfs://f-drt8-nps~boha~ferries", 
                function (data) {
                        console.log(data);
                        data.stops.forEach(function (e) {
                                stops.push({"name":e.name, "osid":e.onestop_id});      
                        });
                        // populate initial drop downs
                        var ulTemplateFront = "<li class='selection' role='presentation'><a role='menuitem' tabindex='-1' href='#'>____</a></li>"
                        stops.forEach(function (e) {
                                $(".From").append(ulTemplateFront.replace("____", e.name));
                                $(".To").append(ulTemplateFront.replace("____", e.name));
                        });
                        // add click trigger for dropdowns to populate main box when something has been selected
                        $(".selection").click(function() {
                                var replacementText = "____<span class='caret'></span>";
                                var ddown = $(this).parent().prev();
                                var splitText = this.innerText.split(" ");
                                var short_name = "";
                                for (var i = 0; i < splitText.length - 1; i++) {
                                        short_name += splitText[i] + " ";
                                        console.log(short_name);
                                }
                                ddown.html(replacementText.replace("____", short_name));
                                // test
                                $.getJSON("https://transit.land//api/v1/route_stop_patterns?stops_visited=s-drt2zr27cj-longwharfnorth,s-drt8b8kjsc-spectacleisland",
                                          function (data) {
                                                console.log(data);
                                          }
                                );
                        });
                }
        );
});