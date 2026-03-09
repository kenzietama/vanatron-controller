import minimalmodbus
import serial.tools.list_ports
import time
import threading
import logging
from typing import List, Union

logger = logging.getLogger(__name__)

class ModbusController:
    _lock = threading.Lock()

    def __init__(self, port: str, defaultSlaveID: int, baudrate: int = 9600, timeout: int = 1):
        self.port = port
        self.defaultSlaveID = defaultSlaveID
        self.baudrate = baudrate
        self.timeout = timeout
        
        self.instrument = None
        self.isConnected = False

    def _port_exist(self, port_name: str) -> bool:
        if not port_name:
            return False
        ports = [p.device for p in serial.tools.list_ports.comports()]
        return port_name in ports

    def connect(self) -> bool:
        for attempt in range(5):
            if self._port_exist(self.port):    
                try:
                    self.instrument = minimalmodbus.Instrument(self.port, self.defaultSlaveID)
                    self.instrument.serial.baudrate = self.baudrate
                    self.instrument.serial.timeout = self.timeout
                    self.instrument.mode = minimalmodbus.MODE_RTU
                    self.isConnected = True
                    logger.info(f"Connected to {self.port} on attempt {attempt+1}")
                    time.sleep(1)
                    return True
                except Exception as e:
                    logger.error(f"Connect failed on attempt {attempt+1}: {e}")                   
                    time.sleep(2 ** attempt)
            else:
                time.sleep(2 ** attempt)
        logger.critical(f"Failed to connect after 5 attempts - port {self.port} unavailable")
        return False

    def disconnect(self):
        if self.instrument and hasattr(self.instrument, 'serial'):
                try:
                    self.instrument.serial.close()
                except Exception:
                    pass
        self.isConnected = False
        self.instrument = None
        print("Modbus connection closed.")

    def _prepareForCommunication(self, slaveID: int | None) -> int | None:
        self._ensureConnection()
        if not self.isConnected:
            return None
        
        targetSlaveID = slaveID if slaveID is not None else self.defaultSlaveID
        self.instrument.address = targetSlaveID
        return targetSlaveID

    def _ensureConnection(self):
        if self._port_exist(self.port):
            if self.isConnected:
                try:
                    if not self.instrument.serial.is_open:
                        raise serial.SerialException("Port closed")
                    return True
                except (serial.SerialException, IOError, OSError) as e:
                    logger.warning(f"Invalid port state: {e} - forcing reconnect...")
                    self.disconnect()
            else:
                logger.info("Connecting to port...")
                return self.connect()
        else:
            logger.error(f"Port {self.port} does not exist - waiting for detection...")
            return False
    # FC01
    def readCoil(self, coilAddress: int, slaveID: int | None = None) -> bool | None:
        with self._lock:
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
        with self._lock:
            targetSlaveID = self._prepareForCommunication(slaveID)
            if targetSlaveID is None: return None
            try:
                return self.instrument.read_bit(input_address, functioncode=2) == 1
            except Exception as e:
                self._handleError(e, "readDiscreteInput", targetSlaveID, input_address)
                return None

    # FC03
    def readHoldingRegister(self, registerAddress: int, numberOfDecimals: int = 0, slaveID: int | None = None) -> float | None:
        last_error = None
        for attempt in range(3):
            with self._lock:
                targetSlaveID = self._prepareForCommunication(slaveID)
                if targetSlaveID is None:
                    logger.warning(f"Attempt {attempt+1}: could not prepare communication for ReadHoldingRegister")
                    time.sleep(1 + attempt)
                    continue
                try:
                    value = self.instrument.read_register(registerAddress, numberOfDecimals, functioncode=3)
                    time.sleep(0.1)
                    logger.debug(f"ReadHoldingRegister succeeded on attempt {attempt+1}")
                    return value
                except Exception as e:
                    last_error = e
                    logger.debug(f"ReadHoldingRegister attempt {attempt+1} failed: {e}")
                    time.sleep(1 + attempt)
                    continue
        logger.warning(f"ReadHoldingRegister failed after 3 attempts (Slave: {slaveID}, Addr: {registerAddress})")
        if last_error is not None:
            self._handleError(last_error, "readHoldingRegister", targetSlaveID, registerAddress)
        else:
            logger.error("No specific error captured - check connection/preparation")
        return None

    # Beberapa FC03 
    def readHoldingRegisters(self, start_address: int, num_registers: int, slaveID: int | None = None) -> List[int] | None:
        last_error = None
        for attempt in range(3):
            with self._lock:
                targetSlaveID = self._prepareForCommunication(slaveID)
                if targetSlaveID is None:
                    logger.warning(f"Attempt {attempt+1}: could not prepare communication for ReadHoldingRegisters")
                    time.sleep(1 + attempt)
                    continue
                try:
                    value = self.instrument.read_registers(start_address, num_registers, functioncode=3)
                    time.sleep(0.1)
                    logger.debug(f"ReadHoldingRegisters succeeded on attempt {attempt+1}")
                    return value
                except Exception as e:
                    last_error = e
                    logger.debug(f"ReadHoldingRegisters attempt {attempt+1} failed: {e}")
                    time.sleep(1 + attempt)
                    continue
        logger.warning(f"ReadHoldingRegisters failed after 3 attempts (Slave: {slaveID}, Addr: {start_address})")
        if last_error is not None:
            self._handleError(last_error, "readHoldingRegisters", targetSlaveID, start_address)
        else:
            logger.error("No specific error captured - check connection/preparation")
        return None
        
    # FC04
    def readInputRegister(self, registerAddress: int, numberOfDecimals: int = 0, slaveID: int | None = None) -> float | None:
        with self._lock:
            targetSlaveID = self._prepareForCommunication(slaveID)
            if targetSlaveID is None: return None
            try:
                return self.instrument.read_register(registerAddress, numberOfDecimals, functioncode=4)
            except Exception as e:
                self._handleError(e, "readInputRegister", targetSlaveID, registerAddress)
                return None

    # FC05
    def writeSingleCoil(self, coilAddress: int, value: bool, slaveID: int | None = None) -> bool:
        with self._lock:
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
        last_error = None
        for attempt in range(3):
            with self._lock:
                targetSlaveID = self._prepareForCommunication(slaveID)
                if targetSlaveID is None:
                    logger.debug(f"Attempt {attempt+1}: could not prepare communication")
                    time.sleep(1 + attempt)
                    continue
                try:
                    self.instrument.write_register(registerAddress, value, numberOfDecimals, functioncode=6)
                    logger.debug(f"WriteSingleRegister succeeded on attempt {attempt+1}")
                    return True
                except Exception as e:
                    last_error = e
                    logger.debug(f"WriteSingleRegister attempt {attempt+1} failed: {e}")
                    time.sleep(1 + attempt)
                    continue
        logger.warning(f"WriteSingleRegister failed after 3 attempts (Slave: {slaveID}, Addr: {registerAddress})")
        if last_error is not None:
            self._handleError(last_error, "writeSingleRegister", targetSlaveID, registerAddress)
        else:
            logger.error("No specific error captured - check connection/preparation")
        return False

    # FC015
    def writeMultipleCoils(self, start_address: int, values: List[bool], slaveID: int | None = None) -> bool:
        with self._lock:
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
        with self._lock:
            targetSlaveID = self._prepareForCommunication(slaveID)
            if targetSlaveID is None: return False
            try:
                self.instrument.write_registers(start_address, values)
                return True
            except Exception as e:
                self._handleError(e, "writeMultipleRegisters", targetSlaveID, start_address)
                return False

    def _handleError(self, error: Exception, function_name: str, slaveID: int, address: int):
        if isinstance(error, minimalmodbus.NoResponseError):
            # A slave not answering does NOT mean the serial bus is broken.
            # Other slaves (e.g. VFD) may still be reachable on the same port.
            # Do NOT disconnect the shared serial port here.
            logger.debug(f"No response from slave {slaveID} addr {address} in {function_name}")
        elif isinstance(error, minimalmodbus.InvalidResponseError):
            # Garbled frame - flush buffers but keep connection alive.
            logger.warning(f"Invalid response from slave {slaveID} addr {address} in {function_name}: {error}")
            try:
                if self.instrument and self.instrument.serial.is_open:
                    self.instrument.serial.reset_input_buffer()
                    self.instrument.serial.reset_output_buffer()
            except Exception:
                pass
        elif isinstance(error, (serial.SerialException, OSError, IOError)):
            logger.error(f"Serial/OS error in {function_name} (Slave: {slaveID}, Addr: {address}): {error}")
            self.isConnected = False
            self.disconnect()
        elif "valid port handle" in str(error).lower():
            logger.error(f"Invalid handle in {function_name} (Slave: {slaveID}, Addr: {address}): {error}")
            self.isConnected = False
            self.disconnect()
        else:
            logger.warning(f"Unhandled error in {function_name} (Slave: {slaveID}, Addr: {address}): {error}")