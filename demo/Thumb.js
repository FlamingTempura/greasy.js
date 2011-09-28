window.animalLibrary.greasy.defineComponent(
    "Thumb",
    {
        extend: Backbone.View
    },
    function () {
        "use strict";

        return {
            name: undefined,

            initialize: function (options) {
                this.name = (options && options.name) || "Unnamed Thumb";
            },

            greeting: function () {
                console.log(this)
                return this.name + " says hello!";
            }
        };
    }
);