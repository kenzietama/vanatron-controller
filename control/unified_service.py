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

        # ── Thread-safe data sharing: DO reading ──
        self.do_reading_lock = threading.Lock()
        self.latest_do_reading = None
        self._initial_do_ready = threading.Event()

        # ── Thread-safe data sharing: API state ──
        self.api_state_lock = threading.Lock()
        self.last_api_state = 'off'
        self.last_api_mode = 'manual'
        self.last_api_do_setpoint = 5.0
        self.last_api_manual_speed = 50.0
        self._api_offline_logged = False

        # ── Interrupt trigger: wakes the control loop immediately ──
        self.control_trigger = threading.Event()

        # ── Control state tracking ──
        self.control_state = {
            'previous_error': None,
            'previous_mode': None,
            'previous_state': None,
            'control_initialized': False,
            'last_control_time': None
        }

        self.control_interval = config.CONTROL_LOOP_INTERVAL
        self.control_status = None

        # ── SAFETY STATE ──
        # Rule 2 & 3: Emergency DO hysteresis override
        self.emergency_override = False
        self._emergency_override_logged = False
        self.EMERGENCY_DO_LOW = 4.0
        self.EMERGENCY_DO_HIGH = 4.5

        # Rule 4: Sensor fault
        self.null_do_cycles = 0
        self._sensor_fault_logged = False
        self.SENSOR_FAULT_CYCLES = 2

        # ── Manual heartbeat tracking ──
        self._last_manual_heartbeat = 0.0
        self.MANUAL_HEARTBEAT_INTERVAL = 300.0  # 5 minutes

        logger.info("Unified Service initialized successfully")

    # -----------------------------------------------------------------
    #  DEVICE SETUP
    # -----------------------------------------------------------------
    def _setup_devices(self):
        """Setup all hardware devices"""
        logger.info("Setting up hardware devices...")

        self.vanatron.addVFD('vfd', config.VFD_SLAVE_ID)

        self.vanatron.addGenericSensor('do_sensor', config.DO_SLAVE_ID)
        self.vanatron.do_sensor.addRegister('dissolvedOxygen', 257, 'holding', 1)
        self.vanatron.do_sensor.addRegister('suhu', 256, 'holding', 1)

        logger.info("Hardware devices setup complete")

    # -----------------------------------------------------------------
    #  DATA ACQUISITION THREAD (unchanged intent)
    # -----------------------------------------------------------------
    def data_acquisition_loop(self):
        """Thread for data acquisition and upload"""
        logger.info("Starting Data Acquisition Thread...")

        while self.running:
            try:
                cycle_start = time.time()

                self._read_vfd()
                self._read_generic_sensors()

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
    #  API SYNC THREAD (NEW – polls backend, fires interrupt on change)
    # -----------------------------------------------------------------
    def api_sync_loop(self):
        """Dedicated thread that polls the backend API every API_POLL_INTERVAL.

        On any change to state, mode, manual_speed, or do_setpoint it:
          1. Updates the shared api_state variables under lock.
          2. Sets the control_trigger event to instantly wake the control loop.
          3. For manual-mode or manual-speed changes, sends the VFD command
             immediately for zero-latency UX response.
        """
        logger.info("Starting API Sync Thread...")

        # Local shadow copies for change detection
        prev_state = self.last_api_state
        prev_mode = self.last_api_mode
        prev_speed = self.last_api_manual_speed
        prev_setpoint = self.last_api_do_setpoint

        while self.running:
            try:
                settings = self.api.get_control_settings()

                if settings is None:
                    # API unreachable – log once, keep last-known values
                    if not self._api_offline_logged:
                        with self.api_state_lock:
                            logger.warning(
                                "API unreachable – using last-known settings: "
                                f"state={self.last_api_state}, mode={self.last_api_mode}"
                            )
                        self._api_offline_logged = True
                else:
                    if self._api_offline_logged:
                        logger.info("API connection restored – using live settings")
                        self._api_offline_logged = False

                    new_state = settings.get('state', 'off')
                    new_mode = settings.get('mode', 'manual')
                    new_setpoint = float(settings.get('do_set_point', 5.0))
                    new_speed = float(settings.get('power_set_point', 50.0))

                    # Detect changes
                    changed = (
                        new_state != prev_state
                        or new_mode != prev_mode
                        or new_speed != prev_speed
                        or new_setpoint != prev_setpoint
                    )

                    # ── Zero-latency manual command ──
                    # If the operator just switched to manual OR changed the
                    # speed slider, push the command to the VFD immediately
                    # from this thread so the user sees instant response.
                    manual_speed_changed = (new_speed != prev_speed)
                    switched_to_manual = (new_mode == 'manual' and new_mode != prev_mode)

                    if new_state == 'on' and (switched_to_manual or (new_mode == 'manual' and manual_speed_changed)):
                        clamped = max(config.FIS_MIN_POWER, min(config.FIS_MAX_POWER, new_speed))
                        try:
                            self.vanatron.vfd.setSpeed(clamped)
                            logger.info(
                                f"API Sync: instant VFD speed -> {clamped:.1f}% "
                                f"(manual_speed_changed={manual_speed_changed}, "
                                f"switched_to_manual={switched_to_manual})"
                            )
                        except Exception as e:
                            logger.error(f"API Sync: failed instant VFD command: {e}")

                    # ── Publish new state under lock ──
                    with self.api_state_lock:
                        self.last_api_state = new_state
                        self.last_api_mode = new_mode
                        self.last_api_do_setpoint = new_setpoint
                        self.last_api_manual_speed = new_speed
                        self.control_status = new_mode if new_state == 'on' else None

                    # ── Fire interrupt if anything changed ──
                    if changed:
                        logger.info(
                            f"API Sync: settings changed "
                            f"[state={prev_state}->{new_state}, mode={prev_mode}->{new_mode}, "
                            f"speed={prev_speed}->{new_speed}, setpoint={prev_setpoint}->{new_setpoint}] "
                            f"-> waking control loop"
                        )
                        self.control_trigger.set()

                    # Update shadow copies
                    prev_state = new_state
                    prev_mode = new_mode
                    prev_speed = new_speed
                    prev_setpoint = new_setpoint

            except Exception as e:
                logger.error(f"Error in API sync loop: {e}", exc_info=True)

            # Sleep for the poll interval (interruptible via self.running check)
            for _ in range(int(config.API_POLL_INTERVAL * 10)):
                if not self.running:
                    return
                time.sleep(0.1)

    # -----------------------------------------------------------------
    #  SAFETY HELPERS (unchanged logic)
    # -----------------------------------------------------------------
    def _update_emergency_override(self, do_reading: float | None):
        """Rules 2 & 3 - Emergency low-DO hysteresis override.

        Trigger at < 4.0 mg/L, recover only at >= 4.5 mg/L.
        Works regardless of online/offline state.
        """
        if do_reading is None:
            return
        if do_reading < self.EMERGENCY_DO_LOW and not self.emergency_override:
            self.emergency_override = True
            self._emergency_override_logged = False
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
    #  MAIN CONTROL LOOP (rewritten: no API fetch, event-driven wake)
    # -----------------------------------------------------------------
    def control_loop(self):
        """Thread for control system with industrial fail-safe rules.

        Safety rules enforced:
          1. API loss → maintain last-known mode (handled by api_sync_loop).
          2. DO < 4.0 mg/L → emergency 100%.
          3. Hysteresis: stay 100% until DO >= 4.5 mg/L.
          4. >2 null DO cycles → assume sensor fault → 100% (yields to manual).
        """
        logger.info("Starting Control System Thread...")

        # Initial cleanup
        self.db.cleanup_old_records(30)

        # Initialize from last database record if exists
        self._initialize_control_state()

        # ── Wait for the first valid DO reading ──
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

                # ── Block until trigger OR timeout ──
                # Wakes immediately on api_sync_loop change, otherwise every
                # CONTROL_LOOP_INTERVAL seconds for periodic housekeeping.
                self.control_trigger.wait(timeout=config.CONTROL_LOOP_INTERVAL)
                self.control_trigger.clear()

                # ── Snapshot API state under lock ──
                with self.api_state_lock:
                    state = self.last_api_state
                    mode = self.last_api_mode
                    do_setpoint = self.last_api_do_setpoint
                    manual_speed = self.last_api_manual_speed

                # ── Get current DO reading ──
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
                        continue
                    else:
                        if mode == 'manual':
                            logger.warning(
                                f"Sensor fault ({self.null_do_cycles} null cycles) but mode=manual "
                                f"→ technician override, keeping manual speed {manual_speed:.1f}%"
                            )
                            self.vanatron.vfd.setSpeed(
                                max(config.FIS_MIN_POWER, min(config.FIS_MAX_POWER, manual_speed))
                            )
                            continue
                        else:
                            if state == 'on':
                                self._apply_sensor_fault_speed(do_setpoint)
                            continue
                else:
                    self.null_do_cycles = 0
                    self._sensor_fault_logged = False

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
                    if self.emergency_override:
                        self._apply_emergency_speed(do_setpoint, do_reading)
                    elif mode == 'auto':
                        self._control_auto_mode(do_setpoint, do_reading)
                    elif mode == 'manual':
                        self._control_manual_mode(manual_speed, do_setpoint, do_reading)

                # Update last control time
                self.control_state['last_control_time'] = time.time()

                elapsed = time.time() - cycle_start
                if elapsed > config.CONTROL_LOOP_INTERVAL:
                    logger.warning(f"Control cycle took {elapsed:.2f}s")

            except Exception as e:
                logger.error(f"Error in control loop: {e}", exc_info=True)
                time.sleep(config.CONTROL_LOOP_INTERVAL)

    # -----------------------------------------------------------------
    #  CONTROL STATE INITIALIZATION
    # -----------------------------------------------------------------
    def _initialize_control_state(self):
        """Initialize control state from last database record"""
        try:
            last_record = self.db.get_last_record()

            if last_record and last_record['state'] == 'on' and last_record['mode'] == 'auto':
                self.control_state['previous_error'] = last_record['error']
                self.control_state['previous_mode'] = last_record['mode']
                self.control_state['previous_state'] = last_record['state']
                self.control_state['control_initialized'] = True

                self.control_interval = config.CONTROL_LOOP_INTERVAL

                logger.info(f"Initialized control state from database: "
                            f"previous_error={last_record['error']:.2f}, "
                            f"mode={last_record['mode']}, state={last_record['state']}")
            else:
                self.control_state['previous_error'] = None
                self.control_state['previous_mode'] = None
                self.control_state['previous_state'] = None
                self.control_state['control_initialized'] = False

                self.control_interval = config.CONTROL_LOOP_INTERVAL

                logger.info("Starting control system with fresh state (no valid previous record)")

        except Exception as e:
            logger.error(f"Error initializing control state: {e}")
            self.control_state['previous_error'] = None
            self.control_state['control_initialized'] = False
            self.control_interval = config.CONTROL_LOOP_INTERVAL

    # -----------------------------------------------------------------
    #  STATE / MODE CHANGE HANDLERS
    # -----------------------------------------------------------------
    def _handle_state_change(self, new_state, mode, do_setpoint, do_reading):
        """Handle state transitions (on/off)"""
        if new_state == 'on':
            self.vanatron.vfd.runForward()
            time.sleep(0.5)

            if mode == 'auto':
                current_error = do_setpoint - do_reading
                self.control_state['previous_error'] = current_error
                self.control_state['control_initialized'] = True
                logger.info(f"State ON: Initialized previous_error = {current_error:.2f}")
        else:
            self.vanatron.vfd.stop()
            self.control_state['previous_error'] = None
            self.control_state['control_initialized'] = False
            self._last_manual_heartbeat = 0.0
            logger.info("State OFF: Reset control state")

    def _handle_mode_change(self, new_mode, do_setpoint, do_reading):
        """Handle mode transitions (manual/auto)"""
        if new_mode == 'auto':
            current_error = do_setpoint - do_reading
            self.control_state['previous_error'] = current_error
            self.control_state['control_initialized'] = True
            self._last_manual_heartbeat = 0.0
            logger.info(f"Mode changed to AUTO: Initialized previous_error = {current_error:.2f}")
        else:
            self.control_state['previous_error'] = None
            self.control_state['control_initialized'] = False
            self._last_manual_heartbeat = 0.0
            logger.info("Mode changed to MANUAL: Reset control state")

    # -----------------------------------------------------------------
    #  AUTO CONTROL MODE (unchanged core logic)
    # -----------------------------------------------------------------
    def _control_auto_mode(self, setpoint, reading):
        """Execute auto control mode using FIS with proper delta_error handling.

        NOTE: Emergency override is checked BEFORE this method is called.
        """
        for attempt in range(3):
            try:
                current_error = setpoint - reading

                if self.control_state['previous_error'] is None or not self.control_state['control_initialized']:
                    delta_error = 0.0
                    logger.info(f"Auto Control (FIRST RUN): Using delta_error = 0.0 (initialized)")
                else:
                    if self.control_state['last_control_time'] is not None:
                        time_gap = time.time() - self.control_state['last_control_time']
                        if time_gap >= config.CONTROL_LOOP_INTERVAL * 3:
                            logger.warning(f"Large time gap detected ({time_gap:.1f}s), resetting delta_error")
                            delta_error = 0.0
                        else:
                            delta_error = current_error - self.control_state['previous_error']
                    else:
                        delta_error = current_error - self.control_state['previous_error']

                self.control_state['previous_error'] = current_error
                self.control_state['control_initialized'] = True

                speed = self.fis.calculate_speed(current_error, delta_error)

                self.vanatron.vfd.setSpeed(speed)

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

    # -----------------------------------------------------------------
    #  MANUAL CONTROL MODE (refactored: logging + 5-min heartbeat)
    # -----------------------------------------------------------------
    def _control_manual_mode(self, manual_speed, setpoint, reading):
        """Execute manual control mode.

        The api_sync_loop already pushes speed to the VFD instantly on
        slider changes.  This method's primary duties are:
          1. Log the current state to the local database.
          2. Upload telemetry to the API.
          3. Send a redundant VFD setSpeed command every 5 minutes as a
             safety heartbeat (guards against transient comms glitches).

        NOTE: Emergency override is checked BEFORE this method is called.
        """
        for attempt in range(3):
            try:
                current_error = setpoint - reading

                if self.control_state['previous_error'] is not None:
                    delta_error = current_error - self.control_state['previous_error']
                else:
                    delta_error = 0.0

                self.control_state['previous_error'] = current_error

                speed = max(config.FIS_MIN_POWER, min(config.FIS_MAX_POWER, manual_speed))

                # ── 5-minute safety heartbeat ──
                now = time.time()
                if now - self._last_manual_heartbeat >= self.MANUAL_HEARTBEAT_INTERVAL:
                    self.vanatron.vfd.setSpeed(speed)
                    self._last_manual_heartbeat = now
                    logger.info(f"Manual heartbeat: redundant setSpeed({speed:.1f}%) sent")

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

    # -----------------------------------------------------------------
    #  OFF STATE HANDLER (unchanged)
    # -----------------------------------------------------------------
    def _handle_off_state(self, setpoint, reading):
        """Handle OFF state"""
        try:
            current_error = setpoint - reading
            delta_error = 0.0

            self.db.insert_record(
                do_setpoint=setpoint,
                do_reading=reading,
                error=current_error,
                delta_error=delta_error,
                vfd_speed=0.0,
                mode='off',
                state='off'
            )

            logger.debug(f"System OFF - Reading: {reading:.2f}, Error: {current_error:.2f}")
        except Exception as e:
            logger.error(f"Error handling OFF state: {e}")

    # -----------------------------------------------------------------
    #  DATA READERS (unchanged)
    # -----------------------------------------------------------------
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

        except Exception as e:
            logger.error(f"Error reading Vanatron Node: {e}")

    def _read_vfd(self):
        """Read and upload VFD data"""
        for attempt in range(3):
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
                logger.warning(f"VFD read failed (attempt {attempt + 1}): {e}")
                time.sleep(1 + attempt)
        else:
            logger.error("Failed to read VFD after 3 attempts")

    def _read_generic_sensors(self):
        """Read and upload generic sensors"""
        for attempt in range(3):
            try:
                raw_suhu = self.vanatron.do_sensor.read('suhu')
                if raw_suhu is not None:
                    suhu = round(raw_suhu, 2)
                    self.api.upload_water_temperature(suhu)
                    logger.debug(f"Water Temp (DO Sensor): {suhu} °C")

                raw_do = self.vanatron.do_sensor.read('dissolvedOxygen')
                if raw_do is not None:
                    do = round(raw_do / 10.0, 2)
                    with self.do_reading_lock:
                        self.latest_do_reading = do
                    self._initial_do_ready.set()
                    self.api.upload_dissolved_oxygen(do)
                    logger.debug(f"Dissolved Oxygen: {do} mg/L")
                    break
            except Exception as e:
                logger.warning(f"Error reading generic sensors (attempt {attempt + 1}): {e}")
                time.sleep(1 + attempt)
        else:
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

    # -----------------------------------------------------------------
    #  SERVICE LIFECYCLE
    # -----------------------------------------------------------------
    def run(self):
        """Start all threads"""
        logger.info("Starting Vanatron Service...")

        data_thread = threading.Thread(target=self.data_acquisition_loop, name="DataAcquisition")
        control_thread = threading.Thread(target=self.control_loop, name="ControlSystem")
        api_thread = threading.Thread(target=self.api_sync_loop, name="APISync")

        data_thread.daemon = True
        control_thread.daemon = True
        api_thread.daemon = True

        data_thread.start()
        api_thread.start()
        control_thread.start()

        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Received shutdown signal")
            self.running = False

            data_thread.join(timeout=5)
            control_thread.join(timeout=5)
            api_thread.join(timeout=5)

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