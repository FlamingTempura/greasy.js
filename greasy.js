// Greasy.js Version 0.2
// (c) 2011 Peter West
// Greasy.js is freely distributable under the MIT license.
// Documentation may be found at http://flamingtempura.github.com/greasy.js/

/*jslint nomen: true*/
(function ($, _) {
    "use strict";

    var VERSION = "0.2",

        // Time before a request is deemed failed, in milliseconds
        timeout = 2000,

        // Output debug information to console
        logging = false,

        // In browser, global object will be window
        root = this,

        // Keep greasy to old greasy is there is one
        previousGreasy = root.greasy,

        // Make the greasy object.
        greasy = root.greasy = {},

        defaultImports = {
            greasy: greasy,
            $: $,
            _: _
        },

        createObjFromConstructor = function (Constructor, args) {
            var F = function () {}, // Dummy function
                o;
            F.prototype = Constructor.prototype;
            o = new F();
            Constructor.apply(o, args);
            o.constructor = Constructor;
            return o;
        },

        prefixUrl = function (url, rootUrl) {
            if (rootUrl && url.indexOf("http://") !== 0 && url.slice(0, 1) !== "/") {
                return rootUrl + url;
            } else {
                return url;
            }
        },

        log = function () {
            if (logging && console) {
                console.log.apply(console, arguments);
            }
        };

    _(greasy).extend({
        VERSION: VERSION,

        // Returns reference to greasy object
        noConflict: function () {
            root.greasy = previousGreasy;
            return this;
        },

        // Mapping of component names to the urls they are defined in
        componentURLs: {},

        // Mapping of js files that we have already requested to their
        // jQuery Deferred objects
        requestedFiles: {},

        // Successfully loaded component constructors
        components: {},

        // Object that will be provided to components
        imports: { greasy: greasy },

        // URL to suffex to relative URLs
        componentRootURL: undefined,

        // Set the root url that will be prepended to relative urls when fetching components
        setRoot: function (componentRootURL) {
            log("Set root URL: " + componentRootURL, this);
            if (componentRootURL.slice(-1) !== "/") {
                componentRootURL = "/" + componentRootURL;
            }
            greasy.componentRootURL = componentRootURL;
        },

        // Object given to components. Can be used to defined jQuery, for example.
        setImports: function (imports) {
            log("Set imports: ", imports, this);
            greasy.imports = _(imports).chain()
                .clone()
                .extend(defaultImports).value();
        },

        // Register mappings of component-names to urls they are defined at
        register: function (componentURLs) {
            log("Register component names->urls: ", componentURLs, this);
            _(greasy.componentURLs).extend(componentURLs);
        },

        get: function (componentName) {
            log("Getting component: ", componentName, this);
            if (!greasy.components.hasOwnProperty(componentName)) {
                throw new Error("The component " + componentName + " does not exist");
            }
            return greasy.components[componentName];
        },

        create: function (componentName) {
            log("Creating component: ", componentName, this);
            var args = Array.prototype.slice.call(arguments, 1),
                component = greasy.get(componentName);

            return component.create.apply(component, args);
        },

        createMany: function (componentName, arg1) {
            log("Creating many components: ", componentName, this);

            var count,
                args,
                argsArray = [];

            if (_(arg1).isArray()) {
                argsArray = arg1;

            } else {
                count = arg1;
                args = Array.prototype.slice.call(arguments, 2);

                _.times(count, function () { argsArray.push(args); });
            }

            return _(argsArray).map(function (args) {
                return greasy.create(componentName, args);
            });

        },

        require: function (componentNames, callback) {
            log("Require components: ", componentNames, this);
            if (!_(componentNames).isArray()) {
                throw new Error("componentNames must be an array");
            }

            var deferredUntilReady = new $.Deferred(),

                deferredUntilAllRequiredComponentsDefined =  _(componentNames).map(function (componentName) {

                    if (!greasy.componentURLs.hasOwnProperty(componentName)) {
                        throw new Error(componentName +
                            " is not a valid component or has not been registered with greasy");
                    }

                    var url = greasy.componentURLs[componentName];

                    // Has component already been requested?
                    if (greasy.requestedFiles.hasOwnProperty(url)) {
                        return greasy.requestedFiles[url];
                    }

                    var requestURL = prefixUrl(url, greasy.componentRootURL),

                        deferredUntilComponentDefined = new $.Deferred(),

                        failureTimeout = setTimeout(function () {
                            throw new Error(componentName +
                                " has timed out loading. Perhaps it has not been defined?");
                        }, timeout);

                    // Loaded - cancel failure timeout
                    deferredUntilComponentDefined.then(function () {
                        clearTimeout(failureTimeout);
                    });

                    // Must use crossDomain (uses <script> tags) for console (Firebug, chrome etc)
                    // to work
                    $.ajax({
                        crossDomain: true,
                        dataType: "script",
                        url: requestURL
                    });

                    greasy.requestedFiles[url] = deferredUntilComponentDefined;
                    return deferredUntilComponentDefined;
                });

            // Once all components have been loaded, execute the callback
            $.when.apply(undefined, deferredUntilAllRequiredComponentsDefined).then(function () {
                var result;
                if (callback) {
                    result = callback.call(undefined, greasy.imports);
                }
                deferredUntilReady.resolve(result);
            });

            return deferredUntilReady;
        },

        define: function (componentName, options, callback) {
            log("Defining componentName: ", componentName, " with options: ", options, this);
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
            dfd = greasy.require(requiredComponents, callback);

            $.when(dfd).then(function (prototypeObject) {
                var ConstructorToExtend,
                    NewConstructor = function () {
                        if (prototypeObject.initialize) {
                            prototypeObject.initialize.apply(this, arguments);
                        }
                    },
                    url = greasy.componentURLs[componentName];

                if (extendType === "function") {
                    ConstructorToExtend = options.extend;
                } else if (extendType === "componentName") {
                    ConstructorToExtend = greasy.get(options.extend);
                }

                // Does the constructor already have an extend method?
                if (ConstructorToExtend && ConstructorToExtend.hasOwnProperty("extend")) {
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
                    return createObjFromConstructor(NewConstructor, arguments);
                };

                greasy.components[componentName] = NewConstructor;
                greasy.requestedFiles[url].resolve(); // It's loaded successfully
            });
        }
    });

    // Aliases
    greasy.registerComponents = greasy.register;
    greasy.requireComponents = greasy.require;
    greasy.defineComponent = greasy.define;

}.call(this, jQuery, _));