// Greasy.js
// (c) 2011 Peter West
//  Greasy.js is freely distributable under the MIT license.

(function ($, _) {
    "use strict";

    // A hack to allow debugging on scripts recieved using jQuery.getScript.
    // Replace the normal jQuery getScript function with one that supports
    // debugging and which references the script files as external resources
    // rather than inline.
    jQuery.extend({
        getScript: function (url, callback) {
            var head = document.getElementsByTagName("head")[0],
                script = document.createElement("script"),
                done = false;

            script.src = url;

            // Handle Script loading

            // Attach handlers for all browsers
            script.onload = script.onreadystatechange = function () {
                if (!done && (!this.readyState ||
                            this.readyState === "loaded" || this.readyState === "complete")) {
                    done = true;
                    if (callback) {
                        callback.call();
                    }

                    // Handle memory leak in IE
                    script.onload = script.onreadystatechange = null;
                }
            };

            head.appendChild(script);

            // We handle everything using the script element injection
            return undefined;
        }
    });

    var logging = false,

        // In browser, this will be window
        root = window,

        greasyThis,

        // Mapping of component names to the files they are contained in
        registeredComponents = {},

        // Mapping of js files that we have already requested to their deferred objects
        requestedFiles = {},

        // Successfully loaded component constructors
        components = {},

        // Variables that will be provided to components
        imports,


        Greasy = function () {
            greasyThis = this;
            imports = { greasy: this };
        };

    root.Greasy = Greasy;

    Greasy.create = function () {
        if (logging) { console.log("create", arguments); }
        return new Greasy(arguments);
    };

    _(Greasy.prototype).extend({
        setImports: function (newImports) {
            if (logging) { console.log("setImports", arguments); }
            imports = _(newImports).clone();
            imports.greasy = greasyThis;
        },

        registerComponents: function (newComponents) {
            if (logging) { console.log("registerComponents", arguments); }
            _(registeredComponents).extend(newComponents);
        },

        get: function (componentName) {
            if (logging) { console.log("get", arguments); }
            if (!components.hasOwnProperty(componentName)) { throw new Error("The component " + componentName + " does not exist"); }
            return components[componentName];
        },

        requireComponents: function (components, callback) {
            if (logging) { console.log("requireComponents", arguments); }

            if (!_(components).isArray()) { throw new Error("components must be an array"); }

            var dfd = new $.Deferred(),
                dfds = _(components).map(function (component) {

                    if (!registeredComponents.hasOwnProperty(component)) {
                        throw new Error(component + " is not a valid component or has not been registered with greasy");
                    }

                    var url = registeredComponents[component],
                        dfd;

                    if (requestedFiles.hasOwnProperty(url)) { return; } // Component has already been requested

                    dfd = new $.Deferred();

                    $.getScript(url);
                    requestedFiles[url] = dfd;
                    return dfd;
                });

            // Once all components have been loaded, execute the callback
            $.when.apply(undefined, dfds).then(function () {
                var result = callback.call(undefined, imports);
                dfd.resolve(result);
            });

            return dfd;
        },

        defineComponent: function (componentName, options, callback) {
            if (_(options).isFunction()) {
                callback = options;
                options = undefined;
            }

            if (logging) { console.log("defineComponent", arguments); }

            var dfd,
                requiredComponents = [];

            if (options) {
                if (options.hasOwnProperty("require")) {
                    if (!_(options.require).isArray()) {
                        throw new Error("require option must be an array");
                    }
                    requiredComponents = requiredComponents.concat(options.require);
                }
                if (options.hasOwnProperty("extend")) {
                    requiredComponents.push(options.extend);
                }
            }
            dfd = greasyThis.requireComponents(requiredComponents, callback);

            $.when(dfd).then(function (prototypeObject) {
                var Constructor,
                    url = registeredComponents[componentName];

                if (options && options.hasOwnProperty("extend")) {
                    Constructor = greasyThis.get(options.extend);
                } else {
                    Constructor = function (args) {
                        if (arguments.length !== 1 || !_(args).isArguments()) { // HACK
                            args = arguments;
                        }
                        if (prototypeObject.initialize) {
                            prototypeObject.initialize.apply(this, args);
                        }
                    };

                    Constructor.create = function () {
                        return new Constructor(arguments); // HACK - do something better like https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind#Supplemental
                    };
                }

                _(Constructor.prototype).extend(prototypeObject);

                components[componentName] = Constructor;
                requestedFiles[url].resolve(); // It's loaded successfully
            });
        }
    });

}(jQuery, _));