import time
from vanatronCenter import VanatronCenter

if __name__ == "__main__":
    
    vanatron = VanatronCenter(port='/dev/ttyUSB0')
    
    vanatron.addVFD('vfd1', 10)

    vanatron.addVanatronNode('node1', 12)

    vanatron.addWeatherStation('ws1', '2385e72b9106446885e72b9106546878', 'IJEPAR14')
    
    vanatron.addGenericSensor('sensor1', 11)
    vanatron.sensor1.addRegister('radiasi', 28672, 'holding', 1)

    vanatron.addGenericSensor('sensor2', 13)
    vanatron.sensor2.addRegister('suhu_rtd', 28673, 'holding', 1)

    try:
        # Update Data Buffer VFD dan Weather Station
        vanatron.vfd1.updateBuffer()
        time.sleep(0.1)
        # vanatron.ws1.updateBuffer()

        # Kontrol dan Monitoring VFD
        print("\n--- Kontrol dan Monitoring VFD---")
        vanatron.vfd1.setSpeed(20.0)
        time.sleep(0.1)
        vanatron.vfd1.runForward()
        time.sleep(5)
        vanatron.vfd1.setSpeed(40.0)
        time.sleep(10)
        vanatron.vfd1.setSpeed(60.0)
        time.sleep(1)
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

        # # Monitoring Vanatron Node
        # print("\n--- Monitoring Vanatron Node ---")
        # do = vanatron.node1.getDissolvedOxygenValue()
        # time.sleep(0.1)
        # suhu = vanatron.node1.getTemperature(1)
        # time.sleep(0.1)
        # print(f"Dissolved Oxygen: {do} ml/g")
        # print(f"Suhu Channel 1: {suhu} C")

        #  # Monitoring Sensor Generik Pyranometer
        # print("\n--- Monitoring Sensor Generik ---")
        # radiasi = vanatron.sensor1.read('radiasi')
        # print(f"Radiasi: {radiasi} W/m")

        # # Monitoring Sensor Generik RTD
        # print("\n--- Monitoring Sensor Generik RTD ---")
        # suhu_rtd = vanatron.sensor2.read('suhu_rtd')
        # print(f"Suhu RTD: {suhu_rtd} C")

        #  # Monitoring Weather Station
        # print("\n--- Monitoring WeatherStation ---")
        # humidity = vanatron.ws1.getHumidity()
        # print(f"Humidity: {humidity}")

        time.sleep(20)
        
        # Stop VFD
        vanatron.vfd1.stop()

    except KeyboardInterrupt:
        print("\nProgram dihentikan.")
    finally:
        vanatron.close()
