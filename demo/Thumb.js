window.animalLibrary.greasy.defineComponent(
    "Thumb",
    function () {
        "use strict";

        return {
            name: undefined,

            initialize: function (options) {
                this.name = (options && options.name) || "Unnamed Thumb";
            },

            greeting: function () {
                return this.name + " says hello!";
            }
        };
    }
);