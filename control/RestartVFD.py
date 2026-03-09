import time
from vanatronCenter import VanatronCenter

class RestartVFD:
    def __init__(self):
        # Initialize communication
        self.vanatron = VanatronCenter(port='/dev/ttyUSB0') 
        self.vanatron.addVFD('vfd1', 10)

    def recover_and_run(self):
        try:
            print("Initiating VFD recovery sequence...")
            
            # 1. Update buffer to get the latest state
            self.vanatron.vfd1.updateBuffer()
            time.sleep(0.5)
            
            # 2. Get the last set frequency BEFORE resetting
            last_setting = self.vanatron.vfd1.getCurrentSetFrequency()
            print(f"Captured Last Speed Setting: {last_setting} %")
            
            # 3. Issue STOP command first
            print("Sending STOP command...")
            self.vanatron.vfd1.stop()
            time.sleep(1.0) # Wait for motor to coast/decelerate
            
            # 4. Issue FAULT RESET command
            print("Sending FAULT RESET command...")
            self.vanatron.vfd1.reset()
            time.sleep(1.0) # VFD needs time to clear the error register
            
            # 5. Write the saved frequency
            print(f"Restoring speed to {last_setting}%...")
            # Ensure last_setting is a valid integer and greater than 0
            safe_speed = max(int(last_setting), 30) # Prevent starting at 0%
            self.vanatron.vfd1.setSpeed(safe_speed)
            time.sleep(1.0) # Wait for speed register to update
            
            # 6. Issue RUN command
            print("Sending RUN FORWARD command...")
            self.vanatron.vfd1.runForward()
            time.sleep(1.0)
            
            # 7. Verify Recovery
            self.vanatron.vfd1.updateBuffer()
            current_freq = self.vanatron.vfd1.getRunningFrequency()
            print(f"Recovery Complete. Current Running Frequency: {current_freq} Hz")
            
        except Exception as e:
            print(f"Error during VFD recovery: {e}")
        finally:
            self.vanatron.close()
            print("Serial port closed.")

if __name__ == "__main__":
    runner = RestartVFD()
    runner.recover_and_run()
