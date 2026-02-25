import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../component/header";
import axios from "axios";

const SensorParameterAdd = () => {
  const [sensorOptions, setSensorOptions] = useState([]);
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [parameterOptions, setParameterOptions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

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
        const response = await axios.get(
          process.env.REACT_APP_BACKEND_URL + "/api/sensors"
        );
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
    const sensor = e.target.value;
    setFormData({ ...formData, sensor });

    try {
      const device = await axios.get(
        process.env.REACT_APP_BACKEND_URL + `/api/sensors/${sensor}/devices`
      );
      const parameter = await axios.get(
        process.env.REACT_APP_BACKEND_URL + `/api/parameters/${sensor}`
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
      await axios.post(
        process.env.REACT_APP_BACKEND_URL + "/api/displayitems",
        formData
      );
      navigate("/sensor&parameter");
    } catch (error) {
      if (error?.response?.status === 409) {
        return setErrorMessage("Item already existed!");
      }
      console.error("Error adding sensor & parameter:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9F4F4]">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <Header pageName="Add Sensors & Parameters" />

        <div className="flex justify-center flex-1 p-6">
          <div className="w-full max-w-5xl p-6 bg-white border border-gray-300 rounded-lg shadow-lg">
            {/* ================= TOP HEADER + BUTTONS (DESKTOP ONLY) ================= */}
            <div className="items-center justify-between hidden gap-4 mb-6 md:flex">
              <h2 className="text-2xl font-semibold text-gray-800">
                Add Sensors & Parameters
              </h2>
              <div className="flex gap-3">
                <button
                  type="submit"
                  form="sensor-parameter-form"
                  className="w-36 px-6 py-2 text-sm font-semibold text-white bg-blue-500 rounded-full hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/sensor&parameter")}
                  className="w-36 px-6 py-2 text-sm font-semibold text-blue-500 bg-white border border-blue-500 rounded-full hover:bg-blue-600 hover:text-white"
                >
                  Back
                </button>
              </div>
            </div>

            {/* ================= TITLE (MOBILE & TABLET) ================= */}
            <h2 className="block mb-6 text-2xl font-semibold text-gray-800 md:hidden">
              Add Sensors & Parameters
            </h2>

            {/* ================= FORM ================= */}
            <form
              id="sensor-parameter-form"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
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
                    setFormData({
                      ...formData,
                      displayName: e.target.value,
                    }),
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
                <div className="mt-4 text-center text-red-500">
                  {errorMessage}
                </div>
              )}
            </form>

            {/* ================= BOTTOM BUTTONS (MOBILE & TABLET) ================= */}
            <div className="flex flex-col gap-3 mt-8 md:hidden">
              <button
                type="submit"
                form="sensor-parameter-form"
                className="w-full px-6 py-3 text-sm font-semibold text-white bg-blue-500 rounded-full hover:bg-blue-600"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => navigate("/sensor&parameter")}
                className="w-full px-6 py-3 text-sm font-semibold text-blue-500 bg-white border border-blue-500 rounded-full hover:bg-blue-600 hover:text-white"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorParameterAdd;