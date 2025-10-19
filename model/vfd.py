import time
from controller.modbusController import ModbusController

class VFD:
    _REG_CMD = 8192
    _REG_FREQ_SETPOINT = 4096

    _REG_MONITOR_START = 28672  # 7000H
    _REG_MONITOR_COUNT = 66

    _CMD_RUN_FWD = 1
    _CMD_RUN_BKW = 3
    _CMD_STOP = 5
    _CMD_RESET = 9

    def __init__(self, name: str, slaveID: int, modbusController: ModbusController):
        self.name = name
        self.slaveID = slaveID
        self.modbus = modbusController
        self.dataBuffer = {}

    def setSpeed(self, speed: float) -> bool:
        if not 0.0 <= speed <= 100.0: 
            return False
        
        register_value = int(speed * 100)
        
        print(f"Setting {self.name} (ID: {self.slaveID}) speed to {speed}%...")
        success_freq = self.modbus.writeSingleRegister(
            registerAddress=self._REG_FREQ_SETPOINT, value=register_value, slaveID=self.slaveID
        )

        return success_freq

    def runForward(self) -> bool:
        print(f"Running Forward {self.name} (ID: {self.slaveID})...")
        return self.modbus.writeSingleRegister(
            registerAddress=self._REG_CMD, value=self._CMD_RUN_FWD, slaveID=self.slaveID
        )
    
    def runBackward(self) -> bool:
        print(f"Running Backward {self.name} (ID: {self.slaveID})...")
        return self.modbus.writeSingleRegister(
            registerAddress=self._REG_CMD, value=self._CMD_RUN_BKW, slaveID=self.slaveID
        )

    def stop(self) -> bool:
        print(f"Stopping {self.name} (ID: {self.slaveID})...")
        return self.modbus.writeSingleRegister(
            registerAddress=self._REG_CMD, value=self._CMD_STOP, slaveID=self.slaveID
        )

    def updateBuffer(self) -> bool:
        try:
            allValues = self.modbus.readHoldingRegisters(
                self._REG_MONITOR_START, self._REG_MONITOR_COUNT, self.slaveID
            )

            if allValues and len(allValues) == self._REG_MONITOR_COUNT:
                def val(addr_hex):
                    return allValues[addr_hex - 0x7000]

                self.dataBuffer = {
                    'frekuensi_berjalan_hz': val(0x7000) / 100.0,
                    'frekuensi_setelan_hz': val(0x7001) / 100.0,
                    'tegangan_bus_dc_v': val(0x7002) / 10.0,
                    'tegangan_output_v': val(0x7003),
                    'arus_output_a': val(0x7004) / 100.0,
                    'daya_output_kw': val(0x7005) / 10.0,
                    'torsi_output_persen': val(0x7006) / 10.0,
                    'status_input_digital': val(0x7007),
                    'status_output_digital': val(0x7008),
                    'tegangan_ai1_v': val(0x7009) / 100.0,
                    'nilai_ai2_va_ma': val(0x700A) / 100.0,
                    'tegangan_ai3_v': val(0x700B) / 100.0,
                    'nilai_penghitung': val(0x700C),
                    'nilai_panjang': val(0x700D),
                    'kecepatan_beban': val(0x700E),
                    'setelan_pid': val(0x700F),
                    'feedback_pid': val(0x7010),
                    'tahapan_simple_plc': val(0x7011),
                    'frekuensi_input_pulsa_khz': val(0x7012) / 100.0,
                    'kecepatan_feedback_hz': val(0x7013) / 100.0,
                    'sisa_waktu_berjalan_min': val(0x7014) / 10.0,
                    'ai1_sebelum_koreksi_v': val(0x7015) / 1000.0,
                    'ai2_sebelum_koreksi_va_ma': val(0x7016) / 100.0,
                    'ai3_sebelum_koreksi_v': val(0x7017) / 1000.0,
                    'kecepatan_linear_m_min': val(0x7018),
                    'waktu_akumulatif_power_on_min': val(0x7019),
                    'waktu_akumulatif_berjalan_min': val(0x701A) / 10.0,
                    'frekuensi_input_pulsa_hz': val(0x701B),
                    'nilai_setelan_komunikasi_persen': val(0x701C) / 100.0,
                    'kecepatan_feedback_encoder_hz': val(0x701D) / 100.0,
                    'frekuensi_utama_x_hz': val(0x701E) / 100.0,
                    'frekuensi_bantu_y_hz': val(0x701F) / 100.0,
                    'alamat_register_apapun': val(0x7020),
                    'posisi_rotor_motor_sinkron_derajat': val(0x7021) / 10.0,
                    'suhu_motor_c': val(0x7022),
                    'torsi_target_persen': val(0x7023) / 10.0,
                    'posisi_resolver': val(0x7024),
                    'sudut_faktor_daya': val(0x7025) / 10.0,
                    'posisi_abz': val(0x7026),
                    'tegangan_target_vf_sep_v': val(0x7027),
                    'tegangan_output_vf_sep_v': val(0x7028),
                    'tampilan_visual_status_x': val(0x7029),
                    'tampilan_visual_status_do': val(0x702A),
                    'tampilan_fungsi_status_x_1': val(0x702B),
                    'tampilan_fungsi_status_x_2': val(0x702C),
                    'informasi_fault': val(0x702D),
                    'hitungan_fase_z': val(0x703A),
                    'frekuensi_setelan_persen': val(0x703B) / 100.0,
                    'frekuensi_berjalan_persen': val(0x703C) / 100.0,
                    'status_running_vfd': val(0x703D),
                    'kode_fault_saat_ini': val(0x703E),
                    'nilai_terkirim_p2p_persen': val(0x703F) / 100.0,
                    'nilai_diterima_p2p_persen': val(0x7040) / 100.0,
                    'batas_torsi_atas_persen': val(0x7041) / 10.0
                }
                return True
            return False
        except Exception:
            return False

    def _get(self, key): return self.dataBuffer.get(key)

    def getRunningFrequency(self): return self._get('frekuensi_berjalan_hz')
    def getSetFrequency(self): return self._get('frekuensi_setelan_hz')
    def getBusVoltage(self): return self._get('tegangan_bus_dc_v')
    def getOutputVoltage(self): return self._get('tegangan_output_v')
    def getOutputCurrent(self): return self._get('arus_output_a')
    def getOutputPower(self): return self._get('daya_output_kw')
    def getOutputTorque(self): return self._get('torsi_output_persen')
    def getXState(self): return self._get('status_input_digital')
    def getDOState(self): return self._get('status_output_digital')
    def getAI1Voltage(self): return self._get('tegangan_ai1_v')
    def getAI2VoltagePerCurrent(self): return self._get('nilai_ai2_va_ma')
    def getAI3Voltage(self): return self._get('tegangan_ai3_v')
    def getCountValue(self): return self._get('nilai_penghitung')
    def getLengthValue(self): return self._get('nilai_panjang')
    def getLoadSpeed(self): return self._get('kecepatan_beban')
    def getPIDSetting(self): return self._get('setelan_pid')
    def getPIDFeedback(self): return self._get('feedback_pid')
    def getPLCStage(self): return self._get('tahapan_simple_plc')
    def getInputPulseFrequency(self): return self._get('frekuensi_input_pulsa_khz')
    def getSpeedFeedback(self): return self._get('kecepatan_feedback_hz')
    def getRemainingRunningTime(self): return self._get('sisa_waktu_berjalan_min')
    def getAI1VoltageBeforeCorrection(self): return self._get('ai1_sebelum_koreksi_v')
    def getAI2VoltageBeforeCorrection(self): return self._get('ai2_sebelum_koreksi_va_ma')
    def getAI3VoltageBeforeCorrection(self): return self._get('ai3_sebelum_koreksi_v')
    def getLinearSpeed(self): return self._get('kecepatan_linear_m_min')
    def getAccumulativePowerOnTime(self): return self._get('waktu_akumulatif_power_on_min')
    def getAccumulativeRunningTime(self): return self._get('waktu_akumulatif_berjalan_min')
    def getPulseInputFrequency(self): return self._get('frekuensi_input_pulsa_hz')
    def getCommunicationSettingValue(self): return self._get('nilai_setelan_komunikasi_persen')
    def getEncoderFeedbackSpeed(self): return self._get('kecepatan_feedback_encoder_hz')
    def getMainFrequencyX(self): return self._get('frekuensi_utama_x_hz')
    def getAuxillaryFrequencyY(self): return self._get('frekuensi_bantu_y_hz')
    def getAnyRegisterAddressValue(self): return self._get('alamat_register_apapun')
    def getSynchronousMotorRotorPosition(self): return self._get('posisi_rotor_motor_sinkron_derajat')
    def getMotorTemperature(self): return self._get('suhu_motor_c')
    def getTargetTorque(self): return self._get('torsi_target_persen')
    def getResolverPosition(self): return self._get('posisi_resolver')
    def getPowerFactorAngle(self): return self._get('sudut_faktor_daya')
    def getABZPosition(self): return self._get('posisi_abz')
    def getTargetVoltageVFSeparation(self): return self._get('tegangan_target_vf_sep_v')
    def getOutputVoltageVFSeparation(self): return self._get('tegangan_output_vf_sep_v')
    def getXStateVisualDisplay(self): return self._get('tampilan_visual_status_x')
    def getDOStateVisualDisplay(self): return self._get('tampilan_visual_status_do')
    def getXFunctionStateVisualDisplay1(self): return self._get('tampilan_fungsi_status_x_1')
    def getXFunctionStateVisualDisplay2(self): return self._get('tampilan_fungsi_status_x_2')
    def getFaultInformation(self): return self._get('informasi_fault')
    def getPhaseZCounting(self): return self._get('hitungan_fase_z')
    def getCurrentSetFrequency(self): return self._get('frekuensi_setelan_persen')
    def getCurrentRunningFrequency(self): return self._get('frekuensi_berjalan_persen')
    def getACDriveRunningState(self): return self._get('status_running_vfd')
    def getCurrentFaultCode(self): return self._get('kode_fault_saat_ini')
    def getSendValueP2P(self): return self._get('nilai_terkirim_p2p_persen')
    def getReceivedValueP2P(self): return self._get('nilai_diterima_p2p_persen')
    def getTorqueUpperLimit(self): return self._get('batas_torsi_atas_persen')