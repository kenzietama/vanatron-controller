import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../component/header";

const EditSensorParameter = () => {
  const { _id } = useParams();
  const navigate = useNavigate();

  const [sensorOptions, setSensorOptions] = useState([]);
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [parameterOptions, setParameterOptions] = useState([]);

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

  /* ================= FETCH DATA BY ID ================= */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/displayitems/${_id}`
        );
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

  /* ================= FETCH OPTIONS ================= */
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const sensorResponse = await axios.get(
          process.env.REACT_APP_BACKEND_URL + "/api/sensors"
        );
        setSensorOptions(sensorResponse.data);

        if (formData.sensor) {
          const deviceResponse = await axios.get(
            process.env.REACT_APP_BACKEND_URL +
              `/api/sensors/${formData.sensor}/devices`
          );
          const parameterResponse = await axios.get(
            process.env.REACT_APP_BACKEND_URL +
              `/api/parameters/${formData.sensor}`
          );
          setDeviceOptions(deviceResponse.data);
          setParameterOptions(parameterResponse.data);
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };

    fetchOptions();
  }, [formData.sensor]);

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        process.env.REACT_APP_BACKEND_URL + `/api/displayitems/${_id}`,
        formData
      );
      navigate("/sensor&parameter");
    } catch (error) {
      console.error("Error updating parameter:", error);
      setError("Failed to update parameter.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9F4F4]">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <Header pageName="Edit Sensors & Parameters" />

        <div className="flex justify-center flex-1 p-6">
          <div className="w-full max-w-5xl p-6 bg-white border border-gray-300 rounded-lg shadow-lg">
            {loading ? (
              <p className="text-center text-gray-600">Loading...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : (
              <>
                {/* ================= TOP HEADER + BUTTONS (DESKTOP ONLY) ================= */}
                <div className="items-center justify-between hidden gap-4 mb-6 md:flex">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Edit Sensors & Parameters
                  </h2>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      form="edit-sensor-parameter-form"
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
                  Edit Sensors & Parameters
                </h2>

                {/* ================= FORM ================= */}
                <form
                  id="edit-sensor-parameter-form"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
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
                    <div className="mt-4 text-center text-red-500">
                      {error}
                    </div>
                  )}
                </form>

                {/* ================= BOTTOM BUTTONS (MOBILE & TABLET) ================= */}
                <div className="flex flex-col gap-3 mt-8 md:hidden">
                  <button
                    type="submit"
                    form="edit-sensor-parameter-form"
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSensorParameter;