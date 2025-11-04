import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../component/header";

const EditSensorParameter = () => {
  const { _id } = useParams();
  const [sensorOptions, setSensorOptions] = useState([]);
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [parameterOptions, setParameterOptions] = useState([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    displayName: "",
    sensor: "",
    device: "",
    parameter: "",
    unit: "",
    minValue: "",
    maxValue: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch data berdasarkan ID
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/displayitems/${_id}`);
        const data = response.data;
        setFormData({
          sensor: data.sensor,
          device: data.device,
          parameter: data.parameter,
          displayName: data.displayName,
          unit: data.unit,
          minValue: data.minValue || "",
          maxValue: data.maxValue || "",
        });
        setError("");
      } catch (error) {
        console.error("Error fetching parameter data:", error);
        setError("Failed to fetch parameter data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [_id]);

  // Fetch opsi dropdown
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const sensorResponse = await axios.get(process.env.REACT_APP_BACKEND_URL + "/api/sensors");
        setSensorOptions(sensorResponse.data);
        if (formData.sensor) {
          const deviceResponse = await axios.get(process.env.REACT_APP_BACKEND_URL + `/api/sensors/${formData.sensor}/devices`);
          const parameterResponse = await axios.get(process.env.REACT_APP_BACKEND_URL + `/api/parameters/${formData.sensor}`);
          setDeviceOptions(deviceResponse.data);
          setParameterOptions(parameterResponse.data);
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };
    fetchOptions();
  }, [formData.sensor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(process.env.REACT_APP_BACKEND_URL + `/api/displayitems/${_id}`, formData);
      navigate("/sensor&parameter");
    } catch (error) {
      console.error("Error updating parameter:", error);
      setError("Failed to update parameter.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9F4F4] flex-col">
      <Header
        pageName="Edit Sensor & Parameter"
        databaseName="Database / Sensor & Parameter"
        notifications={0}
      />

      <div className="flex-1 p-4 overflow-y-auto sm:p-6">
        <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-lg sm:p-6">
          {loading ? (
            <p className="text-center text-gray-600">Loading...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Header */}
              <div className="flex flex-col items-start justify-between mb-6 sm:flex-row sm:items-center">
                <h2 className="mb-3 text-xl font-semibold text-gray-800 sm:text-2xl sm:mb-0">
                  Edit Sensor & Parameter
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

              {/* Fields */}
              {[
                {
                  label: "Sensor",
                  name: "sensor",
                  type: "select",
                  value: formData.sensor,
                  options: sensorOptions.map((s) => s.name),
                },
                {
                  label: "Device",
                  name: "device",
                  type: "select",
                  value: formData.device,
                  options: deviceOptions,
                },
                {
                  label: "Parameter",
                  name: "parameter",
                  type: "select",
                  value: formData.parameter,
                  options: parameterOptions,
                },
                {
                  label: "Display Name",
                  name: "displayName",
                  type: "text",
                  value: formData.displayName,
                  placeholder: "Enter Name",
                },
                {
                  label: "Unit",
                  name: "unit",
                  type: "text",
                  value: formData.unit,
                  placeholder: "Enter Unit",
                },
                {
                  label: "Min Value",
                  name: "minValue",
                  type: "number",
                  value: formData.minValue,
                  placeholder: "Enter Minimum Value",
                },
                {
                  label: "Max Value",
                  name: "maxValue",
                  type: "number",
                  value: formData.maxValue,
                  placeholder: "Enter Maximum Value",
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
                      name={field.name}
                      value={field.value}
                      onChange={handleChange}
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
                      name={field.name}
                      value={field.value}
                      placeholder={field.placeholder}
                      onChange={handleChange}
                      className="w-full h-10 px-4 border border-gray-300 rounded-lg sm:w-3/4"
                      required
                    />
                  )}
                </div>
              ))}

              {error && (
                <div className="mt-4 text-center text-red-500">{error}</div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditSensorParameter;
