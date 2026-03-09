from controller.modbusController import ModbusController

class VanatronNode:
    _TEMPERATURE_REG_MAP = {1: 0, 2: 1}
    _PWM_REG_MAP = {1: 2, 2: 3, 3: 4}
    _DO_COIL_MAP = {1: 0, 2: 1}

    def __init__(self, name: str, slaveID: int, modbusController: ModbusController):
        self.name = name
        self.slaveID = slaveID
        self.modbus = modbusController
        print(f"  - VanatronNode object '{self.name}' created with Slave ID: {self.slaveID}")

    def getTemperature(self, channel: int) -> float | None:
        address = self._TEMPERATURE_REG_MAP.get(channel)
        if address is None:
            print(f"Error: Temperature channel {channel} is invalid.")
            return None
        
        rawValue = self.modbus.readInputRegister(registerAddress=address, slaveID=self.slaveID)
        return rawValue / 10.0 if rawValue is not None else None

    def getPHValue(self) -> float | None:
        rawValue = self.modbus.readInputRegister(registerAddress=2, slaveID=self.slaveID)
        return rawValue / 10.0 if rawValue is not None else None

    def getDissolvedOxygenValue(self) -> float | None:
        rawValue = self.modbus.readInputRegister(registerAddress=3, slaveID=self.slaveID)
        return float(rawValue) if rawValue is not None else None # mg/l
        
    def setPWM(self, channel: int, value: int) -> bool:
        address = self._PWM_REG_MAP.get(channel)
        if address is None:
            print(f"Error: PWM channel {channel} is invalid.")
            return False
        if not 0 <= value <= 255:
            print(f"Error: PWM value {value} is out of range (0-255).")
            return False
        
        return self.modbus.writeSingleRegister(registerAddress=address, value=value, slaveID=self.slaveID)

    def setDigitalOutput(self, channel: int, state: bool) -> bool:
        address = self._DO_COIL_MAP.get(channel)
        if address is None:
            print(f"Error: Digital Output Channel {channel} is invalid.")
            return False
            
        return self.modbus.writeSingleCoil(coilAddress=address, value=state, slaveID=self.slaveID)

