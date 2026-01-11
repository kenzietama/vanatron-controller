import time
import requests
import asyncio
from vanatronCenter import VanatronCenter
from fis.database import db
from fis.fis_controller import fis

API_BASE = "http://localhost"
CONTROL_URL = f"{API_BASE}/api/control/"

# # device endpoints, pakai yang mau dipakai aja
VFD_POST_URL = f"{API_BASE}/api/vfd/A"
DO_POST_URL = f"{API_BASE}/api/do/A"
# WATER_TEMP_POST_URL = f"{API_BASE}/api/watertemperature/A"
# PH_POST_URL = f"{API_BASE}/api/ph/A"
# RTD_POST_URL = f"{API_BASE}/api/rtd/A"
# PYRANOMETER_POST_URL = f"{API_BASE}/api/pyranometer/A"
# WS_POST_URL = f"{API_BASE}/api/ws/A"

DB_PATH = "/opt/vanatron/control_history.db"

POST_INTERVAL = 3
MANUAL_CONTROL_INTERVAL = 3
AUTO_CONTROL_INTERVAL = 600
REQUEST_TIMEOUT = 5

RS485_PORT = "/dev/ttyUSB0"

VFD_NAME = "vfd1"
VFD_SLAVE_ID = 10

VANATRON_NODE_NAME = "node1"
VANATRON_NODE_SLAVE_ID = 12

# fetch setting done
def fetch_settings():
    try:
        response = requests.get(CONTROL_URL, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        print(f"[WARN] Failed to fetch control settings: {exc}")
        return None

# fetch DO reading (generic sensor)
def fetch_do_reading(vanatron_node):
    try:
        do_value = vanatron_node.getDissolvedOxygenValue()
        return do_value
    except Exception as exc:
        print(f"[WARN] Failed to fetch DO reading: {exc}")
        return None

# belum fix
async def post_data(vfd):
    try:
        while True:
            vfd.updateBuffer()
            await asyncio.sleep(0.1)
            payload = {
                "running_frequency": vfd.getRunningFrequency(),
                "set_frequency": vfd.getSetFrequency(),
                "output_voltage": vfd.getOutputVoltage(),
                "output_current": vfd.getOutputCurrent(),
                "output_power": vfd.getOutputPower(),
            }
            requests.post(VFD_POST_URL, json=payload, timeout=REQUEST_TIMEOUT)
            await asyncio.sleep(POST_INTERVAL)
    except requests.RequestException as exc:
        print(f"[WARN] Failed to send readings: {exc}")

# done
async def handle_manual_control(vfd, power_set_point):
    print(f"[INFO] Setting manual VFD speed to {power_set_point}%")
    vfd.setSpeed(float(power_set_point))
    await asyncio.sleep(0.1)
    vfd.runForward()
    await asyncio.sleep(0.1)

# belum fix
async def handle_auto_control(vfd, do_set_point, database, control, reading):
    print(f"[INFO] Setting auto VFD speed with DO Target {do_set_point}mg/L")

    await asyncio.sleep(0.1)
    vfd.runForward()
    await asyncio.sleep(0.1)

def handle_control(vfd, config):
    state = config.get("state")
    mode = config.get("mode")
    power_set_point = config.get("power_set_point")
    do_set_point = config.get("do_set_point")
    vfd.updateBuffer()
    time.sleep(0.1)

    if state == "on" and mode == "manual" and power_set_point is not None:
        asyncio.create_task(handle_manual_control(vfd, power_set_point))
    elif state == "on" and mode == "auto" and do_set_point is not None:
        asyncio.create_task(handle_auto_control(vfd, do_set_point))
        print(f"[INFO] Setting VFD speed to {do_set_point}% (auto/on)")
        vfd.setSpeed(float(do_set_point))
        time.sleep(0.1)
        vfd.runForward()
        time.sleep(0.1)
    elif state == "off":
        print("[INFO] Control state off → stopping VFD")
        vfd.stop()


async def main():
    vanatron = VanatronCenter(port=RS485_PORT)

    # init VFD
    vanatron.addVFD(VFD_NAME, VFD_SLAVE_ID)

    # # init Vanatron Node
    # vanatron.addVanatronNode(VANATRON_NODE_NAME, VANATRON_NODE_SLAVE_ID)


    # # Tambah sensor generik jika perlu
    # vanatron.addGenericSensor('sensor1', 11)
    # vanatron.sensor1.addRegister('radiasi', 28672, 'holding', 1)
    # vanatron.addGenericSensor('sensor2', 13)
    # vanatron.sensor2.addRegister('suhu_rtd', 28673, 'holding', 1)

    # # ini address belum tau ya
    vanatron.addGenericSensor('do_sensor', 14)
    vanatron.do_sensor.addRegister('dissolvedOxygen', 28674, 'holding', 1)

    database = db.ControlHistoryDB(DB_PATH)
    control = fis.FISController()

    try:
        while True:
            config = fetch_settings()
            reading = vanatron.do_sensor.read('dissolvedOxygen')
            if config is not None and reading is not None:
                handle_control(vanatron.vfd1, config, reading, control, database)
            time.sleep(MANUAL_CONTROL_INTERVAL)
    except KeyboardInterrupt:
        print("\n[INFO] Stopping controller loop")
    finally:
        vanatron.vfd1.stop()
        vanatron.close()


if __name__ == "__main__":
    asyncio.run(main())