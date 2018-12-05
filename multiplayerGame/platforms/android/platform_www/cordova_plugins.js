cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
  {
    "id": "phonegap-plugin-barcodescanner.BarcodeScanner",
    "file": "plugins/phonegap-plugin-barcodescanner/www/barcodescanner.js",
    "pluginId": "phonegap-plugin-barcodescanner",
    "clobbers": [
      "cordova.plugins.barcodeScanner"
    ]
  },
  {
    "id": "nodejs-mobile-cordova.nodejs",
    "file": "plugins/nodejs-mobile-cordova/www/nodejs_apis.js",
    "pluginId": "nodejs-mobile-cordova",
    "clobbers": [
      "nodejs"
    ]
  },
  {
    "id": "nodejs-mobile-cordova.nodejs_events",
    "file": "plugins/nodejs-mobile-cordova/www/nodejs_events.js",
    "pluginId": "nodejs-mobile-cordova",
    "clobbers": [
      "nodejs_events"
    ]
  }
];
module.exports.metadata = 
// TOP OF METADATA
{
  "cordova-plugin-browsersync": "0.1.7",
  "cordova-plugin-whitelist": "1.3.3",
  "cordova-disable-http-cache": "1.0.0",
  "phonegap-plugin-barcodescanner": "8.0.1",
  "nodejs-mobile-cordova": "0.2.2"
};
// BOTTOM OF METADATA
});