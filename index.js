var merge = require("merge");

var initialize = function(options) {
    var extraLocations = (options && options.extraLocations) ? options.extraLocations : null;
    if (typeof options.extraLocations != "string" && !(options.extraLocations instanceof Array))
        extraLocations = null;
    if (typeof options.extraLocations == "string")
        extraLocations = [extraLocations];
    var locations = extraLocations || [];
    if (!options || !options.noDefault)
        locations.push(process.cwd() + "/translations");
    var translate = function(sourceText, disambiguation) {
        if (sourceText && typeof sourceText == "object" && sourceText.hasOwnProperty("sourceText")
            && sourceText.hasOwnProperty("disambiguation") && sourceText.hasOwnProperty("args")) {
            disambiguation = sourceText.disambiguation;
            arguments = [sourceText.sourceText, disambiguation].concat(sourceText.args);
            sourceText = sourceText.sourceText;
        } else if (!sourceText || typeof sourceText != "string") {
            return null;
        }
        var args = [];
        if (arguments.length > 2) {
            if (arguments[2] instanceof Array)
                args = arguments[2];
            else
                args = Array.prototype.slice.call(arguments, 2);
        }
        var applyArgs = function(text) {
            args.forEach(function(arg, i) {
                text = text.split(`$[${i + 1}]`).join(arg);
            });
            return text;
        };
        var translation = translate.translations[sourceText];
        if (typeof translation != "object")
            return applyArgs(sourceText);
        if (disambiguation && typeof disambiguation == "string") {
            translation = translation[disambiguation];
            if (typeof translation == "object" && typeof translation.value == "string")
                return applyArgs(translation.value);
        }
        translation = translation._default;
        if (typeof translation == "object" && typeof translation.value == "string")
            return applyArgs(translation.value);
        return applyArgs(sourceText);
    };
    translate.noop = function(sourceText, disambiguation) {
        if (!sourceText || typeof sourceText != "string")
            return null;
        var args = [];
        if (arguments.length > 2) {
            if (arguments[2] instanceof Array)
                args = arguments[2];
            else
                args = Array.prototype.slice.call(arguments, 2);
        }
        return {
            sourceText: sourceText,
            disambiguation: disambiguation,
            args: args
        };
    };
    translate.setLocale = function(locale) {
        if (!locale || typeof locale != "string")
            return;
        translate.locale = locale;
        translate.translations = locations.reduce(function(acc, loc) {
            try {
                return merge.recursive(acc, require(loc + "/" + locale + ".json"));
            } catch (err) {
                console.log(err);
                return acc;
            }
        }, {});
    };
    translate.setLocale((options.locale && (typeof options.locale == "string")) ? options.locale : "en");
    return translate;
};

module.exports = initialize;
