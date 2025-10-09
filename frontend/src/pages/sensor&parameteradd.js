import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../component/header";
import axios from "axios";

const SensorParameterAdd = () => {
  const [sensorOptions, setSensorOptions] = useState([]);
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [parameterOptions, setParameterOptions] = useState([]);
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    displayName: "",
    sensor: "",
    device: "",
    parameter: "",
    unit: "",
    socket: "",
    minValue: "",
    maxValue: "",
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
        socket: prev.sensor + prev.device,
      }));
    }
  }, [set]);

  const handleSensorChange = async (e) => {
    setFormData({ ...formData, sensor: e.target.value });
    try {
      const device = await axios.get(
        `http://localhost:5000/api/sensors/${e.target.value}/devices`
      );
      const parameter = await axios.get(
        `http://localhost:5000/api/parameters/${e.target.value}`
      );
      setDeviceOptions(device.data);
      setParameterOptions(parameter.data);
    } catch (error) {
      console.error("Error fetching devices or parameters:", error);
    }
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

      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="bg-white shadow-lg rounded-lg border border-gray-300 p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header Form */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-0">
                Add Sensor & Parameter
              </h2>
              <div className="flex flex-col sm:flex-row sm:space-x-4 w-full sm:w-auto space-y-2 sm:space-y-0">
                <button
                  type="submit"
                  className="w-full sm:w-36 px-6 py-2 text-sm bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/sensor&parameter")}
                  className="w-full sm:w-36 px-6 py-2 text-sm bg-white border border-blue-500 text-blue-500 font-semibold rounded-full hover:bg-blue-600 hover:text-white"
                >
                  Back
                </button>
              </div>
            </div>

            {/* Field Group */}
            {[
              {
                label: "Sensor",
                type: "select",
                value: formData.sensor,
                onChange: handleSensorChange,
                options: sensorOptions.map((o) => o.name),
              },
              {
                label: "Device",
                type: "select",
                value: formData.device,
                onChange: (e) =>
                  setFormData({ ...formData, device: e.target.value }),
                options: deviceOptions,
              },
              {
                label: "Parameter",
                type: "select",
                value: formData.parameter,
                onChange: (e) =>
                  setFormData({ ...formData, parameter: e.target.value }),
                options: parameterOptions,
              },
              {
                label: "Display Name",
                type: "text",
                value: formData.displayName,
                placeholder: "Enter Name",
                onChange: (e) =>
                  setFormData({ ...formData, displayName: e.target.value }),
              },
              {
                label: "Unit",
                type: "text",
                value: formData.unit,
                placeholder: "Enter Unit",
                onChange: (e) =>
                  setFormData({ ...formData, unit: e.target.value }),
              },
              {
                label: "Min Value",
                type: "number",
                value: formData.minValue,
                placeholder: "Enter Minimum Value",
                onChange: (e) =>
                  setFormData({ ...formData, minValue: e.target.value }),
              },
              {
                label: "Max Value",
                type: "number",
                value: formData.maxValue,
                placeholder: "Enter Maximum Value",
                onChange: (e) =>
                  setFormData({ ...formData, maxValue: e.target.value }),
              },
            ].map((field, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center sm:space-x-4"
              >
                <label className="w-full sm:w-1/4 text-sm font-medium text-gray-700 mb-1 sm:mb-0">
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    className="w-full sm:w-3/4 h-10 px-4 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="" disabled>
                      Select {field.label}
                    </option>
                    {field.options.map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={field.value}
                    placeholder={field.placeholder}
                    onChange={field.onChange}
                    className="w-full sm:w-3/4 h-10 px-4 border border-gray-300 rounded-lg"
                    required
                  />
                )}
              </div>
            ))}

            {errorMessage && (
              <div className="mt-4 text-red-500 text-center">{errorMessage}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SensorParameterAdd;
