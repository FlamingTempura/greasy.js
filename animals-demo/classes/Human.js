greasy.define(
    "Human",
    {
        // Get the Hat component ready before proceeding
        require: ["Hat"],

        // Extend on the component Mammal
        extend: "Mammal"
    },
    function (imports) {
        "use strict";

        var $ = imports.$,
            greasy = imports.greasy;

        return {
            name: undefined,
            job: undefined,
            hat: undefined,
            
            initialize: function (name, job, hatColour) {
                this.name = name;
                this.job = job;
                this.hat = greasy.create("Hat", hatColour);
            },

            sayHello: function () {
                return "Hello! My name is " + this.name + 
                    " and I am the " + this.job + ".";
            },

            aboutHat: function () {
                return "I am wearing a hat. " + this.hat.describe();
            },
        };
    }
);