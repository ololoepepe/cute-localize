Simple and powerful i18n module for Node.js


To make the story simple:
=========================

Type the following in your terminal:

```
mkdir test && cd test
npm install cute-localize -g
npm install cute-localize --save
touch app.js
chmod +x app.js
```

Then open *app.js* with your favorite editor and paste the following code:

```
#!/usr/bin/env node

var translate = require("cute-translate")({
    locale: "ru" //Or whatever locale you wish
});

console.log(translate("Hello, "
    + "cute world!"));

console.log(translate("You rock!", "good"));
console.log(translate("You rock!", "bad"));

var translation = translate.noop("They are over $[1]!!!11", null, 9000);
console.log(translate(translation));

process.exit(0);
```

Now, in terminal again:

```
clupdate -l ru
tree
```

You should see something like this (if you have the *tree* utility):

```
.
├── test.js
└── translations
    └── ru.json
```

Good! Now go edit *translations/ru.json* file:

```
{
    "Hello, cute world!": {
        "_default": {
            "value": "Hello, cute world!"
        }
    },
    "You rock!": {
        "good": {
            "value": "You rock!"
        },
        "bad": {
            "value": "You rock!"
        }
    },
    "They are over $[1]!!!11": {
        "_default": {
            "value": "They are over $[1]!!!11"
        }
    }
}
```

For example:

```
{
    "Hello, cute world!": {
        "_default": {
            "value": "Привет, милый мир!"
        }
    },
    "You rock!": {
        "good": {
            "value": "Ну ты жжешь!"
        },
        "bad": {
            "value": "Эй, ты, булыжник!"
        }
    },
    "They are over $[1]!!!11": {
        "_default": {
            "value": "Их более $[1]!!!11"
        }
    }
}
```

Sorry for Russian, I forgot French which I learned at school. :)

OK, now run:

```
./app.js
```

And you will see:
```
Привет, милый мир!
Ну ты жжешь!
Эй, ты, булыжник!
Их более 9000!!!11
```

That's the magic!

Complete API
============

```
var translate = require("cute-localize")({ //[optional] Configuration options
    extraLocations: ["location", ...], //[optional] List of additional locations to search translations in.
    //The default is "translations" relative to process.cwd().
    //Extra locations have higher priority than the default one.
    noDefault: true|false, //[optional] Exclude default location
    locale: "name" //[optional] Specify the locale. The default locale is "en"
});
```

```
var str = translate("sourceText", "disambiguation" /*[Optional]*/, [arg, ...] /*[Optional]*/);

//or

var str = translate("sourceText", "disambiguation" /*[Optional]*/, arg1, arg2, ...);

//or

var str = translate(translationObject); //See below
```

```
var obj = translate.noop("sourceText", "disambiguation" /*[Optional]*/, [arg, ...] /*[Optional]*/);

//or

var obj = translate.noop("sourceText", "disambiguation" /*[Optional]*/, arg1, arg2, ...);

//obj is a translation object. It may be passed to translate

/*
{
    sourceText: "sourceText".
    disambiguation: "disambiguation",
    args: [arg1, arg2, ...]
}
*/
```

clupdate tool options
=====================

```
-a, --aliases <list>            A list of 'translate' function aliases ('translate' and 'translate.noop' by default)
-e, --extensions <list>         A list of file extensions to parse ('js' by default)
-l, --locales <list>            A list of locales to generate translations for (must specify at least one)
-d, --default-string <value>    Dummy value for translations. Defaults to translation itself
-T, --no-parse-translate        Do not parse default 'translate' function
-N, --no-parse-noop             Do not parse default 'translate.noop' function
-G, --no-use-gitignore          Do not use 'git check-ignore' to exclude files/directories
-v, --verbose                   Print error messages
```

doT.js example
==============

```
var translate = require("cute-translate");
var dot = require("dot");
var template = dot.template(someTemplateData);
var model = {
    translate: translate
};
console.log(template(model));
```

In the template:

```
<title>{{ out += it.translate("That's cute!"); }}</title>
```
