$("document").ready(function() {
        $("#to").hover(
                function () {
                        $(this).text("+");
                }, 
                function() {
                        $(this).text("To");
                });
});