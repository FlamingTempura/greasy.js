greasy.define(
    "Hat", // Component name
    function (imports) {
        "use strict";
        var $ = imports.$;

        // Return an object defining the component
        return {
            colour: undefined,

            initialize: function (colour) {
                this.colour = colour;
            },
            describe: function () {
                return "It is " + this.colour + ".";
            }
        };
    }
);