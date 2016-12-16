'use strict';

const http = require("http");
const https = require("https");

let getJSON = function(options, callback)
{
    let proto = options.port == 443 ? https : http;
    let req = proto.request(options, function(res)
    {
        let output = '';
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            let obj = JSON.parse(output);
            return callback(res.statusCode, obj);
        });
    });

    req.on('error', function(err) {
        console.log('error: ' + err.message);
    });

    req.end();
};

module.exports = getJSON;
