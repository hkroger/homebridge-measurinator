var request = require('request');
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerPlatform("homebridge-measurinator", "Measurinator", Measurinator);
  homebridge.registerAccessory("homebridge-measurinator", "MeasurinatorAccessory", MeasurinatorAccessory);
}

function MeasurinatorAccessory(log, name, id, temperatureService) {
  this.log = log;
  this.name = name;
  this.id = id.toString();
  this.temperatureService = temperatureService;
}

MeasurinatorAccessory.prototype = {

  getCurrentTemperature: function (callback) {
    var that = this;
    that.log("getting CurrentTemperature");
    that.temperatureService(callback, this.id);
  },

  // Get Services
  getServices: function() {
	var informationService = new Service.AccessoryInformation();

	informationService
		.setCharacteristic(Characteristic.Manufacturer, "Measurinator")
		.setCharacteristic(Characteristic.Model, "T-850")
		.setCharacteristic(Characteristic.SerialNumber, this.id)

	var temperatureService = new Service.TemperatureSensor();

    temperatureService
    	.getCharacteristic(Characteristic.CurrentTemperature)
    	.setProps({
            minValue: -100,
            maxValue: 150
        })
    	.on('get', this.getCurrentTemperature.bind(this));

	return [informationService, temperatureService];
  }
}

function Measurinator(log, config) {
  this.log = log;
  this.client_id = config['client'];
  this.measurinator_root = config["measurinator_url"] || "http://measurinator.com/thermometer";
}

Measurinator.prototype = {
  getCurrentTemperature: function(callback, id) {
    var that = this;
    request.get({
      url: this.measurinator_root+"/api/measurements/?client_id=" + this.client_id + "&location_id="+id,
      json: true
    }, function(err, response, json) {
      if (!err && response.statusCode == 200) {
        callback(null, json.current);
      } else {
        that.log("There was a problem");
        callback(null, null);
      }
    })
  },
  accessories: function(callback) {
    this.log("Fetching measurement locations...");

    var that = this;
    var foundAccessories = [];

    request.get({
      url: this.measurinator_root+"/api/locations/?client_id=" + this.client_id,
      json: true
    }, function(err, response, json) {
      if (!err && response.statusCode == 200) {
        json.map(function(s) {
            accessory = new MeasurinatorAccessory(that.log, s.description, s.id, that.getCurrentTemperature.bind(that));
            foundAccessories.push(accessory);
        })
        callback(foundAccessories);
      } else {
        that.log("There was a problem");
      }
    });
  }
}
