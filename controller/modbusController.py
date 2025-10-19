import minimalmodbus
import serial
import time
from typing import List, Union

class ModbusController:
 
    def __init__(self, port: str, defaultSlaveID: int, baudrate: int = 9600, timeout: int = 1):
        self.port = port
        self.defaultSlaveID = defaultSlaveID
        self.baudrate = baudrate
        self.timeout = timeout
        
        self.instrument = None
        self.isConnected = False

    def connect(self) -> bool:
        if self.isConnected:
            return True
        try:
            self.instrument = minimalmodbus.Instrument(self.port, self.defaultSlaveID)
            self.instrument.serial.baudrate = self.baudrate
            self.instrument.serial.timeout = self.timeout
            self.instrument.mode = minimalmodbus.MODE_RTU
            self.isConnected = True
            print(f"Successfully connected to serial port {self.port}.")
            return True
        except serial.SerialException as e:
            print(f"Error: Failed to connect to port {self.port}. Message: {e}")
            self.isConnected = False
            return False

    def disconnect(self):
        if self.isConnected and self.instrument:
            self.instrument.serial.close()
            self.isConnected = False
            print("Modbus connection closed.")

    def _prepareForCommunication(self, slaveID: int | None) -> int | None:
        self._ensureConnection()
        if not self.isConnected:
            return None
        
        targetSlaveID = slaveID if slaveID is not None else self.defaultSlaveID
        self.instrument.address = targetSlaveID
        return targetSlaveID

    def _ensureConnection(self):
       if not self.isConnected:
            print("Connection lost. Attempting to reconnect...")
            self.connect()
            time.sleep(2)

    # FC01
    def readCoil(self, coilAddress: int, slaveID: int | None = None) -> bool | None:
        targetSlaveID = self._prepareForCommunication(slaveID)
        if targetSlaveID is None: 
            return None
        
        try:
            return self.instrument.read_bit(coilAddress, functioncode=1) == 1
        except Exception as e:
            self._handleError(e, "readCoil", targetSlaveID, coilAddress)
            return None

    # FC02
    def readDiscreteInput(self, input_address: int, slaveID: int | None = None) -> bool | None:
        targetSlaveID = self._prepareForCommunication(slaveID)
        if targetSlaveID is None: return None
        try:
            return self.instrument.read_bit(input_address, functioncode=2) == 1
        except Exception as e:
            self._handleError(e, "readDiscreteInput", targetSlaveID, input_address)
            return None

    # FC03
    def readHoldingRegister(self, registerAddress: int, numberOfDecimals: int = 0, slaveID: int | None = None) -> float | None:
        targetSlaveID = self._prepareForCommunication(slaveID)
        if targetSlaveID is None: return None
        try:
            return self.instrument.read_register(registerAddress, numberOfDecimals, functioncode=3)
        except Exception as e:
            self._handleError(e, "readHoldingRegister", targetSlaveID, registerAddress)
            return None

    # Beberapa FC03 
    def readHoldingRegisters(self, start_address: int, num_registers: int, slaveID: int | None = None) -> List[int] | None:
        targetSlaveID = self._prepareForCommunication(slaveID)
        if targetSlaveID is None: return None
        try:
            return self.instrument.read_registers(start_address, num_registers, functioncode=3)
        except Exception as e:
            self._handleError(e, "readHoldingRegisters", targetSlaveID, start_address)
            return None
        
    # FC04
    def readInputRegister(self, registerAddress: int, numberOfDecimals: int = 0, slaveID: int | None = None) -> float | None:
        targetSlaveID = self._prepareForCommunication(slaveID)
        if targetSlaveID is None: return None
        try:
            return self.instrument.read_register(registerAddress, numberOfDecimals, functioncode=4)
        except Exception as e:
            self._handleError(e, "readInputRegister", targetSlaveID, registerAddress)
            return None


    # FC05
    def writeSingleCoil(self, coilAddress: int, value: bool, slaveID: int | None = None) -> bool:
        targetSlaveID = self._prepareForCommunication(slaveID)
        if targetSlaveID is None: return False
        try:
            self.instrument.write_bit(coilAddress, 1 if value else 0, functioncode=5)
            return True
        except Exception as e:
            self._handleError(e, "writeSingleCoil", targetSlaveID, coilAddress)
            return False

    # FC06
    def writeSingleRegister(self, registerAddress: int, value: Union[int, float], numberOfDecimals: int = 0, slaveID: int | None = None) -> bool:
        targetSlaveID = self._prepareForCommunication(slaveID)
        if targetSlaveID is None: return False
        try:
            self.instrument.write_register(registerAddress, value, numberOfDecimals, functioncode=6)
            return True
        except Exception as e:
            self._handleError(e, "writeSingleRegister", targetSlaveID, registerAddress)
            return False

    # FC015
    def writeMultipleCoils(self, start_address: int, values: List[bool], slaveID: int | None = None) -> bool:
        targetSlaveID = self._prepareForCommunication(slaveID)
        if targetSlaveID is None: return False
        try:
            int_values = [1 if v else 0 for v in values]
            self.instrument.write_bits(start_address, int_values)
            return True
        except Exception as e:
            self._handleError(e, "writeMultipleCoils", targetSlaveID, start_address)
            return False

    # FC016
    def writeMultipleRegisters(self, start_address: int, values: List[int], slaveID: int | None = None) -> bool:
        targetSlaveID = self._prepareForCommunication(slaveID)
        if targetSlaveID is None: return False
        try:
            self.instrument.write_registers(start_address, values)
            return True
        except Exception as e:
            self._handleError(e, "writeMultipleRegisters", targetSlaveID, start_address)
            return False

    def _handleError(self, error: Exception, function_name: str, slaveID: int, address: int):
        print(f"Error in {function_name} (Slave: {slaveID}, Address: {address}): {error}")
        self.isConnected = False