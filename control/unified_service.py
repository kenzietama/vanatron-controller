"""Unified Vanatron Service - Single process with threading"""
import logging
import sys
import config

logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL.upper(), logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(config.LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)

import time
import threading
from vanatronCenter import VanatronCenter
from api.api_client import APIClient
from fis.database import ControlHistoryDB
from fis.fis_controller import FISController

logger = logging.getLogger(__name__)

class VanatronService:
    def __init__(self):
        logger.info("Initializing Unified Vanatron Service...")
        
        # Shared Vanatron Center instance
        self.vanatron = VanatronCenter(port=config.SERIAL_PORT)
        
        # Components
        self.api = APIClient()
        self.db = ControlHistoryDB(config.DATABASE_PATH)
        self.fis = FISController(config.FIS_MIN_POWER, config.FIS_MAX_POWER)
        
        # Setup devices
        self._setup_devices()
        
        # Control state
        self.running = True
        self.last_weather_update = 0
        
        # Thread-safe data sharing
        self.do_reading_lock = threading.Lock()
        self.latest_do_reading = None
        
        # Control state tracking - NEW
        self.control_state = {
            'previous_error': None,  # Changed from 0.0 to None
            'previous_mode': None,
            'previous_state': None,
            'control_initialized': False,  # NEW: Track if control has been initialized
            'last_control_time': None  # NEW: Track last control execution time
        }
        
        self.control_interval = config.CONTROL_LOOP_INTERVAL

        logger.info("Unified Service initialized successfully")
    
    def _setup_devices(self):
        """Setup all hardware devices"""
        logger.info("Setting up hardware devices...")
        
        # self.vanatron.addVanatronNode('node', config.VANATRON_NODE_SLAVE_ID)
        self.vanatron.addVFD('vfd', config.VFD_SLAVE_ID)
        # self.vanatron.addWeatherStation('weather', config.WEATHER_API_KEY, config.WEATHER_STATION_ID)
        
        # self.vanatron.addGenericSensor('pyranometer', config.PYRANOMETER_SLAVE_ID)
        # self.vanatron.pyranometer.addRegister('radiasi', 0, 'holding', 1)
        
        self.vanatron.addGenericSensor('do_sensor', config.DO_SLAVE_ID)
        self.vanatron.do_sensor.addRegister('dissolvedOxygen', 257, 'holding', 1)
        self.vanatron.do_sensor.addRegister('suhu', 256, 'holding', 1)

        # self.vanatron.addGenericSensor('rtd', config.RTD_SLAVE_ID)
        # self.vanatron.rtd.addRegister('suhu_pv', 0, 'holding', 1)
        
        logger.info("Hardware devices setup complete")
    
    def data_acquisition_loop(self):
        """Thread for data acquisition and upload"""
        logger.info("Starting Data Acquisition Thread...")
        
        while self.running:
            try:
                cycle_start = time.time()
                
                # self._read_vanatron_node()
                self._read_vfd()
                self._read_generic_sensors()
                # self._read_weather()
                
                elapsed = time.time() - cycle_start
                sleep_time = max(0, config.DATA_ACQUISITION_INTERVAL - elapsed)
                
                if sleep_time > 0:
                    time.sleep(sleep_time)
                else:
                    logger.warning(f"Data acquisition cycle took {elapsed:.2f}s")
                    
            except Exception as e:
                logger.error(f"Error in data acquisition loop: {e}", exc_info=True)
                time.sleep(config.DATA_ACQUISITION_INTERVAL)
    
    def control_loop(self):
        """Thread for control system with proper state management"""
        logger.info("Starting Control System Thread...")
        
        # Initial cleanup
        self.db.cleanup_old_records(30)
        
        # Initialize from last database record if exists
        self._initialize_control_state()
        
        while self.running:
            try:
                cycle_start = time.time()
                
                # Get control settings
                settings = self.api.get_control_settings()
                
                if settings is None:
                    logger.warning("Failed to get control settings")
                    time.sleep(self.control_interval)
                    continue
                
                state = settings.get('state', 'off')
                mode = settings.get('mode', 'manual')
                do_setpoint = float(settings.get('do_set_point', 5.0))
                manual_speed = float(settings.get('power_set_point', 50.0))
                
                # Get current DO reading
                self._read_generic_sensors()  # Ensure latest reading
                time.sleep(0.05)
                with self.do_reading_lock:
                    do_reading = self.latest_do_reading
                
                # Handle missing DO reading
                if do_reading is None:
                    logger.warning("No DO reading available, skipping control cycle")
                    time.sleep(self.control_interval)
                    continue
                
                # Detect state/mode changes
                state_changed = self.control_state['previous_state'] != state
                mode_changed = self.control_state['previous_mode'] != mode
                
                # Handle state transitions
                if state_changed:
                    logger.info(f"State changed: {self.control_state['previous_state']} -> {state}")
                    self._handle_state_change(state, mode, do_setpoint, do_reading)
                    self.control_state['previous_state'] = state
                
                # Handle mode transitions
                if mode_changed and state == 'on':
                    logger.info(f"Mode changed: {self.control_state['previous_mode']} -> {mode}")
                    self._handle_mode_change(mode, do_setpoint, do_reading)
                    self.control_state['previous_mode'] = mode
                
                # Execute control logic
                if state == 'off':
                    self._handle_off_state(do_setpoint, do_reading)
                elif state == 'on':
                    if mode == 'auto':
                        self._control_auto_mode(do_setpoint, do_reading)
                    elif mode == 'manual':
                        self._control_manual_mode(manual_speed, do_setpoint, do_reading)
                
                # Update last control time
                self.control_state['last_control_time'] = time.time()
                
                # Periodic cleanup
                # if int(time.time()) % 86400 == 0:
                #     self.db.cleanup_old_records(30)
                
                # Sleep
                elapsed = time.time() - cycle_start
                sleep_time = max(0, self.control_interval - elapsed)
                
                if sleep_time > 0:
                    time.sleep(sleep_time)
                else:
                    logger.warning(f"Control cycle took {elapsed:.2f}s")
                    
            except Exception as e:
                logger.error(f"Error in control loop: {e}", exc_info=True)
                time.sleep(config.CONTROL_LOOP_INTERVAL)
    
    def _initialize_control_state(self):
        """Initialize control state from last database record"""
        try:
            last_record = self.db.get_last_record()
            
            if last_record and last_record['state'] == 'on' and last_record['mode'] == 'auto':
                # Resume from last known state only if it was in auto mode
                self.control_state['previous_error'] = last_record['error']
                self.control_state['previous_mode'] = last_record['mode']
                self.control_state['previous_state'] = last_record['state']
                self.control_state['control_initialized'] = True

                self.control_interval = config.CONTROL_LOOP_AUTO_INTERVAL
                
                logger.info(f"Initialized control state from database: "
                          f"previous_error={last_record['error']:.2f}, "
                          f"mode={last_record['mode']}, state={last_record['state']}")
            else:
                # Start fresh
                self.control_state['previous_error'] = None
                self.control_state['previous_mode'] = None
                self.control_state['previous_state'] = None
                self.control_state['control_initialized'] = False

                self.control_interval = config.CONTROL_LOOP_INTERVAL
                
                logger.info("Starting control system with fresh state (no valid previous record)")
                
        except Exception as e:
            logger.error(f"Error initializing control state: {e}")
            # Fail-safe: start fresh
            self.control_state['previous_error'] = None
            self.control_state['control_initialized'] = False
            self.control_interval = config.CONTROL_LOOP_INTERVAL
            
    def _handle_state_change(self, new_state, mode, do_setpoint, do_reading):
        """Handle state transitions (on/off)"""
        if new_state == 'on':
            self.vanatron.vfd.runForward()
            time.sleep(0.5)
            
            # Reset control state when turning on
            if mode == 'auto':
                # Initialize error for first auto control cycle
                current_error = do_setpoint - do_reading
                self.control_state['previous_error'] = current_error
                self.control_state['control_initialized'] = True
                logger.info(f"State ON: Initialized previous_error = {current_error:.2f}")
        else:
            # Turning off - stop VFD and reset control state
            self.vanatron.vfd.stop()
            self.control_state['previous_error'] = None
            self.control_state['control_initialized'] = False
            logger.info("State OFF: Reset control state")
    
    def _handle_mode_change(self, new_mode, do_setpoint, do_reading):
        """Handle mode transitions (manual/auto)"""
        if new_mode == 'auto':
            # Switching to auto - initialize error
            current_error = do_setpoint - do_reading
            self.control_state['previous_error'] = current_error
            self.control_state['control_initialized'] = True
            logger.info(f"Mode changed to AUTO: Initialized previous_error = {current_error:.2f}")
        else:
            # Switching to manual - reset control state
            self.control_state['previous_error'] = None
            self.control_state['control_initialized'] = False
            logger.info("Mode changed to MANUAL: Reset control state")
    
    def _control_auto_mode(self, setpoint, reading):
        """Execute auto control mode using FIS with proper delta_error handling"""
        for attempt in range(3):
            try:
                current_error = setpoint - reading
                
                # Calculate delta_error safely
                if self.control_state['previous_error'] is None or not self.control_state['control_initialized']:
                    # First run or after mode change: assume delta_error = 0 (no change)
                    delta_error = 0.0
                    logger.info(f"Auto Control (FIRST RUN): Using delta_error = 0.0 (initialized)")
                else:
                    # Check for large time gaps (e.g., after system restart)
                    if self.control_state['last_control_time'] is not None:
                        time_gap = time.time() - self.control_state['last_control_time']
                        if time_gap > config.CONTROL_LOOP_AUTO_INTERVAL * 3:  # More than 3 cycles missed
                            logger.warning(f"Large time gap detected ({time_gap:.1f}s), resetting delta_error")
                            delta_error = 0.0
                        else:
                            delta_error = current_error - self.control_state['previous_error']
                    else:
                        delta_error = current_error - self.control_state['previous_error']
                
                # Update previous error for next cycle
                self.control_state['previous_error'] = current_error
                self.control_state['control_initialized'] = True
                
                # Use FIS to calculate speed
                speed = self.fis.calculate_speed(current_error, delta_error)
                
                # Set VFD speed
                self.vanatron.vfd.setSpeed(speed)
                
                # Store in database
                self.db.insert_record(
                    do_setpoint=setpoint,
                    do_reading=reading,
                    error=current_error,
                    delta_error=delta_error,
                    vfd_speed=speed,
                    mode='auto',
                    state='on'
                )
                
                logger.info(f"Auto Control - Setpoint: {setpoint:.2f}, Reading: {reading:.2f}, "
                        f"Error: {current_error:.2f}, dError: {delta_error:.2f}, Speed: {speed:.2f}%")
                
                return speed
            except Exception as e:
                logger.error(f"Failed to execute auto control mode (attempt {attempt + 1}): {e}")
                time.sleep(1 + attempt)
        else:
            logger.error("Failed to execute auto control mode after 3 attempts")
            return config.FIS_MIN_POWER
    
    def _control_manual_mode(self, manual_speed, setpoint, reading):
        """Execute manual control mode"""
        for attempt in range(3):
            try:
                # Calculate error for logging only (not used for control)
                current_error = setpoint - reading
                
                # In manual mode, delta_error is not meaningful for control
                # but we calculate it for logging/monitoring purposes
                if self.control_state['previous_error'] is not None:
                    delta_error = current_error - self.control_state['previous_error']
                else:
                    delta_error = 0.0
                
                # Update previous error for continuity if switching to auto later
                self.control_state['previous_error'] = current_error
                
                # Clamp manual speed
                speed = max(config.FIS_MIN_POWER, min(config.FIS_MAX_POWER, manual_speed))
                
                # Set VFD speed
                self.vanatron.vfd.setSpeed(speed)

                # Store in database
                self.db.insert_record(
                    do_setpoint=setpoint,
                    do_reading=reading,
                    error=current_error,
                    delta_error=delta_error,
                    vfd_speed=speed,
                    mode='manual',
                    state='on'
                )
                
                logger.info(f"Manual Control - Speed: {speed:.2f}%, Reading: {reading:.2f}, "
                        f"Error: {current_error:.2f} (for monitoring only)")
                
                return speed
            except Exception as e:
                logger.warning(f"Failed to execute manual control mode (attempt {attempt + 1}): {e}")
                time.sleep(1 + attempt)
        else:
            logger.error("Failed to execute manual control mode after 3 attempts")
            return config.FIS_MIN_POWER
    
    def _handle_off_state(self, setpoint, reading):
        """Handle OFF state"""
        try:
            # Calculate error for logging
            current_error = setpoint - reading
            
            # In OFF state, we still track error for monitoring
            # but delta_error is not meaningful
            delta_error = 0.0
            
            # Don't update previous_error in OFF state
            # This prevents stale values when turning back on
            
            # Store in database
            self.db.insert_record(
                do_setpoint=setpoint,
                do_reading=reading,
                error=current_error,
                delta_error=delta_error,
                vfd_speed=0.0,
                mode='off',  # Changed from 'manual' to 'off' for clarity
                state='off'
            )
            
            logger.debug(f"System OFF - Reading: {reading:.2f}, Error: {current_error:.2f}")
        except Exception as e:
            logger.error(f"Error handling OFF state: {e}")
    
    # ... [rest of the methods remain the same: _read_vanatron_node, _read_vfd, etc.] ...
    
    def _read_vanatron_node(self):
        """Read and upload Vanatron Node sensors"""
        try:
            do_value = self.vanatron.node.getDissolvedOxygenValue()
            if do_value is not None:
                with self.do_reading_lock:
                    self.latest_do_reading = do_value
                
                self.api.upload_dissolved_oxygen(do_value)
                logger.debug(f"DO: {do_value} mg/L")
            
            time.sleep(0.1)
            
            water_temp = self.vanatron.node.getTemperature(1)
            if water_temp is not None:
                self.api.upload_water_temperature(water_temp)
                logger.debug(f"Water Temp: {water_temp} °C")
            
            time.sleep(0.1)
            
            # ph_value = self.vanatron.node.getPHValue()
            # if ph_value is not None:
            #     self.api.upload_ph(ph_value)
            #     logger.debug(f"pH: {ph_value}")
            
            # time.sleep(0.1)
            
        except Exception as e:
            logger.error(f"Error reading Vanatron Node: {e}")
    
    def _read_vfd(self):
        """Read and upload VFD data"""
        for attempt in range(3):  # Retry up to 3 times
            try:
                if self.vanatron.vfd.updateBuffer():
                    vfd_data = {
                        'running_frequency': self.vanatron.vfd.getRunningFrequency(),
                        'set_frequency': self.vanatron.vfd.getSetFrequency(),
                        'output_voltage': self.vanatron.vfd.getOutputVoltage(),
                        'output_current': self.vanatron.vfd.getOutputCurrent(),
                        'output_power': self.vanatron.vfd.getOutputPower(),
                        'output_torque': self.vanatron.vfd.getOutputTorque(),
                        'accumulative_poweron_time': self.vanatron.vfd.getAccumulativePowerOnTime(),
                        'accumulative_running_time': self.vanatron.vfd.getAccumulativeRunningTime(),
                        'pulse_input_frequency': self.vanatron.vfd.getPulseInputFrequency(),
                        'main_frequency_x': self.vanatron.vfd.getMainFrequencyX(),
                        'target_torque': self.vanatron.vfd.getTargetTorque(),
                        'power_factor_angle': self.vanatron.vfd.getPowerFactorAngle(),
                        'target_voltage_upon_vf_separation': self.vanatron.vfd.getTargetVoltageVFSeparation(),
                        'output_voltage_upon_vf_separation': self.vanatron.vfd.getOutputVoltageVFSeparation(),
                        'fault_information': self.vanatron.vfd.getFaultInformation(),
                        'current_set_frequency': self.vanatron.vfd.getCurrentSetFrequency(),
                        'current_running_frequency': self.vanatron.vfd.getCurrentRunningFrequency(),
                        'ac_drive_running_state': self.vanatron.vfd.getACDriveRunningState(),
                        'current_fault_code': self.vanatron.vfd.getCurrentFaultCode(),
                        'torque_upper_limit': self.vanatron.vfd.getTorqueUpperLimit()
                    }
                    vfd_data = {k: v for k, v in vfd_data.items() if v is not None}
                    if vfd_data:
                        self.api.upload_vfd(vfd_data)
                        logger.debug(f"VFD: {vfd_data.get('running_frequency')} Hz")
                        break
            except Exception as e:
                logger.warning(f"VFD read failed (attempt {attempt+1}): {e}")
                time.sleep(1 + attempt)
        else:
            logger.error("Failed to read VFD after 3 attempts")
    
    def _read_generic_sensors(self):
        """Read and upload generic sensors"""
        for attempt in range(3):  # Retry up to 3 times
            try:
                # radiasi = self.vanatron.pyranometer.read('radiasi')
                # if radiasi is not None:
                #     self.api.upload_pyranometer(radiasi)
                #     logger.debug(f"Solar Radiation: {radiasi} W/m²")
                
                # time.sleep(0.1)
                
                # suhu_pv = self.vanatron.rtd.read('suhu_pv')
                # if suhu_pv is not None:
                #     self.api.upload_rtd(suhu_pv)
                #     logger.debug(f"PV Surface Temp: {suhu_pv} °C")

                raw_do = self.vanatron.do_sensor.read('dissolvedOxygen')
                if raw_do is not None:
                    do = raw_do / 10.0  # Assuming sensor gives value in tenths of mg/L
                    with self.do_reading_lock:
                        self.latest_do_reading = do
                    self.api.upload_dissolved_oxygen(do)
                    logger.debug(f"Dissolved Oxygen: {do} mg/L")
                    break
            except Exception as e:
                logger.warning(f"Error reading generic sensors (attempt {attempt+1}): {e}")
                time.sleep(1 + attempt)
        else:
            logger.error("Failed to read generic sensors after 3 attempts")
    
    def _read_weather(self):
        """Read and upload Weather Station data"""
        current_time = time.time()
        if current_time - self.last_weather_update < config.WEATHER_UPDATE_INTERVAL:
            return
        
        try:
            if self.vanatron.weather.updateBuffer():
                weather_data = {
                    'indoor_temperature': self.vanatron.weather.getTemperature(),
                    'indoor_humidity': self.vanatron.weather.getHumidity(),
                    'barometric_pressure': self.vanatron.weather.getPressure(),
                    'wind_direction': self.vanatron.weather.getWindDirection(),
                    'rain_fall': self.vanatron.weather.getPrecipTotal(),
                    'wind_speed': self.vanatron.weather.getWindSpeed(),
                    'dew_point': self.vanatron.weather.getDewPoint(),
                    'outdoor_humidity': self.vanatron.weather.getHumidity(),
                    'outdoor_temperature': self.vanatron.weather.getTemperature(),
                    'uv_index': self.vanatron.weather.getUVIndex(),
                    'light': self.vanatron.weather.getSolarRadiation()
                }
                
                weather_data = {k: v for k, v in weather_data.items() if v is not None}
                
                if weather_data:
                    self.api.upload_weather_station(weather_data)
                    logger.info(f"Weather updated: {weather_data.get('outdoor_temperature')} °C")
                    
                self.last_weather_update = current_time
        except Exception as e:
            logger.error(f"Error reading Weather Station: {e}")
    
    def run(self):
        """Start both threads"""
        logger.info("Starting Vanatron Service...")
        
        data_thread = threading.Thread(target=self.data_acquisition_loop, name="DataAcquisition")
        control_thread = threading.Thread(target=self.control_loop, name="ControlSystem")
        
        data_thread.daemon = True
        control_thread.daemon = True
        
        data_thread.start()
        control_thread.start()
        
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Received shutdown signal")
            self.running = False
            
            data_thread.join(timeout=5)
            control_thread.join(timeout=5)
    
    def shutdown(self):
        """Graceful shutdown"""
        logger.info("Shutting down Vanatron Service...")
        self.running = False
        
        try:
            self.vanatron.vfd.stop()
        except:
            pass
        
        self.vanatron.close()
        logger.info("Vanatron Service stopped")

def main():
    service = VanatronService()
    try:
        service.run()
    finally:
        service.shutdown()

if __name__ == "__main__":
    main()