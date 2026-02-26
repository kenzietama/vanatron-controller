"""Configuration for Vanatron System"""
import os

## API Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5000/api')
# API_BASE_URL = os.getenv('API_BASE_URL', 'https://test.vanatron.danuaf.cloud/api')
DEVICE_ID = 'A'

## Serial Port Configuration
SERIAL_PORT = os.getenv('SERIAL_PORT', 'COM11')

## Weather Station Configuration
WEATHER_API_KEY = '2385e72b9106446885e72b9106546878'
WEATHER_STATION_ID = 'IJEPAR14'

## Slave IDs for Modbus Devices
# VANATRON_NODE_SLAVE_ID = 12
VFD_SLAVE_ID = 10
DO_SLAVE_ID = 55
# PYRANOMETER_SLAVE_ID = 11
# RTD_SLAVE_ID = 13
# SALINITY_SLAVE_ID = 14
# PH_SENSOR_SLAVE_ID = 15

## Data Acquisition Settings
DATA_ACQUISITION_INTERVAL = 3  # seconds
WEATHER_UPDATE_INTERVAL = 3  # 5 minutes

## Control System Settings
CONTROL_LOOP_INTERVAL = 300  # seconds – unified interval for both auto and manual
API_POLL_INTERVAL = 10  # seconds – how often the API sync thread polls the backend
FIS_MIN_POWER = 50  # minimum power percentage
FIS_MAX_POWER = 100  # maximum power percentage

## Database
# DATABASE_PATH = '/opt/vanatron/control_history.db'
DATABASE_PATH = 'K:/Capstone/ControlSystem/vanatron-controller/control/control_history.db'

## Logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
# LOG_FILE = '/var/log/vanatron/system.log'
LOG_FILE = 'K:/Capstone/ControlSystem/vanatron-controller/control/system.log'