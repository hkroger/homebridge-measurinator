var request = require('request');
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerPlatform("homebridge-measurinator", "Measurinator", Measurinator);
  homebridge.registerAccessory("homebridge-measurinator", "MeasurinatorAccessory", MeasurinatorAccessory);
}

// Lingo is a bit wrong. Here quantity and unit are synonyms for unit (temperature, humidity, etc.)
function MeasurinatorAccessory(log, name, unit, id, measurementService) {
  this.log = log;
  this.name = name;
  this.uuid_base = id.toString();
  this.id = id.toString();
  this.log("name: %s, id: %s", this.name, this.id);
  this.measurementService = measurementService;
  this.unit = unit;
}

MeasurinatorAccessory.prototype = {

  getCurrentMeasurement: function (callback) {
    var that = this;
    that.log("getting current measurement");
    that.measurementService(callback, this.id);
  },

  // Get Services
  getServices: function() {
	var informationService = new Service.AccessoryInformation();

	informationService
		.setCharacteristic(Characteristic.Manufacturer, "Measurinator")
		.setCharacteristic(Characteristic.Model, "T-850")
		.setCharacteristic(Characteristic.SerialNumber, this.id)


    // Default is temperature
	var measurementService = null;

	if (this.unit === "temperature") {
      measurementService = new Service.TemperatureSensor();
      measurementService
          .getCharacteristic(Characteristic.CurrentTemperature)
          .setProps({
            minValue: -100,
            maxValue: 150
          })
          .on('get', this.getCurrentMeasurement.bind(this));
    }

    if (this.unit === "humidity") {
      measurementService = new Service.HumiditySensor();
      measurementService
          .getCharacteristic(Characteristic.CurrentRelativeHumidity)
          .setProps({
            minValue: 0,
            maxValue: 100
          })
          .on('get', this.getCurrentMeasurement.bind(this));
    }

	return [informationService, measurementService];
  }
}

function Measurinator(log, config) {
  this.log = log;
  this.client_id = config['client'];
  this.old_measurinator_api = "http://measurinator.com/thermometer";
  this.new_measurinator_api = "http://api.measurinator.com";
}

Measurinator.prototype = {
  getCurrentMeasurement: function(callback, id) {
    var that = this;
    request.get({
      url: this.old_measurinator_api+"/api/measurements/?client_id=" + this.client_id + "&location_id="+id,
      json: true
    }, function(err, response, json) {
      if (!err && response.statusCode === 200) {
        callback(null, json.current);
      } else {
        that.log("There was a problem");
        callback(null, null);
      }
    })
  },
  accessories: function(callback) {
    this.log("Fetching measurement locations...");

    // that = this needed for scopes later where this is not available or initialized wrong
    var that = this;
    var foundAccessories = [];

    request.get({
      url: this.new_measurinator_api+"/locations/?client_id=" + this.client_id,
      json: true
    }, function(err, response, json) {
      if (!err && response.statusCode === 200) {
        json.map(function(s) {
            accessory = new MeasurinatorAccessory(that.log, s.description, s.quantity, s.id, that.getCurrentMeasurement.bind(that));
            foundAccessories.push(accessory);
        })
        callback(foundAccessories);
      } else {
        that.log("There was a problem");
      }
    });
  }
}
