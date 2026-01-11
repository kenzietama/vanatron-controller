import time
import requests
from vanatronCenter import VanatronCenter

API_BASE = "http://localhost"
CONTROL_URL = f"{API_BASE}/api/control/"
VFD_POST_URL = f"{API_BASE}/api/vfd/A"
POLL_INTERVAL = 3
REQUEST_TIMEOUT = 5
VFD_NAME = "vfd1"
VFD_SLAVE_ID = 10
VFD_PORT = "/dev/ttyUSB0"

def fetch_control():
    try:
        response = requests.get(CONTROL_URL, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        print(f"[WARN] Failed to fetch control settings: {exc}")
        return None


def post_vfd_snapshot(payload):
    try:
        requests.post(VFD_POST_URL, json=payload, timeout=REQUEST_TIMEOUT)
    except requests.RequestException as exc:
        print(f"[WARN] Failed to send VFD snapshot: {exc}")


def handle_control(vfd, control_doc):
    state = control_doc.get("state")
    mode = control_doc.get("mode")
    power_set_point = control_doc.get("power_set_point")

    if state == "on" and mode == "manual" and power_set_point is not None:
        print(f"[INFO] Setting VFD speed to {power_set_point}% (manual/on)")
        vfd.setSpeed(float(power_set_point))
        time.sleep(0.1)
        vfd.runForward()
        time.sleep(0.1)
    elif state == "off":
        print("[INFO] Control state off → stopping VFD")
        vfd.stop()

    vfd.updateBuffer()
    time.sleep(0.1)

    snapshot = {
        "running_frequency": vfd.getRunningFrequency(),
        "set_frequency": float(power_set_point or 0),
        "output_voltage": vfd.getOutputVoltage(),
        "output_current": vfd.getOutputCurrent(),
        "output_power": vfd.getOutputPower(),
        "deviceId": "A"
    }
    print(f"[INFO] Posting VFD snapshot: {snapshot}")
    post_vfd_snapshot(snapshot)


def main():
    vanatron = VanatronCenter(port=VFD_PORT)
    vanatron.addVFD(VFD_NAME, VFD_SLAVE_ID)

    try:
        while True:
            control_doc = fetch_control()
            if control_doc:
                handle_control(vanatron.vfd1, control_doc)
            time.sleep(POLL_INTERVAL)
    except KeyboardInterrupt:
        print("\n[INFO] Stopping controller loop")
    finally:
        vanatron.vfd1.stop()
        vanatron.close()


if __name__ == "__main__":
    main()