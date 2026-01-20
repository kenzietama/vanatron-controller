#test/stop VFD.py

import time
from vanatronCenter import VanatronCenter

class stopVFD:
    def __init__(self):
        self.vanatron = VanatronCenter(port='COM5')
        # self.vanatron = VanatronCenter(port='/dev/ttyUSB0')
        self.vanatron.addVFD('vfd1', 10)

    def stop(self):
        try:
            self.vanatron.vfd1.updateBuffer()
            frequensi = self.vanatron.vfd1.getRunningFrequency()
            tegangan = self.vanatron.vfd1.getOutputVoltage()
            arus = self.vanatron.vfd1.getOutputCurrent()
            daya = self.vanatron.vfd1.getOutputPower()
            print(f"Frekuensi: {frequensi} Hz")
            print(f"Tegangan: {tegangan} Volt")
            print(f"Arus: {arus} Ampere")
            print(f"Daya: {daya} Watt")
            time.sleep(0.1)

            self.vanatron.vfd1.stop()
            time.sleep(0.1)

            self.vanatron.vfd1.reset()
            time.sleep(0.1)
            
            # Stop VFD
            self.vanatron.vfd1.stop()

            
            # self.vanatron.vfd1.stop()  # uncomment when needed

        except KeyboardInterrupt:
            print("\nProgram dihentikan.")
        finally:
            self.vanatron.close()

if __name__ == "__main__":
    runner = stopVFD()
    runner.stop()
