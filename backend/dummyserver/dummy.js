// Function to generate a random number between 50 and 100
function getRandomNumber() {
    return Math.floor(Math.random() * (100 - 50 + 1)) + 50;
}

// Function to send data to the API DO
async function sendDataToAPIDOA() {
    const apiUrl = 'http://localhost:5000/api/dissolvedoxygen/A'; // Replace with your API endpoint
    const randomNumber = getRandomNumber();
    const data = {
        oksigen_terlarut: randomNumber
    }; // Replace with the data you want to send

    try {
        const response = await fetch(apiUrl, {
            method: 'POST', // or 'GET', 'PUT', 'DELETE', etc.
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        // console.log('API Response:', responseData);
    } catch (error) {
        // console.error('Error sending data to API:', error);
    }
}

async function sendDataToAPIDOC() {
    const apiUrl = 'http://localhost:5000/api/dissolvedoxygen/C'; // Replace with your API endpoint
    const randomNumber = getRandomNumber();
    const data = {
        oksigen_terlarut: randomNumber
    }; // Replace with the data you want to send

    try {
        const response = await fetch(apiUrl, {
            method: 'POST', // or 'GET', 'PUT', 'DELETE', etc.
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        // console.log('API Response:', responseData);
    } catch (error) {
        // console.error('Error sending data to API:', error);
    }
}

// Function to send data to the API Inverter Solis
async function sendDataToAPISolis() {
    const apiUrl = 'http://localhost:5000/api/InverterSolis/A'; // Replace with your API endpoint
    const randomNumber = getRandomNumber();
    const data = {
        active_power: randomNumber,
        total_energy: randomNumber,
        this_month_energy: randomNumber,
        last_month_energy: randomNumber,
        today_energy: randomNumber,
        last_day_energy: randomNumber,
        this_year_energy: randomNumber,
        last_year_energy: randomNumber,
        dc_voltage: randomNumber,
        dc_current: randomNumber,
        inverter_temperature: randomNumber,
        ac_frequency: randomNumber
    }; // Replace with the data you want to send

    try {
        const response = await fetch(apiUrl, {
            method: 'POST', // or 'GET', 'PUT', 'DELETE', etc.
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        // console.log('API Response:', responseData);
    } catch (error) {
        // console.error('Error sending data to API:', error);
    }
}

// Function to send data to the API Inverter SRNE
async function sendDataToAPISRNE() {
    const apiUrl = 'http://localhost:5000/api/InverterSRNE/A'; // Replace with your API endpoint
    const randomNumber = getRandomNumber();
    const data = {
        inverter_power: randomNumber,
        battery_level: randomNumber,
        battery_last_equalization: randomNumber,
        battery_voltage: randomNumber,
        pv_voltage: randomNumber,
        
        pv_current: randomNumber,
        pv_power: randomNumber,
        charge_power: randomNumber,
        battery_charge_state: randomNumber,
        inverter_operation: randomNumber,
        
        inverter_current: randomNumber,
        main_charge_current: randomNumber,
        pv_charge_current: randomNumber,
        pv_daily_consumption: randomNumber,
        battery_charge_daily: randomNumber,
        
        battery_discharge_daily: randomNumber,
        load_daily_consumption: randomNumber,
        inverter_uptime: randomNumber,
        pv_generated: randomNumber,
        main_load_power_daily: randomNumber,
        
        dc_dc_temperature: randomNumber,
        dc_ac_temperature: randomNumber,
        translator_temperature: randomNumber,
        load_ratio: randomNumber
        
    }; // Replace with the data you want to send

    try {
        const response = await fetch(apiUrl, {
            method: 'POST', // or 'GET', 'PUT', 'DELETE', etc.
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        // console.log('API Response:', responseData);
    } catch (error) {
        // console.error('Error sending data to API:', error);
    }
}

// Function to send data to the API WS
async function sendDataToAPIWS() {
    const apiUrl = 'http://localhost:5000/api/ws/A'; // Replace with your API endpoint
    const randomNumber = getRandomNumber();
    const data = {
        indoor_temperature: randomNumber,
        indoor_humidity: randomNumber,
        barometric_pressure: randomNumber,
        wind_direction: randomNumber,
        rain_fall: randomNumber,
        
        wind_speed: randomNumber,
        dew_point: randomNumber,
        outdoor_humidity: randomNumber,
        outdoor_temperature: randomNumber,
        uv_index: randomNumber,
        
        light: randomNumber
    }; // Replace with the data you want to send

    try {
        const response = await fetch(apiUrl, {
            method: 'POST', // or 'GET', 'PUT', 'DELETE', etc.
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        // console.log('API Response:', responseData);
    } catch (error) {
        // console.error('Error sending data to API:', error);
    }
}

// Function to send data to the API Pyranometer
async function sendDataToAPIPyranometer() {
    const apiUrl = 'http://localhost:5000/api/pyranometer/A'; // Replace with your API endpoint
    const randomNumber = getRandomNumber();
    const data = {
        radiasi_matahari : randomNumber
    }; // Replace with the data you want to send

    try {
        const response = await fetch(apiUrl, {
            method: 'POST', // or 'GET', 'PUT', 'DELETE', etc.
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        // console.log('API Response:', responseData);
    } catch (error) {
        // console.error('Error sending data to API:', error);
    }
}

// Function to send data to the API RTD
async function sendDataToAPIRTD() {
    const apiUrl = 'http://localhost:5000/api/rtd/A'; // Replace with your API endpoint
    const randomNumber = getRandomNumber();
    const data = {
        suhu_permukaan_photovoltaic : randomNumber
    }; // Replace with the data you want to send

    try {
        const response = await fetch(apiUrl, {
            method: 'POST', // or 'GET', 'PUT', 'DELETE', etc.
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        // console.log('API Response:', responseData);
    } catch (error) {
        // console.error('Error sending data to API:', error);
    }
}

// Function to send data to the API VFD
async function sendDataToAPIVFD() {
    const apiUrl = 'http://localhost:5000/api/vfd/A'; // Replace with your API endpoint
    const randomNumber = getRandomNumber();
    const data = {
        running_frequency: randomNumber,
        set_frequency: randomNumber,
        bus_voltage: randomNumber,
        output_voltage: randomNumber,
        output_current: randomNumber,

        output_power: randomNumber,
        output_torque: randomNumber,
        x_state: randomNumber,
        do_state: randomNumber,
        ai1_voltage_before_correction: randomNumber,

        ai2_voltage_before_correction: randomNumber,
        ai3_voltage_before_correction: randomNumber,
        linear_speed: randomNumber,
        accumulative_poweron_time: randomNumber,
        accumulative_running_time: randomNumber,

        pulse_input_frequency: randomNumber,
        communication_setting_value: randomNumber,
        encoder_feedback_speed: randomNumber,
        main_frequency_x: randomNumber,
        aux_frequency_y: randomNumber,

        synchronous_motor_rotor_pos: randomNumber,
        motor_temperature: randomNumber,
        target_torque: randomNumber,
        resolver_position: randomNumber,
        power_factor_angle: randomNumber,

        abz_position: randomNumber,
        target_voltage_upon_vf_separation: randomNumber,
        output_voltage_upon_vf_separation: randomNumber,
        x_state_visual_display: randomNumber,
        do_state_visual_display: randomNumber,

        x_function_state_visual_display_1: randomNumber,
        x_function_state_visual_display_2: randomNumber,
        fault_information: randomNumber,
        phase_z_counting: randomNumber,
        current_set_frequency: randomNumber,

        current_running_frequency: randomNumber,
        ac_drive_running_state: randomNumber,
        current_fault_code: randomNumber,
        sent_value_of_point_communication: randomNumber,
        received_value_of_point_communication: randomNumber,

        torque_upper_limit: randomNumber

    }; // Replace with the data you want to send

    try {
        const response = await fetch(apiUrl, {
            method: 'POST', // or 'GET', 'PUT', 'DELETE', etc.
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();
        // console.log('API Response:', responseData);
    } catch (error) {
        // console.error('Error sending data to API:', error);
    }
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
