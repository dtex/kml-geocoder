var geo = require("node-geocoder")
  , xml = require("libxmljs")
  , fs = require('fs')
;

var geocoder = require('node-geocoder').getGeocoder('google', 'http');
var file = fs.readFileSync(process.argv[2]);

var kmlString = file.toString()
  , kml = xml.parseXmlString(kmlString)
  , els = kml.find("*")
  , count = completed = 0;
;

var hasChild = function(elements, name) {
  var result = false;
  elements.forEach( function(el) {
    if (String(el.name()) == name) {
      result = true;
    }
  });
  return result;
}


els.forEach( function (el, i) {

  // Find all the Placemarks (note: I am doing it this way because
  // libxmljs' node.find() is not working for me)
  if (el.type() == "element" && el.name() == "Placemark") {

    var children = el.find("*");

    // Make sure this one is not already geocoded
    if (hasChild(children, "Point") === false) {

      children.forEach( function (ch, j) {

        // Find the address node (note: I am doing it this way because
        // libxmljs' node.find() is not working for me)
        if (String(ch.name()) == "address") {

          count++;

          // We use the timeout to make sure we don't exceed rate limiting at Google
          setTimeout(function() {

            geocoder.geocode(String(ch.text()), function(err, res) {
              completed++;

              if (err) {
                console.log(err);
              } else {
                var geodata = res;
                if (geodata.length > 1) {
                  // Todo: Add in prompt to choose correct lat/long
                  console.log("Multiple matches for " + ch.text() + ". Using first match. Please check.");
                }
                var lat = geodata[0].latitude;
                var long = geodata[0].longitude;
                var nPoint = el.node("Point");
                var nCoord = nPoint.node("coordinates", long + "," + lat);

                if (completed == count) {
                  fs.writeFile(process.argv[3], kml.toString());
                }
              }
            });
          }, count * 500);

      };
      });
    }
  }
});
