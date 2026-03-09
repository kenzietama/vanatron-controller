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
    const fetchData = async () => {
      try {
        const res = await axios.get(
          process.env.REACT_APP_BACKEND_URL + "/api/displayitems/"
        );
        setDisplayItems(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = displayItems.filter((item) =>
    item.sensor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const confirmDelete = (id) => {
    setSelectedItem(id);
    setModalMessage("Are you sure you want to delete this sensor?");
    setModalType("info");
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        process.env.REACT_APP_BACKEND_URL +
          `/api/displayitems/${selectedItem}`
      );
      setDisplayItems((prev) =>
        prev.filter((item) => item._id !== selectedItem)
      );
      setModalMessage("Sensor deleted successfully");
      setModalType("success");
    } catch (err) {
      setModalMessage("Failed to delete sensor");
      setModalType("error");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="flex min-h-screen bg-[#F9F4F4]">
      <div className="flex flex-col flex-1">
        <Header pageName="Sensors & Parameters" />

        <div className="flex-1 p-6">
          <div className="p-6 bg-white border rounded-lg shadow">
            {/* SEARCH + ADD */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row">
              <div className="relative flex-1">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search"
                  className="w-full h-10 pl-4 pr-10 border rounded-lg"
                />
                <Search className="absolute w-5 h-5 -translate-y-1/2 right-3 top-1/2" />
              </div>

              <button
                onClick={() => navigate("/sensor&parameteradd")}
                className="w-full px-6 py-2 text-sm font-semibold text-white bg-blue-500 rounded-full sm:w-48 hover:bg-blue-600 sm:text-base"
              >
                Add Data
              </button>
            </div>

            {/* ================= DESKTOP / LAPTOP ================= */}
            <div className="hidden lg:block">
              {loading ? (
                <p className="text-center">Loading...</p>
              ) : (
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
                      <th className="px-3 py-2 text-sm font-medium text-left text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                        {filteredData.map((d, i) => (
                          <tr
                            key={d._id}
                            className={`border-b border-gray-200 ${
                              i % 2 === 0 ? "bg-gray-50" : "bg-white"
                            } hover:bg-gray-100`}
                          >
                        <td className="px-3 py-2">{d.sensor}</td>
                        <td className="px-3 py-2">{d.device}</td>
                        <td className="px-3 py-2">{d.parameter}</td>
                        <td className="px-3 py-2">{d.displayName}</td>
                        <td className="px-3 py-2">{d.unit}</td>
                        <td className="px-3 py-2 text-center">
                          {d.minValue ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {d.maxValue ?? "-"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() =>
                                navigate(`/sensor&parameteredit/${d._id}`)
                              }
                              className="px-3 py-1 text-white bg-blue-500 rounded-full"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => confirmDelete(d._id)}
                              className="px-3 py-1 text-white bg-red-500 rounded-full"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ================= TABLET ================= */}
            <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
              {filteredData.map((d) => (
                <div
                  key={d._id}
                  className="p-4 border rounded-lg shadow-sm"
                >
                  <h3 className="mb-2 font-semibold text-blue-600">
                    {d.displayName}
                  </h3>
                  <p><b>Sensor:</b> {d.sensor}</p>
                  <p><b>Device:</b> {d.device}</p>
                  <p><b>Parameter:</b> {d.parameter}</p>
                  <p><b>Unit:</b> {d.unit}</p>
                  <p>
                    <b>Range:</b> {d.minValue ?? "-"} – {d.maxValue ?? "-"}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() =>
                        navigate(`/sensor&parameteredit/${d._id}`)
                      }
                      className="flex-1 py-1 text-white bg-blue-500 rounded-full"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(d._id)}
                      className="flex-1 py-1 text-white bg-red-500 rounded-full"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ================= MOBILE ================= */}
            <div className="space-y-4 md:hidden">
              {filteredData.map((d) => (
                <div
                  key={d._id}
                  className="p-4 border rounded-lg shadow-sm"
                >
                  <p><b>Sensor:</b> {d.sensor}</p>
                  <p><b>Device:</b> {d.device}</p>
                  <p><b>Parameter:</b> {d.parameter}</p>
                  <p><b>Name:</b> {d.displayName}</p>
                  <p><b>Unit:</b> {d.unit}</p>
                  <p><b>Min:</b> {d.minValue ?? "-"}</p>
                  <p><b>Max:</b> {d.maxValue ?? "-"}</p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() =>
                        navigate(`/sensor&parameteredit/${d._id}`)
                      }
                      className="flex-1 py-1 text-white bg-blue-500 rounded-full"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(d._id)}
                      className="flex-1 py-1 text-white bg-red-500 rounded-full"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md p-6 bg-white rounded-lg">
              <p className="mb-4">{modalMessage}</p>
              <div className="flex justify-end gap-2">
                {modalType === "info" ? (
                  <>
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 bg-gray-300 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 text-white bg-red-500 rounded"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 rounded"
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