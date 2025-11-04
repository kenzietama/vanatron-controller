import { useState, useEffect } from "react";
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
        const response = await axios.get(process.env.REACT_APP_BACKEND_URL + "/api/sensors");
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
        process.env.REACT_APP_BACKEND_URL + `/api/sensors/${e.target.value}/devices`
      );
      const parameter = await axios.get(
        process.env.REACT_APP_BACKEND_URL + `/api/parameters/${e.target.value}`
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
      await axios.post(process.env.REACT_APP_BACKEND_URL + "/api/displayitems", formData);
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

      <div className="flex-1 p-4 overflow-y-auto sm:p-6">
        <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-lg sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header Form */}
            <div className="flex flex-col items-start justify-between mb-6 sm:flex-row sm:items-center">
              <h2 className="mb-3 text-xl font-semibold text-gray-800 sm:text-2xl sm:mb-0">
                Add Sensor & Parameter
              </h2>
              <div className="flex flex-col w-full space-y-2 sm:flex-row sm:space-x-4 sm:w-auto sm:space-y-0">
                <button
                  type="submit"
                  className="w-full px-6 py-2 text-sm font-semibold text-white bg-blue-500 rounded-full sm:w-36 hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/sensor&parameter")}
                  className="w-full px-6 py-2 text-sm font-semibold text-blue-500 bg-white border border-blue-500 rounded-full sm:w-36 hover:bg-blue-600 hover:text-white"
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
                <label className="w-full mb-1 text-sm font-medium text-gray-700 sm:w-1/4 sm:mb-0">
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    className="w-full h-10 px-4 border border-gray-300 rounded-lg sm:w-3/4"
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
                    className="w-full h-10 px-4 border border-gray-300 rounded-lg sm:w-3/4"
                    required
                  />
                )}
              </div>
            ))}

            {errorMessage && (
              <div className="mt-4 text-center text-red-500">{errorMessage}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SensorParameterAdd;
