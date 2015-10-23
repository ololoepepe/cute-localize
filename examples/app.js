#!/usr/bin/env node

var translate = require("../index")({
    locale: "ru" //Or whatever locale you wish
});

console.log(translate("Hello, cute world!"));

console.log(translate("You rock!", "good"));
console.log(translate("You rock!", "bad"));

var translation = translate.noop("They are over $[1]!!!11", null, 9000);
console.log(translate(translation));

process.exit(0);
