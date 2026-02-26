"""Unified Vanatron Service - Single process with threading"""
import logging
import sys
import config

logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL.upper(), logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(config.LOG_FILE, encoding='utf-8'),
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
        self._initial_do_ready = threading.Event()  # Event to signal first valid DO reading
        
        # Control state tracking
        self.control_state = {
            'previous_error': None,
            'previous_mode': None,
            'previous_state': None,
            'control_initialized': False,
            'last_control_time': None
        }
        
        self.control_interval = config.CONTROL_LOOP_INTERVAL

        # --- SAFETY STATE (thread-safe via control_loop single-thread) ---
        # Rule 1: API loss resilience – last-known settings cache
        self.control_status = None          # 'manual' | 'auto' | None
        self.last_api_state = 'off'         # 'on' | 'off'
        self.last_api_mode = 'manual'
        self.last_api_do_setpoint = 5.0
        self.last_api_manual_speed = 50.0
        self._api_offline_logged = False    # suppress repeated "API offline" logs

        # Rule 2 & 3: Emergency DO hysteresis override
        self.emergency_override = False
        self._emergency_override_logged = False   # log once per activation
        self.EMERGENCY_DO_LOW = 4.0         # mg/L - trigger threshold
        self.EMERGENCY_DO_HIGH = 4.5        # mg/L - recovery threshold

        # Rule 4: Sensor fault - consecutive null-DO cycle counter
        self.null_do_cycles = 0
        self._sensor_fault_logged = False          # log once per fault episode
        self.SENSOR_FAULT_CYCLES = 2        # cycles before assuming sensor failure

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
    
    # -----------------------------------------------------------------
    #  SAFETY HELPERS
    # -----------------------------------------------------------------
    def _update_emergency_override(self, do_reading: float | None):
        """Rules 2 & 3 - Emergency low-DO hysteresis override.
        
        Trigger at < 4.0 mg/L, recover only at >= 4.5 mg/L.
        Works regardless of online/offline state.
        """
        if do_reading is None:
            return  # can't evaluate without a reading
        if do_reading < self.EMERGENCY_DO_LOW and not self.emergency_override:
            self.emergency_override = True
            self._emergency_override_logged = False  # allow one CRITICAL log
            logger.critical(
                f"EMERGENCY OVERRIDE ACTIVATED - DO {do_reading:.2f} mg/L < {self.EMERGENCY_DO_LOW} mg/L  "
                f"-> forcing VFD to {config.FIS_MAX_POWER}%"
            )
        elif do_reading >= self.EMERGENCY_DO_HIGH and self.emergency_override:
            self.emergency_override = False
            self._emergency_override_logged = False
            logger.info(
                f"Emergency override CLEARED - DO {do_reading:.2f} mg/L >= {self.EMERGENCY_DO_HIGH} mg/L  "
                f"-> returning to normal control"
            )

    def _apply_emergency_speed(self, do_setpoint: float, do_reading: float):
        """Force VFD to max power during emergency override and log to DB."""
        speed = float(config.FIS_MAX_POWER)
        self.vanatron.vfd.setSpeed(speed)
        current_error = do_setpoint - do_reading
        self.db.insert_record(
            do_setpoint=do_setpoint, do_reading=do_reading,
            error=current_error, delta_error=0.0,
            vfd_speed=speed, mode='emergency', state='on'
        )
        # Log once per emergency episode, then DEBUG for ongoing cycles
        if not self._emergency_override_logged:
            logger.warning(
                f"Emergency Override active - Speed: {speed:.0f}%, DO: {do_reading:.2f}, "
                f"Setpoint: {do_setpoint:.2f}"
            )
            self._emergency_override_logged = True
        else:
            logger.debug(
                f"Emergency Override ongoing - Speed: {speed:.0f}%, DO: {do_reading:.2f}"
            )

    def _apply_sensor_fault_speed(self, do_setpoint: float):
        """Rule 4 - sensor fault: force 100% unless manual override."""
        speed = float(config.FIS_MAX_POWER)
        self.vanatron.vfd.setSpeed(speed)
        self.db.insert_record(
            do_setpoint=do_setpoint, do_reading=-1.0,
            error=0.0, delta_error=0.0,
            vfd_speed=speed, mode='sensor_fault', state='on'
        )
        # Log CRITICAL once per fault episode, then DEBUG for ongoing cycles
        if not self._sensor_fault_logged:
            logger.critical(
                f"SENSOR FAULT FAILSAFE - {self.null_do_cycles} null cycles, "
                f"forcing VFD to {speed:.0f}%"
            )
            self._sensor_fault_logged = True
        else:
            logger.debug(
                f"Sensor fault ongoing - cycle {self.null_do_cycles}, VFD at {speed:.0f}%"
            )

    # -----------------------------------------------------------------
    #  CONTROL LOOP (rewritten with safety rules)
    # -----------------------------------------------------------------
    def control_loop(self):
        """Thread for control system with industrial fail-safe rules.
        
        Safety rules enforced:
          1. API loss → maintain last-known mode (manual keeps speed, auto keeps FIS).
          2. DO < 4.0 mg/L → emergency 100%%.
          3. Hysteresis: stay 100%% until DO >= 4.5 mg/L.
          4. >3 null DO cycles → assume sensor fault → 100%% (yields to manual).
        """
        logger.info("Starting Control System Thread...")
        
        # Initial cleanup
        self.db.cleanup_old_records(30)
        
        # Initialize from last database record if exists
        self._initialize_control_state()

        # ── Wait for the first valid DO reading from the data_acquisition thread ──
        logger.info("Waiting for initial DO reading to start control loop...")
        while self.running and not self._initial_do_ready.wait(timeout=1.0):
            pass

        if not self.running:
            logger.info("Service stopped before initial DO reading was available. Exiting control loop.")
            return
        
        logger.info("Initial DO reading acquired. Starting control loop with safety rules.")
        
        while self.running:
            try:
                cycle_start = time.time()
                
                # ---- Rule 1: API fetch with fallback to last-known settings ----
                settings = self.api.get_control_settings()
                api_offline = settings is None
                
                if api_offline:
                    # Log only once per offline transition to keep logs clean
                    if not self._api_offline_logged:
                        logger.warning(
                            "API unreachable – using last-known settings: "
                            f"state={self.last_api_state}, mode={self.last_api_mode}"
                        )
                        self._api_offline_logged = True
                    state = self.last_api_state
                    mode = self.last_api_mode
                    do_setpoint = self.last_api_do_setpoint
                    manual_speed = self.last_api_manual_speed
                else:
                    if self._api_offline_logged:
                        logger.info("API connection restored – using live settings")
                        self._api_offline_logged = False
                    state = settings.get('state', 'off')
                    mode = settings.get('mode', 'manual')
                    do_setpoint = float(settings.get('do_set_point', 5.0))
                    manual_speed = float(settings.get('power_set_point', 50.0))
                    # Cache for next offline cycle
                    self.last_api_state = state
                    self.last_api_mode = mode
                    self.last_api_do_setpoint = do_setpoint
                    self.last_api_manual_speed = manual_speed
                    self.control_status = mode if state == 'on' else None
                
                # ---- Get current DO reading (from data_acquisition_loop thread) ----
                # Do NOT call _read_generic_sensors() here — the data thread
                # already does that.  Calling it again blocks the control loop
                # for 60-90 s when the sensor is offline (3×3 retries).
                with self.do_reading_lock:
                    do_reading = self.latest_do_reading
                
                # ---- Rules 2 & 3: Emergency DO hysteresis ----
                self._update_emergency_override(do_reading)
                
                # ---- Rule 4: Sensor fault counter ----
                if do_reading is None:
                    self.null_do_cycles += 1
                    if self.null_do_cycles <= self.SENSOR_FAULT_CYCLES:
                        logger.warning(
                            f"No DO reading (cycle {self.null_do_cycles}/{self.SENSOR_FAULT_CYCLES}), "
                            f"skipping control cycle"
                        )
                        time.sleep(self.control_interval)
                        continue
                    else:
                        # > SENSOR_FAULT_CYCLES missed → assume sensor failure
                        if mode == 'manual':
                            # Rule 4 yields to manual – technician has on-site control
                            logger.warning(
                                f"Sensor fault ({self.null_do_cycles} null cycles) but mode=manual "
                                f"→ technician override, keeping manual speed {manual_speed:.1f}%%"
                            )
                            self.vanatron.vfd.setSpeed(
                                max(config.FIS_MIN_POWER, min(config.FIS_MAX_POWER, manual_speed))
                            )
                            time.sleep(self.control_interval)
                            continue
                        else:
                            # Auto or any non-manual → protect biomass at 100%%
                            if state == 'on':
                                self._apply_sensor_fault_speed(do_setpoint)
                            time.sleep(self.control_interval)
                            continue
                else:
                    self.null_do_cycles = 0  # reset on valid reading
                    self._sensor_fault_logged = False  # allow re-logging if fault recurs
                
                # ---- Detect state/mode changes ----
                state_changed = self.control_state['previous_state'] != state
                mode_changed = self.control_state['previous_mode'] != mode
                
                if state_changed:
                    logger.info(f"State changed: {self.control_state['previous_state']} -> {state}")
                    self._handle_state_change(state, mode, do_setpoint, do_reading)
                    self.control_state['previous_state'] = state
                
                if mode_changed and state == 'on':
                    logger.info(f"Mode changed: {self.control_state['previous_mode']} -> {mode}")
                    self._handle_mode_change(mode, do_setpoint, do_reading)
                    self.control_state['previous_mode'] = mode
                
                # ---- Execute control logic ----
                if state == 'off':
                    self._handle_off_state(do_setpoint, do_reading)
                elif state == 'on':
                    # Rules 2 & 3 take priority over normal control
                    if self.emergency_override:
                        self._apply_emergency_speed(do_setpoint, do_reading)
                    elif mode == 'auto':
                        self._control_auto_mode(do_setpoint, do_reading)
                    elif mode == 'manual':
                        self._control_manual_mode(manual_speed, do_setpoint, do_reading)
                
                # Update last control time
                self.control_state['last_control_time'] = time.time()
                
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
        """Execute auto control mode using FIS with proper delta_error handling.
        
        NOTE: Emergency override is checked BEFORE this method is called.
        """
        for attempt in range(3):
            try:
                current_error = setpoint - reading
                
                # Calculate delta_error safely
                if self.control_state['previous_error'] is None or not self.control_state['control_initialized']:
                    delta_error = 0.0
                    logger.info(f"Auto Control (FIRST RUN): Using delta_error = 0.0 (initialized)")
                else:
                    if self.control_state['last_control_time'] is not None:
                        time_gap = time.time() - self.control_state['last_control_time']
                        if time_gap > config.CONTROL_LOOP_AUTO_INTERVAL * 3:
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
        """Execute manual control mode.
        
        NOTE: Emergency override is checked BEFORE this method is called.
        """
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

                raw_suhu = self.vanatron.do_sensor.read('suhu')
                if raw_suhu is not None:
                    suhu = round(raw_suhu, 2)  # Assuming sensor gives value in tenths of °C
                    self.api.upload_water_temperature(suhu)
                    logger.debug(f"Water Temp (DO Sensor): {suhu} °C")

                raw_do = self.vanatron.do_sensor.read('dissolvedOxygen')
                if raw_do is not None:
                    do = round(raw_do / 10.0, 2)  # Assuming sensor gives value in tenths of mg/L
                    with self.do_reading_lock:
                        self.latest_do_reading = do  # Calibration offset
                    self._initial_do_ready.set()  # Signal that we have a valid DO reading
                    self.api.upload_dissolved_oxygen(do)
                    logger.debug(f"Dissolved Oxygen: {do} mg/L")
                    break
            except Exception as e:
                logger.warning(f"Error reading generic sensors (attempt {attempt+1}): {e}")
                time.sleep(1 + attempt)
        else:
            # All retries exhausted - mark sensor as offline so control loop
            # can count null cycles and trigger the sensor-fault failsafe.
            with self.do_reading_lock:
                self.latest_do_reading = None
            logger.warning("DO sensor read failed after 3 attempts - reading cleared")
    
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