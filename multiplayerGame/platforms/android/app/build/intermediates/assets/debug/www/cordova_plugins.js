cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
  {
    "id": "phonegap-plugin-barcodescanner.BarcodeScanner",
    "file": "plugins/phonegap-plugin-barcodescanner/www/barcodescanner.js",
    "pluginId": "phonegap-plugin-barcodescanner",
    "clobbers": [
      "cordova.plugins.barcodeScanner"
    ]
  }
];
module.exports.metadata = 
// TOP OF METADATA
{
  "cordova-plugin-browsersync": "0.1.7",
  "cordova-plugin-whitelist": "1.3.3",
  "cordova-disable-http-cache": "1.0.0",
  "phonegap-plugin-barcodescanner": "8.0.1"
};
// BOTTOM OF METADATA
});