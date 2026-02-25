"""API Client for communicating with backend – with circuit-breaker pattern.

When the backend becomes unreachable the client enters an *offline* state
and stops hammering every call with 3×10 s retries.  Instead it probes
connectivity every ``PROBE_INTERVAL`` seconds with a single short-timeout
request.  This keeps logs clean and the control loop responsive.
"""
from time import time
import time as _time
import requests
import logging
from typing import Dict, Any, Optional
from config import API_BASE_URL, DEVICE_ID

logger = logging.getLogger(__name__)

# ── tunables ────────────────────────────────────────────────────────
_ONLINE_TIMEOUT  = 10     # seconds – normal request timeout
_PROBE_TIMEOUT   = 3      # seconds – quick connectivity check
_PROBE_INTERVAL  = 15     # seconds – how often to probe when offline
_MAX_RETRIES     = 2      # retries per call when online


class APIClient:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.device_id = DEVICE_ID
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

        # ── circuit-breaker state ──
        self._online: bool = True
        self._last_probe_time: float = 0.0          # epoch
        self._offline_logged: bool = False           # suppress repeated logs
        self._consecutive_failures: int = 0

    # ----------------------------------------------------------------
    #  Internal helpers
    # ----------------------------------------------------------------
    def _is_available(self) -> bool:
        """Return True if we believe the backend is reachable.

        When offline, probe at most once every ``_PROBE_INTERVAL`` seconds
        so the control / data loops are never blocked for long.
        """
        if self._online:
            return True

        now = time()
        if now - self._last_probe_time < _PROBE_INTERVAL:
            return False                              # still in cool-down

        # ── quick probe ──
        self._last_probe_time = now
        try:
            resp = self.session.get(
                f"{self.base_url}/control",
                timeout=_PROBE_TIMEOUT,
            )
            resp.raise_for_status()
            self._mark_online()
            return True
        except requests.exceptions.RequestException:
            return False

    def _mark_online(self):
        if not self._online:
            logger.info("API backend is back ONLINE – resuming normal operation")
        self._online = True
        self._offline_logged = False
        self._consecutive_failures = 0

    def _mark_offline(self):
        self._consecutive_failures += 1
        if self._online:
            # first failure after being online
            self._online = False
            self._last_probe_time = time()
        if not self._offline_logged:
            logger.warning(
                "API backend OFFLINE – uploads paused, control loop using "
                "last-known settings.  Will probe every %ds.", _PROBE_INTERVAL
            )
            self._offline_logged = True

    # ----------------------------------------------------------------
    #  POST (upload telemetry)
    # ----------------------------------------------------------------
    def _post(self, endpoint: str, data: Dict[str, Any]) -> bool:
        """POST data to the backend.  Skips entirely when offline."""
        if not self._is_available():
            return False

        url = f"{self.base_url}/{endpoint}/{self.device_id}"
        for attempt in range(_MAX_RETRIES):
            try:
                response = self.session.post(url, json=data, timeout=_ONLINE_TIMEOUT)
                response.raise_for_status()
                self._mark_online()
                logger.debug(f"Successfully posted to {endpoint}")
                return True
            except requests.exceptions.RequestException as e:
                if attempt < _MAX_RETRIES - 1:
                    logger.debug(f"Retrying POST {endpoint} (attempt {attempt+1}): {e}")
                    _time.sleep(0.5)
                else:
                    logger.warning(f"POST {endpoint} failed after {_MAX_RETRIES} attempts: {e}")
                    self._mark_offline()
        return False

    # ----------------------------------------------------------------
    #  GET (control settings)
    # ----------------------------------------------------------------
    def get_control_settings(self) -> Optional[Dict[str, Any]]:
        """Fetch control settings.  Returns None promptly when offline."""
        if not self._is_available():
            return None

        url = f"{self.base_url}/control"
        try:
            response = self.session.get(url, timeout=_ONLINE_TIMEOUT)
            response.raise_for_status()
            self._mark_online()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.debug(f"GET control settings failed: {e}")
            self._mark_offline()
            return None

    # ----------------------------------------------------------------
    #  Public query
    # ----------------------------------------------------------------
    @property
    def is_online(self) -> bool:
        return self._online

    # ----------------------------------------------------------------
    #  Upload helpers (unchanged signatures)
    # ----------------------------------------------------------------
    def upload_dissolved_oxygen(self, value: float) -> bool:
        return self._post('dissolvedoxygen', {'oksigen_terlarut': value})

    def upload_ph(self, value: float) -> bool:
        return self._post('ph', {'pH': value})

    def upload_salinity(self, value: float) -> bool:
        return self._post('salinity', {'salinity': value})

    def upload_water_temperature(self, value: float) -> bool:
        return self._post('watertemperature', {'water_temperature': value})

    def upload_rtd(self, value: float) -> bool:
        return self._post('rtd', {'suhu_permukaan_photovoltaic': value})

    def upload_pyranometer(self, value: float) -> bool:
        return self._post('pyranometer', {'radiasi_matahari': value})

    def upload_vfd(self, data: Dict[str, Any]) -> bool:
        return self._post('vfd', data)

    def upload_inverter_srne(self, data: Dict[str, Any]) -> bool:
        return self._post('InverterSRNE', data)

    def upload_weather_station(self, data: Dict[str, Any]) -> bool:
        return self._post('ws', data)