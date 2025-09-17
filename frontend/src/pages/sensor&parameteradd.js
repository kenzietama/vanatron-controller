import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../component/header";
import axios from "axios";

const SensorParameterAdd = () => {
  const [sensorOptions, setSensorOptions] = useState([]);
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [parameterOptions, setParameterOptions] = useState([]);
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    displayName: "",
    sensor: "",
    device: "",
    parameter: "",
    unit: "",
    socket: "",
    minValue: "",   // ✅ nilai minimum
    maxValue: ""    // ✅ nilai maksimum
  });

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/sensors");
        setSensorOptions(response.data);
      } catch (error) {
        console.error("Error fetching sensors:", error);
      }
    };

    fetchSensors();
  }, []);

  const set = formData.sensor && formData.device;

  useEffect(() => {
    if (set) {
      setFormData((prev) => ({
        ...prev,
        socket: prev.sensor + prev.device
      }));
    }
  }, [set]);

  const handleSensorChange = async (e) => {
    setFormData({ ...formData, sensor: e.target.value });
    try {
      const device = await axios.get(`http://localhost:5000/api/sensors/${e.target.value}/devices`);
      const parameter = await axios.get(`http://localhost:5000/api/parameters/${e.target.value}`);
      setDeviceOptions(device.data);
      setParameterOptions(parameter.data);
    } catch (error) {
      console.error("Error fetching devices or parameters:", error);
    }
  };

  const handleDeviceChange = (e) => {
    setFormData({ ...formData, device: e.target.value });
  };

  const handleParameterChange = (e) => {
    setFormData({ ...formData, parameter: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/displayitems", formData);
      navigate("/sensor&parameter");
    } catch (error) {
      if (error.status === 409) {
        return setErrorMessage("Item already existed!");
      }
      console.error("Error adding sensor & parameter:", error);
    }
  };

  return (
    <div className="flex h-screen bg-[#F9F4F4] flex-col">
      <Header
        pageName="Add Sensor & Parameter"
        databaseName="Database / Sensor & Parameter"
        notifications={0}
      />
      <div className="flex-1 p-6">
        <div className="bg-white shadow-lg rounded-lg border border-gray-300 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Add Sensor & Parameter</h2>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-6 py-2 w-36 text-sm bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={() => navigate("/sensor&parameter")}
                  className="px-6 py-2 w-36 text-sm bg-white border border-blue-500 text-blue-500 font-semibold rounded-full hover:bg-blue-600 hover:text-white"
                >
                  Back
                </button>
              </div>
            </div>

            {/* Sensor */}
            <div className="flex justify-start items-center space-x-4 ml-4">
              <label className="w-1/4 text-sm font-medium text-gray-700">Sensor</label>
              <select
                value={formData.sensor}
                onChange={handleSensorChange}
                className="w-3/4 h-10 px-4 py-1 border border-gray-300 rounded-lg"
                required
              >
                <option value="" disabled>
                  Select Sensor
                </option>
                {sensorOptions.map((option) => (
                  <option key={option._id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Device */}
            <div className="flex justify-start items-center space-x-4 ml-4">
              <label className="w-1/4 text-sm font-medium text-gray-700">Device</label>
              <select
                value={formData.device}
                onChange={handleDeviceChange}
                className="w-3/4 h-10 px-4 py-1 border border-gray-300 rounded-lg"
                required
              >
                <option value="" disabled>
                  Select Device
                </option>
                {deviceOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Parameter */}
            <div className="flex justify-start items-center space-x-4 ml-4">
              <label className="w-1/4 text-sm font-medium text-gray-700">Parameter</label>
              <select
                value={formData.parameter}
                onChange={handleParameterChange}
                className="w-3/4 h-10 px-4 py-1 border border-gray-300 rounded-lg"
                required
              >
                <option value="" disabled>
                  Select Parameter
                </option>
                {parameterOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Display Name */}
            <div className="flex justify-start items-center space-x-4 ml-4">
              <label className="w-1/4 text-sm font-medium text-gray-700">Display Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-3/4 h-10 px-4 py-1 border border-gray-300 rounded-lg"
                placeholder="Enter Name"
                required
              />
            </div>

            {/* Unit */}
            <div className="flex justify-start items-center space-x-4 ml-4">
              <label className="w-1/4 text-sm font-medium text-gray-700">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-3/4 h-10 px-4 py-1 border border-gray-300 rounded-lg"
                placeholder="Enter Unit"
                required
              />
            </div>

            {/* Min Value */}
            <div className="flex justify-start items-center space-x-4 ml-4">
              <label className="w-1/4 text-sm font-medium text-gray-700">Min Value</label>
              <input
                type="number"
                value={formData.minValue}
                onChange={(e) => setFormData({ ...formData, minValue: e.target.value })}
                className="w-3/4 h-10 px-4 py-1 border border-gray-300 rounded-lg"
                placeholder="Enter Minimum Value"
                required
              />
            </div>

            {/* Max Value */}
            <div className="flex justify-start items-center space-x-4 ml-4">
              <label className="w-1/4 text-sm font-medium text-gray-700">Max Value</label>
              <input
                type="number"
                value={formData.maxValue}
                onChange={(e) => setFormData({ ...formData, maxValue: e.target.value })}
                className="w-3/4 h-10 px-4 py-1 border border-gray-300 rounded-lg"
                placeholder="Enter Maximum Value"
                required
              />
            </div>

            {errorMessage && <div className="mt-4 text-red-500 text-center">{errorMessage}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SensorParameterAdd;
