# test/runVFD.py

import time
from vanatronCenter import VanatronCenter   # assuming this is in the root (control/)

class runVFD:
    def __init__(self):
        #self.vanatron = VanatronCenter(port='COM5')
        self.vanatron = VanatronCenter(port='/dev/ttyUSB0')
        self.vanatron.addVFD('vfd1', 10)

    def run(self):
        try:
            print("\n--- Kontrol dan Monitoring VFD---")
            self.vanatron.vfd1.stop()
            time.sleep(0.1)
            self.vanatron.vfd1.reset()
            time.sleep(0.1)
            self.vanatron.vfd1.setSpeed(20.0)
            time.sleep(0.1)
            self.vanatron.vfd1.runForward()
            time.sleep(5)
            self.vanatron.vfd1.updateBuffer()
            time.sleep(0.1)
            setting = self.vanatron.vfd1.getCurrentSetFrequency()
            frequensi = self.vanatron.vfd1.getRunningFrequency()
            tegangan = self.vanatron.vfd1.getOutputVoltage()
            arus = self.vanatron.vfd1.getOutputCurrent()
            daya = self.vanatron.vfd1.getOutputPower()
            print(f"Settingan Kecepatan: {setting} %")
            print(f"Frequensi: {frequensi} Hz")
            print(f"Tegangan: {tegangan} Volt")
            print(f"Arus: {arus} Ampere")
            print(f"Daya: {daya} Watt")
            time.sleep(0.1)
            
            # self.vanatron.vfd1.stop()  # uncomment when needed

        except KeyboardInterrupt:
            print("\nProgram dihentikan.")
        finally:
            self.vanatron.close()

if __name__ == "__main__":
    runner = runVFD()
    runner.run()
