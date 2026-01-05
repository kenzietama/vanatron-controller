const DEFAULT_RANGE = { min: 0, max: 100, decimals: 2 };

const PARAMETER_RANGES = {
    // Water quality sensors
    oksigen_terlarut: { min: 4, max: 10, decimals: 2 },
    water_temperature: { min: 18, max: 38, decimals: 1 },
    pH: { min: 6, max: 8, decimals: 2 },
    salinity: { min: 3, max: 30, decimals: 2 },

    // Weather station readings
    indoor_temperature: { min: 18, max: 32, decimals: 1 },
    indoor_humidity: { min: 30, max: 70, decimals: 1 },
    barometric_pressure: { min: 999, max: 1100, decimals: 1 },
    wind_direction: { min: -1, max: 361, isInteger: true },
    rain_fall: { min: -1, max: 50, decimals: 1 },
    wind_speed: { min: 0, max: 10, decimals: 2 },
    dew_point: { min: 10, max: 26, decimals: 1 },
    outdoor_humidity: { min: 25, max: 80, decimals: 1 },
    outdoor_temperature: { min: 18, max: 50, decimals: 1 },
    uv_index: { min: 0, max: 11, decimals: 1 },
    light: { min: 200, max: 2000, decimals: 0 },

    // Pyranometer / RTD
    radiasi_matahari: { min: 0, max: 1200, decimals: 0 },
    suhu_permukaan_photovoltaic: { min: 0, max: 85, decimals: 1 },

    // Inverter Solis metrics
    active_power: { min: 0, max: 4500, decimals: 0 },
    total_energy: { min: 0, max: 500000, decimals: 0 },
    this_month_energy: { min: 0, max: 2000, decimals: 0 },
    last_month_energy: { min: 0, max: 2000, decimals: 0 },
    today_energy: { min: 0, max: 200, decimals: 1 },
    last_day_energy: { min: 0, max: 200, decimals: 1 },
    this_year_energy: { min: 0, max: 50000, decimals: 0 },
    last_year_energy: { min: 0, max: 50000, decimals: 0 },
    dc_voltage: { min: 250, max: 420, decimals: 1 },
    dc_current: { min: 0, max: 15, decimals: 2 },
    inverter_temperature: { min: 20, max: 80, decimals: 1 },
    ac_frequency: { min: 49, max: 61, decimals: 2 },

    // Inverter SRNE metrics
    inverter_power: { min: 0, max: 2600, decimals: 0 },
    battery_level: { min: 10, max: 100, decimals: 1 },
    battery_last_equalization: { min: 0, max: 180, isInteger: true },
    battery_voltage: { min: 44, max: 52, decimals: 2 },
    pv_voltage: { min: 80, max: 130, decimals: 1 },
    pv_current: { min: 0, max: 20, decimals: 2 },
    pv_power: { min: 0, max: 2600, decimals: 0 },
    charge_power: { min: 0, max: 800, decimals: 0 },
    battery_charge_state: { min: 0, max: 100, decimals: 1 },
    inverter_operation: { min: 0, max: 3, isInteger: true },
    inverter_current: { min: 0, max: 12, decimals: 2 },
    main_charge_current: { min: 0, max: 30, decimals: 2 },
    pv_charge_current: { min: 0, max: 25, decimals: 2 },
    pv_daily_consumption: { min: 0, max: 70, decimals: 2 },
    battery_charge_daily: { min: 0, max: 40, decimals: 2 },
    battery_discharge_daily: { min: 0, max: 40, decimals: 2 },
    load_daily_consumption: { min: 0, max: 80, decimals: 2 },
    inverter_uptime: { min: 0, max: 604800, isInteger: true },
    pv_generated: { min: 0, max: 70, decimals: 2 },
    main_load_power_daily: { min: 0, max: 2600, decimals: 0 },
    dc_dc_temperature: { min: 20, max: 90, decimals: 1 },
    dc_ac_temperature: { min: 20, max: 90, decimals: 1 },
    translator_temperature: { min: 20, max: 90, decimals: 1 },
    load_ratio: { min: 200, max: 240, decimals: 1 },

    // VFD metrics
    running_frequency: { min: 0, max: 60, decimals: 2 },
    set_frequency: { min: 0, max: 60, decimals: 2 },
    bus_voltage: { min: 250, max: 420, decimals: 1 },
    output_voltage: { min: 0, max: 400, decimals: 1 },
    output_current: { min: 0, max: 50, decimals: 2 },
    output_power: { min: 0, max: 15000, decimals: 0 },
    output_torque: { min: 0, max: 250, decimals: 1 },
    x_state: { min: 0, max: 1, isInteger: true },
    do_state: { min: 0, max: 1, isInteger: true },
    ai1_voltage_before_correction: { min: 0, max: 10, decimals: 2 },
    ai2_voltage_before_correction: { min: 0, max: 10, decimals: 2 },
    ai3_voltage_before_correction: { min: 0, max: 10, decimals: 2 },
    linear_speed: { min: 0, max: 100, decimals: 2 },
    accumulative_poweron_time: { min: 0, max: 100000, isInteger: true },
    accumulative_running_time: { min: 0, max: 100000, isInteger: true },
    pulse_input_frequency: { min: 0, max: 2000, isInteger: true },
    communication_setting_value: { min: 0, max: 255, isInteger: true },
    encoder_feedback_speed: { min: 0, max: 6000, decimals: 0 },
    main_frequency_x: { min: 0, max: 60, decimals: 2 },
    aux_frequency_y: { min: 0, max: 60, decimals: 2 },
    synchronous_motor_rotor_pos: { min: 0, max: 360, decimals: 1 },
    motor_temperature: { min: 20, max: 120, decimals: 1 },
    target_torque: { min: 0, max: 250, decimals: 1 },
    resolver_position: { min: 0, max: 360, decimals: 1 },
    power_factor_angle: { min: -90, max: 90, decimals: 1 },
    abz_position: { min: 0, max: 360, decimals: 1 },
    target_voltage_upon_vf_separation: { min: 0, max: 400, decimals: 1 },
    output_voltage_upon_vf_separation: { min: 0, max: 400, decimals: 1 },
    x_state_visual_display: { min: 0, max: 10, isInteger: true },
    do_state_visual_display: { min: 0, max: 10, isInteger: true },
    x_function_state_visual_display_1: { min: 0, max: 10, isInteger: true },
    x_function_state_visual_display_2: { min: 0, max: 10, isInteger: true },
    fault_information: { min: 0, max: 999, isInteger: true },
    phase_z_counting: { min: 0, max: 100000, isInteger: true },
    current_set_frequency: { min: 0, max: 60, decimals: 2 },
    current_running_frequency: { min: 0, max: 60, decimals: 2 },
    ac_drive_running_state: { min: 0, max: 3, isInteger: true },
    current_fault_code: { min: 0, max: 50, isInteger: true },
    sent_value_of_point_communication: { min: 0, max: 65535, isInteger: true },
    received_value_of_point_communication: { min: 0, max: 65535, isInteger: true },
    torque_upper_limit: { min: 0, max: 250, decimals: 1 }
};

const PAYLOAD_FIELDS = {
    dissolvedOxygen: ['oksigen_terlarut'],
    inverterSolis: [
        'active_power',
        'total_energy',
        'this_month_energy',
        'last_month_energy',
        'today_energy',
        'last_day_energy',
        'this_year_energy',
        'last_year_energy',
        'dc_voltage',
        'dc_current',
        'inverter_temperature',
        'ac_frequency'
    ],
    inverterSRNE: [
        'inverter_power',
        'battery_level',
        'battery_last_equalization',
        'battery_voltage',
        'pv_voltage',
        'pv_current',
        'pv_power',
        'charge_power',
        'battery_charge_state',
        'inverter_operation',
        'inverter_current',
        'main_charge_current',
        'pv_charge_current',
        'pv_daily_consumption',
        'battery_charge_daily',
        'battery_discharge_daily',
        'load_daily_consumption',
        'inverter_uptime',
        'pv_generated',
        'main_load_power_daily',
        'dc_dc_temperature',
        'dc_ac_temperature',
        'translator_temperature',
        'load_ratio'
    ],
    weatherStation: [
        'indoor_temperature',
        'indoor_humidity',
        'barometric_pressure',
        'wind_direction',
        'rain_fall',
        'wind_speed',
        'dew_point',
        'outdoor_humidity',
        'outdoor_temperature',
        'uv_index',
        'light'
    ],
    pyranometer: ['radiasi_matahari'],
    rtd: ['suhu_permukaan_photovoltaic'],
    vfd: [
        'running_frequency',
        'set_frequency',
        'bus_voltage',
        'output_voltage',
        'output_current',
        'output_power',
        'output_torque',
        'x_state',
        'do_state',
        'ai1_voltage_before_correction',
        'ai2_voltage_before_correction',
        'ai3_voltage_before_correction',
        'linear_speed',
        'accumulative_poweron_time',
        'accumulative_running_time',
        'pulse_input_frequency',
        'communication_setting_value',
        'encoder_feedback_speed',
        'main_frequency_x',
        'aux_frequency_y',
        'synchronous_motor_rotor_pos',
        'motor_temperature',
        'target_torque',
        'resolver_position',
        'power_factor_angle',
        'abz_position',
        'target_voltage_upon_vf_separation',
        'output_voltage_upon_vf_separation',
        'x_state_visual_display',
        'do_state_visual_display',
        'x_function_state_visual_display_1',
        'x_function_state_visual_display_2',
        'fault_information',
        'phase_z_counting',
        'current_set_frequency',
        'current_running_frequency',
        'ac_drive_running_state',
        'current_fault_code',
        'sent_value_of_point_communication',
        'received_value_of_point_communication',
        'torque_upper_limit'
    ]
};

function randomValue(key) {
    const range = PARAMETER_RANGES[key] || DEFAULT_RANGE;
    const { min, max, decimals = 2, isInteger = false } = range;

    if (isInteger) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const value = Math.random() * (max - min) + min;
    return Number(value.toFixed(decimals));
}

function buildPayload(keys = []) {
    return keys.reduce((payload, key) => {
        payload[key] = randomValue(key);
        return payload;
    }, {});
}

async function postData(apiUrl, data) {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        await response.json();
    } catch (error) {
        // console.error('Error sending data to API:', error);
    }
}

// Function to send data to the API DO
async function sendDataToAPIDOA() {
    const apiUrl = 'http://localhost:5000/api/dissolvedoxygen/A';
    const data = buildPayload(PAYLOAD_FIELDS.dissolvedOxygen);
    return postData(apiUrl, data);
}

async function sendDataToAPIDOC() {
    const apiUrl = 'http://localhost:5000/api/dissolvedoxygen/C';
    const data = buildPayload(PAYLOAD_FIELDS.dissolvedOxygen);
    return postData(apiUrl, data);
}

// Function to send data to the API Inverter Solis
async function sendDataToAPISolis() {
    const apiUrl = 'http://localhost:5000/api/InverterSolis/A';
    const data = buildPayload(PAYLOAD_FIELDS.inverterSolis);
    return postData(apiUrl, data);
}

// Function to send data to the API Inverter SRNE
async function sendDataToAPISRNE() {
    const apiUrl = 'http://localhost:5000/api/InverterSRNE/A';
    const data = buildPayload(PAYLOAD_FIELDS.inverterSRNE);
    return postData(apiUrl, data);
}

// Function to send data to the API WS
async function sendDataToAPIWS() {
    const apiUrl = 'http://localhost:5000/api/ws/A';
    const data = buildPayload(PAYLOAD_FIELDS.weatherStation);
    return postData(apiUrl, data);
}

// Function to send data to the API Pyranometer
async function sendDataToAPIPyranometer() {
    const apiUrl = 'http://localhost:5000/api/pyranometer/A';
    const data = buildPayload(PAYLOAD_FIELDS.pyranometer);
    return postData(apiUrl, data);
}

// Function to send data to the API RTD
async function sendDataToAPIRTD() {
    const apiUrl = 'http://localhost:5000/api/rtd/A';
    const data = buildPayload(PAYLOAD_FIELDS.rtd);
    return postData(apiUrl, data);
}

// Function to send data to the API VFD
async function sendDataToAPIVFD() {
    const apiUrl = 'http://localhost:5000/api/vfd/A';
    const data = buildPayload(PAYLOAD_FIELDS.vfd);
    return postData(apiUrl, data);
}

// Set interval to send data every 3 seconds (3000 milliseconds)
setInterval(sendDataToAPIDOA, 3000);
setInterval(sendDataToAPIDOC, 2800);
// setInterval(sendDataToAPISolis, 2900);
setInterval(sendDataToAPISRNE, 2700);
setInterval(sendDataToAPIWS, 2800);
setInterval(sendDataToAPIPyranometer, 2850);
setInterval(sendDataToAPIRTD, 2950);
setInterval(sendDataToAPIVFD, 3100);
