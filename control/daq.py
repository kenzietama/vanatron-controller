import logging
import time

import config
from vanatronCenter import VanatronCenter
from api.api_client import APIClient

logger = logging.getLogger(__name__)


class DAQ:
    def __init__(self):
        logger.info("Initializing Data Acquisition Service...")

        self.vanatron = VanatronCenter(port=config.SERIAL_PORT)
        self.apiA = APIClient(device_id='A')
        self.apiB = APIClient(device_id='B')
        self._setup_devices()

        logger.info("DAQ Service initialized successfully")

    def _setup_devices(self):
        """Setup all hardware devices"""
        logger.info("Setting up hardware devices...")

        self.vanatron.addVanatronNode('node1', config.VANATRON_NODE1_SLAVE_ID)
        self.vanatron.addVanatronNode('node2', config.VANATRON_NODE2_SLAVE_ID)

        logger.info("Hardware devices setup complete")

    def dataAquisition(self):
        """Jalankan satu siklus akuisisi semua node"""
        cycle_start = time.time()

        self._read_node(self.vanatron.node1, "node1")
        time.sleep(0.1)
        self._read_node(self.vanatron.node2, "node2")
        time.sleep(0.1)

        elapsed = time.time() - cycle_start
        sleep_time = max(0, config.DATA_ACQUISITION_INTERVAL - elapsed)

        if sleep_time > 0:
            time.sleep(sleep_time)
        else:
            logger.warning(f"Data acquisition cycle took {elapsed:.2f}s")

    def _read_node(self, node, name: str):
        """Baca dan upload sensor untuk satu Vanatron Node"""
        try:
            # do_value = node.getDissolvedOxygenValue()
            # if do_value is not None:
            #     if name == "node1":
            #         self.apiA.upload_dissolved_oxygen(do_value)
            #     else:
            #         self.apiB.upload_dissolved_oxygen(do_value)
            #     logger.debug(f"[{name}] DO: {do_value} mg/L")

            # time.sleep(0.1)

            water_temp = node.getTemperature(1)
            if water_temp is not None:
                if name == "node1":
                    self.apiA.upload_water_temperature(water_temp)
                    print(f"API A - Water Temp: {water_temp} °C")
                else:
                    self.apiB.upload_water_temperature(water_temp)
                    print(f"API B - Water Temp: {water_temp} °C")
                logger.debug(f"[{name}] Water Temp: {water_temp} °C")

            time.sleep(0.1)

            # ph_value = node.getPHValue()
            # if ph_value is not None:
            #     if name == "node1":
            #         self.apiA.upload_ph(ph_value)
            #     else:
            #         self.apiB.upload_ph(ph_value)
            #     logger.debug(f"[{name}] pH: {ph_value}")

            # time.sleep(0.1)

        except Exception as e:
            logger.error(f"Error reading Vanatron Node {name}: {e}")


if __name__ == "__main__":
    logging.basicConfig(level=getattr(logging, config.LOG_LEVEL))

    daq = DAQ()
    try:
        while True:
            daq.dataAquisition()
    except KeyboardInterrupt:
        logger.info("Stopping DAQ service...")
