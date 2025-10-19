from typing import Union
from controller.modbusController import ModbusController

class GenericSensor:
    def __init__(self, name: str, slaveID: int, modbusController: ModbusController):
        self.name = name
        self.slaveID = slaveID
        self.modbus = modbusController
        self._registers = {}
        print(f"  - GenericSensor object '{self.name}' created with Slave ID: {self.slaveID}")

    def addRegister(self, name: str, address: int, registerType: str, decimals: int = 0):

        validTypes = ['holding', 'input', 'coil', 'discrete_input']
        if registerType not in validTypes:
            print(f"Error: The register type '{registerType}' is invalid. Use one of: {validTypes}")
            return

        print(f"    -> Registering '{name}' to {self.name} (Type: {registerType}, Address: {address})")
        self._registers[name] = {'address': address, 'type': registerType, 'decimals': decimals}

    def read(self, name: str) -> Union[float, int, bool, None]:
        registerInfo = self._registers.get(name)
        if not registerInfo:
            print(f"Error: Register with name '{name}' not found in {self.name}.")
            return None
        
        regType = registerInfo['type']
        address = registerInfo['address']
        decimals = registerInfo['decimals']
        
        if regType == 'holding':
            return self.modbus.readHoldingRegister(address, decimals, slaveID=self.slaveID)
        elif regType == 'input':
            return self.modbus.readInputRegister(address, decimals, slaveID=self.slaveID)
        elif regType == 'coil':
            return self.modbus.readCoil(address, slaveID=self.slaveID)
        elif regType == 'discrete_input':
            return self.modbus.readDiscreteInput(address, slaveID=self.slaveID)
        
        return None