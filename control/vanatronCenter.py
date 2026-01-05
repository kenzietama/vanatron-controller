from controller.modbusController import ModbusController
from model.genericSensor import GenericSensor
from model.vanatronNode import VanatronNode
from model.vfd import VFD
from model.weatherStation import WeatherStation
from typing import Union, Dict
from controller.weatherStationController import WeatherStationController

class VanatronCenter:
    def __init__(self, port: str):
        self.modbus = ModbusController(port=port, defaultSlaveID=1, timeout=2)
        self.wsController = WeatherStationController()

        self.modbus.connect()
        self.devices: Dict[str, Union[VFD, WeatherStation]] = {}

    def addVFD(self, name: str, slaveID: int):
        if name in self.devices: 
            return
        
        instance = VFD(name=name, slaveID=slaveID, modbusController=self.modbus)
        self.devices[name] = instance
        setattr(self, name, instance)

    def addVanatronNode(self, name: str, slaveID: int):
        if name in self.devices: 
            return
        
        instance = VanatronNode(name=name, slaveID=slaveID, modbusController=self.modbus)
        self.devices[name] = instance
        setattr(self, name, instance)

    def addGenericSensor(self, name: str, slaveID: int):
        if name in self.devices: 
            return
        
        instance = GenericSensor(name=name, slaveID=slaveID, modbusController=self.modbus)
        self.devices[name] = instance
        setattr(self, name, instance)

    def addWeatherStation(self, name: str, APIKey: str, stationID: str):
        if name in self.devices: 
            return
        
        instance = WeatherStation(name=name, APIKey=APIKey, stationID=stationID, wsController=self.wsController)
        self.devices[name] = instance
        setattr(self, name, instance)

    def close(self):
        self.modbus.disconnect()