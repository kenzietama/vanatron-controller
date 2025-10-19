from typing import Dict, Any

from controller.weatherStationController import WeatherStationController

class WeatherStation:
    _FIELDS_TO_FETCH = {
        "solarRadiation": {"fieldName": 'solarRadiation', "metric": False},
        "uv": {"fieldName": 'uv', "metric": False},
        "winddir": {"fieldName": 'winddir', "metric": False},
        "humidity": {"fieldName": 'humidity', "metric": False},
        "dewpt": {"fieldName": 'dewpt', "metric": True},
        "elev": {"fieldName": 'elev', "metric": True},
        "heatIndex": {"fieldName": 'heatIndex', "metric": True},
        "precipRate": {"fieldName": 'precipRate', "metric": True},
        "precipTotal": {"fieldName": 'precipTotal', "metric": True},
        "pressure": {"fieldName": 'pressure', "metric": True},
        "temp": {"fieldName": 'temp', "metric": True},
        "windChill": {"fieldName": 'windChill', "metric": True},
        "windGust": {"fieldName": 'windGust', "metric": True},
        "windSpeed": {"fieldName": 'windSpeed', "metric": True}
    }

    def __init__(self, name: str, APIKey: str, stationID: str, wsController: 'WeatherStationController'): # Forward reference
        self.name = name
        self.APIKey = APIKey
        self.stationID = stationID
        self.controller = wsController
        self.dataBuffer: Dict[str, Any] = {}
        print(f"  - WeatherStation object '{self.name}' created for station: {self.stationID}")

    def updateBuffer(self) -> bool:
        print(f"Updating buffer for Weather Station '{self.name}'...")
        observationData = self.controller.updateData(self.APIKey, self.stationID)
        
        if observationData:
            newBuffer = {}
            metricData = observationData.get('metric', {})
            
            for internal_name, api_info in self._FIELDS_TO_FETCH.items():
                api_field = api_info['fieldName']
                use_metric = api_info['metric']
                
                value = None
                if use_metric:
                    value = metricData.get(api_field)
                else:
                    value = observationData.get(api_field)
                
                if value is not None:
                    newBuffer[internal_name] = value

            self.dataBuffer = newBuffer 
            print(f"Buffer updated successfully for '{self.name}'.")
            return True
        else:
            print(f"Buffer update failed for '{self.name}'.")
            return False

    def _get(self, key):
        return self.dataBuffer.get(key)

    def getSolarRadiation(self): return self._get('solarRadiation')
    def getUVIndex(self): return self._get('uv')
    def getWindDirection(self): return self._get('winddir')
    def getHumidity(self): return self._get('humidity')
    def getDewPoint(self): return self._get('dewpt')
    def getElevation(self): return self._get('elev')
    def getHeatIndex(self): return self._get('heatIndex')
    def getPrecipRate(self): return self._get('precipRate')
    def getPrecipTotal(self): return self._get('precipTotal')
    def getPressure(self): return self._get('pressure')
    def getTemperature(self): return self._get('temp')
    def getWindChill(self): return self._get('windChill')
    def getWindGust(self): return self._get('windGust')
    def getWindSpeed(self): return self._get('windSpeed')