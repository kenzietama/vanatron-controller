"""API Client for communicating with backend"""
from time import time
import requests
import logging
from typing import Dict, Any, Optional
from config import API_BASE_URL, DEVICE_ID

logger = logging.getLogger(__name__)

class APIClient:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.device_id = DEVICE_ID
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
    
    def _post(self, endpoint: str, data: Dict[str, Any]) -> bool:
        """Generic POST method"""
        url = f"{self.base_url}/{endpoint}/{self.device_id}"
        for attempt in range(3):
            try:
                response = self.session.post(url, json=data, timeout=10)
                response.raise_for_status()
                logger.debug(f"Successfully posted to {endpoint}")
                return True
            except requests.exceptions.RequestException as e:
                logger.error(f"Error posting to {endpoint}: {e}")
                time.sleep(1)
                continue
        else:
            logger.error(f"Failed to post to {endpoint} after 3 attempts")
            return False
    
    def upload_dissolved_oxygen(self, value: float) -> bool:
        """Upload dissolved oxygen reading"""
        return self._post('dissolvedoxygen', {'oksigen_terlarut': value})
    
    def upload_ph(self, value: float) -> bool:
        """Upload pH reading"""
        return self._post('ph', {'pH': value})
    
    def upload_salinity(self, value: float) -> bool:
        """Upload salinity reading"""
        return self._post('salinity', {'salinity': value})
    
    def upload_water_temperature(self, value: float) -> bool:
        """Upload water temperature reading"""
        return self._post('watertemperature', {'water_temperature': value})
    
    def upload_rtd(self, value: float) -> bool:
        """Upload RTD reading"""
        return self._post('rtd', {'suhu_permukaan_photovoltaic': value})
    
    def upload_pyranometer(self, value: float) -> bool:
        """Upload pyranometer reading"""
        return self._post('pyranometer', {'radiasi_matahari': value})
    
    def upload_vfd(self, data: Dict[str, Any]) -> bool:
        """Upload VFD data"""
        return self._post('vfd', data)
    
    def upload_inverter_srne(self, data: Dict[str, Any]) -> bool:
        """Upload Inverter SRNE data"""
        return self._post('InverterSRNE', data)
    
    def upload_weather_station(self, data: Dict[str, Any]) -> bool:
        """Upload Weather Station data"""
        return self._post('ws', data)
    
    def get_control_settings(self) -> Optional[Dict[str, Any]]:
        """Get current control system settings"""
        url = f"{self.base_url}/control"
        for attempt in range(3):
            try:
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                logger.warning(f"Failed to fetch control settings (attempt {attempt + 1}): {e}")
                time.sleep(1 + attempt)
                continue
        else:
            logger.error("Failed to fetch control settings after 3 attempts")
            return None