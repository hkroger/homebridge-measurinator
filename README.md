# Homebridge Measurinator plugin

## Installation

Install homebridge using: 

	npm install -g homebridge

Install this plugin using: 

	npm install -g homebridge-measurinator

Update your configuration file. Add Measurinator as a platform. See `config.json.sample` for full example.

    "platforms": [
        {
            "platform" : "Measurinator",
            "name" : "Measurinator",
            "client": "123123123-1223-1234-1234-123412341234"
        }
    ]