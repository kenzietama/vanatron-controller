import time
from vanatronCenter import VanatronCenter

if __name__ == "__main__":
    
    vanatron = VanatronCenter(port='/dev/ttyUSB0')
    
    vanatron.addVFD('vfd1', 10)

    
    try:
        print("\n--- Kontrol dan Monitoring VFD---")
        vanatron.vfd1.setSpeed(20.0)
        time.sleep(0.1)
        vanatron.vfd1.runForward()
        time.sleep(5)
        vanatron.vfd1.updateBuffer()
        time.sleep(0.1)
        frequensi = vanatron.vfd1.getRunningFrequency()
        tegangan = vanatron.vfd1.getOutputVoltage()
        arus = vanatron.vfd1.getOutputCurrent()
        daya = vanatron.vfd1.getOutputPower()
        print(f"Frequensi: {frequensi} Hz")
        print(f"Tegangan: {tegangan} Volt")
        print(f"Arus: {arus} Ampere")
        print(f"Daya: {daya} Watt")
        time.sleep(0.1)
        
        # Stop VFD
        # vanatron.vfd1.stop()

    except KeyboardInterrupt:
        print("\nProgram dihentikan.")
    finally:
        vanatron.close()
