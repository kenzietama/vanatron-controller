import time
from vanatronCenter import VanatronCenter

if __name__ == "__main__":
    
    # vanatron = VanatronCenter(port='/dev/ttyUSB0')
    vanatron = VanatronCenter(port='COM5')
    
    vanatron.addVFD('vfd1', 10)

    
    try:
        vanatron.vfd1.updateBuffer()
        frequensi = vanatron.vfd1.getRunningFrequency()
        tegangan = vanatron.vfd1.getOutputVoltage()
        arus = vanatron.vfd1.getOutputCurrent()
        daya = vanatron.vfd1.getOutputPower()
        print(f"Frekuensi: {frequensi} Hz")
        print(f"Tegangan: {tegangan} Volt")
        print(f"Arus: {arus} Ampere")
        print(f"Daya: {daya} Watt")
        time.sleep(0.1)

        vanatron.vfd1.stop()
        time.sleep(0.1)

        vanatron.vfd1.reset()
        time.sleep(0.1)
        
        # Stop VFD
        vanatron.vfd1.stop()

    except KeyboardInterrupt:
        print("\nProgram dihentikan.")
    finally:
        vanatron.close()
