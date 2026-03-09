import serial.tools.list_ports
from controller.modbusController import ModbusController
from model.genericSensor import GenericSensor
from model.vanatronNode import VanatronNode
from model.vfd import VFD
from model.weatherStation import WeatherStation
from typing import Union, Dict
from controller.weatherStationController import WeatherStationController

class VanatronCenter:
    def __init__(self, port: str):
        #if not self._port_exist(port):
            #raise Exception(f"Serial port '{port}' does not exist.")
        self.modbus = ModbusController(port=port, defaultSlaveID=1, timeout=2)
        self.wsController = WeatherStationController()

        self.modbus.connect()
        self.devices: Dict[str, Union[VFD, WeatherStation]] = {}

    def _port_exist(self, port_name: str) -> bool:
        ports = [p.device for p in serial.tools.list_ports.comports()]
        return port_name in ports

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
