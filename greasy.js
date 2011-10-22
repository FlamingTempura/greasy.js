// Greasy.js
// (c) 2011 Peter West
//  Greasy.js is freely distributable under the MIT license.

(function ($, _) {
    "use strict";

    // In browser, global object will be window
    var root = window,

        // Keep a reference to `this` of the greasy object
        greasyThis,

        // Mapping of component names to the files they are contained in
        registeredComponents = {},

        // Mapping of js files that we have already requested to their
        // deferred objects
        requestedFiles = {},

        // Successfully loaded component constructors
        components = {},

        // Variables that will be provided to components
        imports,

        // The constructor for Greasy. 
        Greasy = root.Greasy = function () {
            greasyThis = this;
            imports = { greasy: this };
        };

    // Alias for `new Greasy(arguments)`
    Greasy.create = function () {
        var F = function () {}, // Dummy function
            o;
        F.prototype = Greasy.prototype;
        o = new F();
        Greasy.apply(o, arguments);
        o.constructor = Greasy;
        return o;
    };

    _(Greasy.prototype).extend({
        setImports: function (newImports) {
            imports = _(newImports).clone();
            imports.greasy = greasyThis;
        },

        registerComponents: function (newComponents) {
            _(registeredComponents).extend(newComponents);
        },

        get: function (componentName) {
            if (!components.hasOwnProperty(componentName)) { throw new Error("The component " + componentName + " does not exist"); }
            return components[componentName];
        },

        requireComponents: function (components, callback) {
            if (!_(components).isArray()) { throw new Error("components must be an array"); }

            var dfd = new $.Deferred(),
                dfds = _(components).map(function (component) {

                    if (!registeredComponents.hasOwnProperty(component)) {
                        throw new Error(component + " is not a valid component or has not been registered with greasy");
                    }

                    var url = registeredComponents[component],
                        dfd,
                        dfdFail;

                    if (requestedFiles.hasOwnProperty(url)) { return requestedFiles[url]; } // Component has already been requested

                    dfd = new $.Deferred();
                    dfdFail = setTimeout(function () {
                        throw new Error(component + " has timed out loading. Perhaps it has not been defined?");
                    }, 2000);
                    dfd.then(function () { clearTimeout(dfdFail); });

                    jQuery.ajax({
                        crossDomain: true,
                        dataType: "script",
                        url: url
                    });

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

            var dfd,
                requiredComponents = [],
                extendType;

            if (options) {
                if (options.hasOwnProperty("extend")) {
                    if (_(options.extend).isString()) {
                        extendType = "componentName";
                    } else if (_(options.extend).isFunction()) {
                        extendType = "function";
                    } else {
                        throw new Error("Cannot extend on " + options.extend + ". It is not a component name or function.");
                    }
                }
                if (options.hasOwnProperty("require")) {
                    if (!_(options.require).isArray()) {
                        throw new Error("require option must be an array");
                    }
                    requiredComponents = requiredComponents.concat(options.require);
                }
                if (extendType === "componentName") {
                    requiredComponents.push(options.extend);
                }
            }
            dfd = greasyThis.requireComponents(requiredComponents, callback);

            $.when(dfd).then(function (prototypeObject) {
                var ConstructorToExtend,
                    NewConstructor = function () {},
                    url = registeredComponents[componentName];

                if (extendType === "function") {
                    ConstructorToExtend = options.extend;
                } else if (extendType === "componentName") {
                    ConstructorToExtend = greasyThis.get(options.extend);
                } else {
                    NewConstructor = function () {
                        if (prototypeObject.initialize) { prototypeObject.initialize.apply(this, arguments); }
                    };
                }

                // Does the constructor already have an extend method?
                if (ConstructorToExtend.hasOwnProperty("extend")) {
                    NewConstructor = ConstructorToExtend.extend(prototypeObject);
                } else {
                    // Get the prototype of the constructor we're extending
                    if (ConstructorToExtend) {
                        _(NewConstructor.prototype).extend(ConstructorToExtend.prototype);
                    }
                    
                    // Extend the prototype
                    _(NewConstructor.prototype).extend(prototypeObject);
                }

                NewConstructor.create = function () {
                    var F = function () {}, // Dummy function
                        o;
                    F.prototype = NewConstructor.prototype;
                    o = new F();
                    NewConstructor.apply(o, arguments);
                    o.constructor = NewConstructor;
                    return o;
                };

                components[componentName] = NewConstructor;
                requestedFiles[url].resolve(); // It's loaded successfully
            });
        }
    });

}(jQuery, _));