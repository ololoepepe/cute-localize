#!/usr/bin/env node

var ChildProcess = require("child_process");
var FS = require("fs");
var merge = require("merge");
var mkpath = require("mkpath");
var program = require("commander");

var list = function(val) {
    return val.split(",");
};

var parseString = function(val) {
    return val;
};

program
    .version("0.1.0")
    .option("-a, --aliases <list>", "A list of 'translate' function aliases", list)
    .option("-e, --extensions <list>", "A list of file extensions to parse", list)
    .option("-l, --locales <list>", "A list of locales to generate translations for", list)
    .option("-d, --default-string <value>", "Dummy value for translations. Defaults to translation itself", parseString)
    .option("-T, --no-parse-translate", "Do not parse default 'translate' function")
    .option("-N, --no-parse-noop", "Do not parse default 'translate.noop' function")
    .option("-G, --no-use-gitignore", "Do not use 'git check-ignore' to exclude files/directories")
    .option("-X, --excluded-patterns <list>", "Exclude files/directories whose paths contain the patterns specified", list)
    .option("-v, --verbose", "Print error messages")
    .parse(process.argv);

var aliases = program.aliases || [];
if (!program.noParseTranslate)
    aliases.push("translate");
if (!program.noParseNoop)
    aliases.push("translate.noop");

var locales = program.locales || [];

var extensions = program.extensions || [];
if (extensions.length < 1) {
    extensions.push("js");
    extensions.push("html");
}

var excludedPatterns = program.excludedPatterns || [];

var defaultString = program.defaultString || {}; //NODE: To use with 'typeof defaultString == "object"'

var gitignore = !program.noUseGitignore;

var verbose = program.verbose;

var translations = {};
locales.forEach(function(locale) {
    try {
        translations[locale] = require(process.cwd() + "/translations/" + locale + ".json");
    } catch (err) {
        if (verbose)
            console.log(err);
    }
});

var escapeRegExp = function(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

var PatternStart = "(?:^|[^a-zA-Z0-9_$]+)(?:" + aliases.map(escapeRegExp).join("|") + ")\\s*\\(\\s*([\"'])";

var toTranslate = {};

var addNewTranslation = function(sourceText, disambiguation) {
    if (!sourceText)
        return;
    if (!disambiguation)
        disambiguation = "_default";
    sourceText = sourceText.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, "\"").replace(/\\'/g, "\'");
    sourceText = sourceText.replace(/\\`/g, "\`");
    locales.forEach(function(locale) {
        if (!toTranslate.hasOwnProperty(locale))
            toTranslate[locale] = {};
        var o = toTranslate[locale];
        if (!o.hasOwnProperty(sourceText))
            o[sourceText] = {};
        var translation = o[sourceText];
        translation[disambiguation] = (typeof defaultString == "object") ? sourceText : defaultString;
    });
};

var matchString = function(text, start, quotationMark) {
    var isEscaped = function(ind) {
        var count = 0;
        while (ind > 0 && text[ind - 1] == "\\") {
            ++count;
            --ind;
        }
        return count % 2;
    };
    var i = start;
    var str = "";
    while (i < text.length && (text[i] != quotationMark || isEscaped(i)))
        ++i;
    str = text.substring(start, i);
    ++i;
    while (i < text.length && /\s/.test(text[i]))
        ++i;
    if (i == text.length)
        throw "Invalid syntax";
    var end = (i - 1);
    if (text[i] != "+") {
        return {
            str: str,
            end: end
        };
    }
    while (i < text.length && !/["']/.test(text[i]))
        ++i;
    if (i == text.length)
        return null;
    var match = matchString(text, i + 1, text[i]);
    if (!match)
        return null;
    return {
        str: str + match.str,
        end: match.end
    };
};

var matchTranslation = function(text, from) {
    var rx = new RegExp(PatternStart, "gi");
    rx.lastIndex = !isNaN(+from) ? +from : 0;
    var match = rx.exec(text);
    if (!match)
        return null;
    var quotationMark = match[1];
    var start = match.index + match[0].length;
    return matchString(text, start, quotationMark);
};

var processDir = function(dirName) {
    FS.readdirSync(dirName).forEach(function(fileName) {
        if (gitignore) {
            try {
                var out = ChildProcess.execSync(`git check-ignore ${fileName}`, {
                    cwd: dirName,
                    encoding: "utf8",
                    timeout: 1000,
                    stdio: [
                        0,
                        "pipe",
                        (verbose ? "pipe" : null)
                    ]
                });
                if (out)
                    return;
            } catch (err) {
                if (verbose)
                    console.log(err);
            }
        }
        var shouldExclude = excludedPatterns.some(function(ep) {
            return (dirName + "/" + fileName).indexOf(ep) >= 0;
        });
        if (shouldExclude) {
            return;
        }
        var stats = FS.statSync(dirName + "/" + fileName);
        if (stats.isDirectory())
            return processDir(dirName + "/" + fileName);
        if (!stats.isFile() || extensions.indexOf(fileName.split(".").pop()) < 0)
            return;
        var text = FS.readFileSync(dirName + "/" + fileName, "utf8");
        var match = matchTranslation(text);
        while (match) {
            var sourceText = match.str;
            switch (text[match.end + 1]) {
            case ")": {
                addNewTranslation(sourceText);
                break;
            }
            case ",": {
                var sourceText = match.str;
                var i = match.end + 2;
                while (i < text.length && /\s/.test(text[i]))
                    ++i;
                if (i == text.length)
                    throw "Invalid syntax";
                var rx = /["']/;
                if (!rx.test(text[i]))
                    return addNewTranslation(sourceText);
                match = matchString(text, i + 1, text[i]);
                if (!match)
                    throw "Invalid syntax";
                addNewTranslation(sourceText, match.str);
                break;
            }
            default: {
                console.log("Skipping: \"" + sourceText + "\"");
                break;
            }
            }
            match = matchTranslation(text, match.end + 2);
        }
    });
};

processDir(process.cwd());

locales.forEach(function(locale) {
    if (!translations.hasOwnProperty(locale))
        translations[locale] = {};
    if (!toTranslate.hasOwnProperty(locale))
        toTranslate[locale] = {};
    var o = translations[locale]; //NOTE: old
    var n = toTranslate[locale]; //NOTE: new
    for (var sourceText in o) {
        var tro = o[sourceText];
        if (!n.hasOwnProperty(sourceText)) {
            tro._obsolete = true;
        } else {
            if (tro.hasOwnProperty("_obsolete"))
                delete tro._obsolete;
            var trn = n[sourceText];
            for (var dis in tro) {
                var disambiguation = tro[dis];
                if (!trn.hasOwnProperty(dis))
                    disambiguation._obsolete = true;
                else if (disambiguation.hasOwnProperty("_obsolete"))
                    delete disambiguation._obsolete;
            }
        }
    }
    for (var sourceText in n) {
        var trn = n[sourceText];
        if (!o.hasOwnProperty(sourceText))
            o[sourceText] = {};
        var tro = o[sourceText];
        for (var dis in trn) {
            if (!tro.hasOwnProperty(dis))
                tro[dis] = { value: trn[dis] };
        }
    }
    var path = process.cwd() + "/translations";
    mkpath.sync(path);
    FS.writeFileSync(path + "/" + locale + ".json", JSON.stringify(translations[locale], null, 4));
});
