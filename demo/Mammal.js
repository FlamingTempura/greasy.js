window.animalLibrary.greasy.defineComponent(
    "Mammal",
    function (imports) {
        "use strict";
        var $ = imports.$;

        return {
            hasSpine: function () {
                return true;
            },

            greeting: function () {
                return "Not sure...";
            },

            draw: function () {
                $(".animal").html("Mammal says " + this.greeting());
            }
        };
    }
);