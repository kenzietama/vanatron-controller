import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../component/header";
import axios from "axios";
import { Search } from "lucide-react";

const SensorParameter = () => {
  const [displayItems, setDisplayItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState("info");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSensorsData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(process.env.REACT_APP_BACKEND_URL + "/api/displayitems/");
        setDisplayItems(response.data);
      } catch (error) {
        console.error("Error fetching sensors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSensorsData();
  }, []);

  const confirmDelete = (id) => {
    setSelectedItem(id);
    setModalMessage("Are you sure you want to delete this sensor?");
    setModalType("info");
    setIsModalOpen(true);
  };

  const handleDeleteData = async () => {
    if (!selectedItem) return;
    try {
      const response = await axios.delete(process.env.REACT_APP_BACKEND_URL + `/api/displayitems/${selectedItem}`);
      if (response.status === 200) {
        setDisplayItems(displayItems.filter((sensor) => sensor._id !== selectedItem));
        setModalMessage("Sensor deleted successfully!");
        setModalType("success");
      } else {
        throw new Error("Failed to delete sensor.");
      }
    } catch (error) {
      console.error("Error deleting sensor:", error);
      setModalMessage("Error deleting sensor. Please try again.");
      setModalType("error");
    } finally {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setModalMessage("");
  };

  const updateSensors = async () => {
    try {
      await axios.get(process.env.REACT_APP_BACKEND_URL + "/api/sensors/update");
    } catch (error) {
      console.error("Error updating sensors:", error);
    }
  };

  const handleAdd = () => {
    updateSensors();
    navigate("/sensor&parameteradd");
  };

  const handleEdit = (id) => {
    updateSensors();
    navigate(`/sensor&parameteredit/${id}`);
  };

  const filteredData = displayItems.filter((item) =>
    item.sensor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F9F4F4]">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <Header
          pageName="Sensors & Parameters"
        />

        <div className="flex-1 p-6">
          <div className="p-6 mb-6 bg-white border border-gray-300 rounded-lg shadow-lg">
            {/* Search + Add Data */}
              <div className="flex flex-col items-center justify-between gap-4 mb-6 sm:flex-row">
                <div className="relative w-full sm:flex-1 sm:max-w-3xl">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-4 pr-12 text-sm border border-gray-300 rounded-lg sm:text-base"
                />
                <button
                  onClick={() => console.log("Search:", searchTerm)}
                  className="absolute p-2 text-black transform -translate-y-1/2 rounded-md right-2 top-1/2"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className="w-full px-6 py-2 font-semibold text-white bg-blue-500 rounded-full sm:w-48 hover:bg-blue-600"
              >
                Add Data
              </button>
            </div>

            {/* 🔹 Tabel Desktop & Tablet */}
            <div className="hidden sm:block">
              {loading ? (
                <p className="text-center text-gray-700">Loading data...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="hidden min-w-full mb-6 table-auto sm:table">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-sm font-medium text-left text-gray-700">Sensor</th>
                        <th className="px-3 py-2 text-sm font-medium text-left text-gray-700">Device</th>
                        <th className="px-3 py-2 text-sm font-medium text-left text-gray-700">Parameter</th>
                        <th className="px-3 py-2 text-sm font-medium text-left text-gray-700">Name</th>
                        <th className="px-3 py-2 text-sm font-medium text-left text-gray-700">Unit</th>
                        <th className="px-3 py-2 text-sm font-medium text-left text-gray-700">Min</th>
                        <th className="px-3 py-2 text-sm font-medium text-left text-gray-700">Max</th>
                        <th className="px-3 py-2 text-sm font-medium text-center text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length > 0 ? (
                        filteredData.map((data, index) => (
                          <tr
                            key={data._id}
                            className={`border-t ${
                              index % 2 === 0 ? "bg-gray-50" : "bg-white"
                            } hover:bg-gray-100`}
                          >
                            <td className="px-3 py-2 break-words whitespace-normal">{data.sensor}</td>
                            <td className="px-3 py-2 break-words whitespace-normal">{data.device}</td>
                            <td className="px-3 py-2 break-words whitespace-normal">{data.parameter}</td>
                            <td className="px-3 py-2 break-words whitespace-normal">{data.displayName}</td>
                            <td className="px-3 py-2">{data.unit}</td>
                            <td className="px-3 py-2 text-center">{data.minValue ?? "-"}</td>
                            <td className="px-3 py-2 text-center">{data.maxValue ?? "-"}</td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex flex-col items-center space-y-2">
                                <button
                                  onClick={() => handleEdit(data._id)}
                                  className="w-24 px-3 py-1 font-semibold text-white bg-blue-500 rounded-full hover:bg-blue-600"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => confirmDelete(data._id)}
                                  className="w-24 px-3 py-1 font-semibold text-white bg-red-500 rounded-full hover:bg-red-600"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="px-4 py-4 text-center text-gray-600">
                            No sensors found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 🔹 Card Mobile */}
            <div className="space-y-4 sm:hidden">
              {filteredData.length > 0 ? (
                filteredData.map((data) => (
                  <div
                    key={data._id}
                    className="p-4 bg-white border border-gray-300 rounded-lg shadow-sm"
                  >
                    <p><strong>Sensor:</strong> {data.sensor}</p>
                    <p><strong>Device:</strong> {data.device}</p>
                    <p><strong>Parameter:</strong> {data.parameter}</p>
                    <p><strong>Name:</strong> {data.displayName}</p>
                    <p><strong>Unit:</strong> {data.unit}</p>
                    <p><strong>Min:</strong> {data.minValue ?? "-"}</p>
                    <p><strong>Max:</strong> {data.maxValue ?? "-"}</p>
                    <div className="flex justify-between mt-4">
                      <button
                        onClick={() => handleEdit(data._id)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-full w-[45%]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(data._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-full w-[45%]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600">No sensors found</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center px-4 bg-gray-500 bg-opacity-50">
            <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-lg sm:max-w-md">
              <h3
                className={`text-base sm:text-lg font-semibold mb-4 ${
                  modalType === "success"
                    ? "text-green-500"
                    : modalType === "error"
                    ? "text-red-500"
                    : "text-gray-800"
                }`}
              >
                {modalMessage}
              </h3>
              <div className="flex justify-end space-x-4">
                {modalType === "info" ? (
                  <>
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-sm text-gray-800 bg-gray-300 rounded-full hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteData}
                      className="px-4 py-2 text-sm text-white bg-red-500 rounded-full hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm text-gray-800 bg-gray-300 rounded-full hover:bg-gray-400"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorParameter;
