window.animalLibrary.greasy.defineComponent(
    "Human",
    {
        require: ["Thumb"],
        extend: "Mammal"
    },
    function (imports) {
        "use strict";
        var $ = imports.$,
            greasy = imports.greasy,
            Thumb = greasy.get("Thumb"),
            thumb1 = Thumb.create({ name: "Thumb 1" }),
            thumb2 = Thumb.create({ name: "Thumb 2" });

        return {
            greeting: function () {
                return "Hello World!<br />" + thumb1.greeting() +
                    "<br />" + thumb2.greeting();
            },
            draw: function () {
                $(".animal").html(this.greeting());
            }
        };
    }
);