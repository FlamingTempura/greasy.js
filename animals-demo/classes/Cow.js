greasy.define(
    "Cow",
    {
        // Extend on the component Mammal
        extend: "Mammal"
    },
    function (imports) {
        "use strict";

        var $ = imports.$,
            greasy = imports.greasy;

        return {
            name: undefined,
            
            initialize: function (name) {
                this.name = name;
            },

            sayHello: function () {
                return "Moooooo! My name is " + this.name + ".";
            }
        };
    }
);