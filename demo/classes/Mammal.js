greasy.define(
    "Mammal", // Component name
    function (imports) {
        "use strict";
        var $ = imports.$;

        // Return an object defining the component
        return {
            hasSpine: function () {
                return true;
            }
        };
    }
);