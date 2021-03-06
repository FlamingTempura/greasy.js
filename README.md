greasy.js - JavaScript dependency framework
===========================================

    http://flamingtempura.github.com/greasy.js/


greasy.js allows you to separate your JavaScript-heavy application into
components, which may be dependant on other components. This allows:

*   Mitigating the use of large multi-purpose JavaScript files - instead you
    can keep each part (component) of your application in separate files,

*   Reducing the need for HTML script tags - JavaScript components are
    loaded dynamically,

*   Facilitating lazy-loading - only load components if and when they are
    needed. Requires jQuery and underscore.js.

Hosted on GitHub - git://github.com/FlamingTempura/greasy.js

You can download this project in either zip or tar formats at:
    http://flamingtempura.github.com/greasy.js/

You can also clone the project with Git by running:

    $ git clone git://github.com/FlamingTempura/greasy.js


Usage
-----

Include greasy.js. greasy requires jQuery and underscore too.

    <script src="jquery.js"></script>
    <script src="underscore.js"></script>

    <script src="greasy.js"></script>


Create a greasy object:

    var greasy = new Greasy();
or
    var greasy = Greasy.create();


Register your components with greasy:

    greasy.registerComponents({
        "Mammal": "Mammel.js",
        "Human": "Human.js"
    });


Define a component:

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
                    $(".animal").html("Mammal says " +
                        this.greeting());
                }
            };
        }
    );


API
---

Greasy Constructor

    Greasy.create(arguments)
        creates a Greasy object. Same as calling new Greasy(arguments)

Greasy Object

    setImports(imports)
        imports
            object that is given to all callbacks in requireComponents and
            defineComponent.

        Callbacks on requireComponents and defineComponent are given imports
        as an argument. This allows those functions to access variables that
        would otherwise have to be global. imports.greasy is always available
        for access to the greasy object.

        Example:

        // Provide access to jQuery and underscore objects
        greasy.setImports({
            jQuery: jQuery,
            _, _
        });

    registerComponents(components)
        components
            object of component-names to the filenames that they are defined
            in.
        
        Register mappings of component-names to the filenames that they are
        defined in.

        Example:

        greasy.registerComponents({
            "Mammal": "Mammel.js",
            "Human": "Human.js"
        });

    get(componentName)
        Get the component constructor for the given component name.

        Example:

        var Human = greasy.get("Human"),
            mike = Human.create("Mike");

    requireComponents(components, callback)
        components
            array of componentNames of components that will be required within
            the callback
        callback
            function to be called once all components have loaded and executed
            
        Example:

        greasy.requireComponents(
            ["Mammal"],
            function (imports) {
                var greasy = imports.greasy,
                    Mammal = greasy.get("Mammal"),
                    mammal = Mammal.create();
            }
        );

    defineComponent(componentName, options, callback)
        componentName
            name of the component that is to be defined
        options
            object containing any of the following options:
        require
            array of other components that will be required
        extend
            a class that the class should extend on
        callback
            function to be called once requirements have been fulfilled. Must
            return an object to be used as the prototype for the components
            constructor.

        Example:

        greasy.defineComponent(
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
                        return "Hello World!<br />" +
                            thumb1.greeting() + "<br />" +
                            thumb2.greeting();
                    },
                    draw: function () {
                        $(".animal").html(this.greeting());
                    }
                };
            }
        );

Component

    create
        creates a Greasy object. Same as calling

        new Greasy(arguments)
        Example:

        var Human = greasy.get("Human"),
            mike = Human.create("Mike");


About
-----

greasy.js was developed by Peter West (FlamingTempura). It is released under
the MIT license.

Get the source code on GitHub : git://github.com/FlamingTempura/greasy.js
