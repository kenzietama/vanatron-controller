import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../component/header";
import { Search } from "lucide-react";

const UserAdmin = () => {
  const [usersData, setUsersData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("info");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(process.env.REACT_APP_BACKEND_URL + "/api/accounts");
        const data = await response.json();
        setUsersData(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchData();
  }, []);

  const handleAddData = () => navigate("/user&adminadd");
  const handleEditData = (id) => navigate(`/user&adminedit/${id}`);

  const handleOpenModal = (id) => {
    setUserToDelete(id);
    setModalMessage("Are you sure you want to delete this user?");
    setModalType("info");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteData = async () => {
    if (userToDelete) {
      try {
        const response = await fetch(
          process.env.REACT_APP_BACKEND_URL + "/api/accounts/${userToDelete}",
          { method: "DELETE" }
        );
        if (response.ok) {
          setUsersData(usersData.filter((user) => user._id !== userToDelete));
          setModalMessage("User deleted successfully.");
          setModalType("success");
        } else {
          setModalMessage("Failed to delete user.");
          setModalType("error");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        setModalMessage("Error occurred while deleting user.");
        setModalType("error");
      }
    }
  };

  const filteredData = usersData.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F9F4F4]">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header
          pageName="Users Admin"
          databaseName="Database / List Users Admin"
          notifications={0}
        />

        <div className="flex h-full">
          <div className="flex-1 p-4 sm:p-6">
            <div className="bg-white shadow-lg rounded-lg border border-gray-300 p-4 sm:p-6 mb-6">
              {/* Search + Add Data */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="w-full sm:flex-1 sm:max-w-3xl relative">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 pl-4 pr-12 border border-gray-300 rounded-lg text-sm sm:text-base"
                  />
                  <button
                    onClick={() => console.log("Search:", searchTerm)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-md text-black"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={handleAddData}
                  className="w-full sm:w-48 px-6 py-2 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 text-sm sm:text-base"
                >
                  Add Data
                </button>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto">
                {/* Tabel untuk layar besar */}
                <table className="hidden sm:table min-w-full table-auto mb-6">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-700"></th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Role</th>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-3 py-2 text-center text-sm font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((data, index) => (
                      <tr
                        key={data._id}
                        className={`border-t ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } hover:bg-gray-100`}
                      >
                        <td className="px-3 py-2">
                          <img
                            src={`data:image/png;base64,${data.photo}`}
                            alt={data.name}
                            className="w-10 h-10 rounded-full border border-gray-300 mx-auto"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-800">{data.name}</td>
                        <td className="px-3 py-2 text-sm text-gray-800 break-all">
                          {data.email}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-800">{data.role}</td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              data.status === "active"
                                ? "bg-green-500 text-white"
                                : "bg-gray-400 text-white"
                            }`}
                          >
                            {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex flex-col items-center space-y-2">
                            <button
                              onClick={() => handleEditData(data._id)}
                              className="px-3 py-1 w-24 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenModal(data._id)}
                              className="px-3 py-1 w-24 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Tampilan kartu untuk HP */}
                <div className="grid sm:hidden gap-4">
                  {filteredData.map((data) => (
                    <div
                      key={data._id}
                      className="border rounded-lg p-4 bg-gray-50 shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={`data:image/png;base64,${data.photo}`}
                          alt={data.name}
                          className="w-12 h-12 rounded-full border border-gray-300"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">{data.name}</p>
                          <p className="text-xs text-gray-500 break-all">{data.email}</p>
                        </div>
                      </div>
                      <p className="text-sm mb-1">
                        <span className="font-semibold">Role: </span>
                        {data.role}
                      </p>
                      <p className="text-sm mb-2">
                        <span className="font-semibold">Status: </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            data.status === "active"
                              ? "bg-green-500 text-white"
                              : "bg-gray-400 text-white"
                          }`}
                        >
                          {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                        </span>
                      </p>
                      <div className="mt-4 flex justify-between">
                        <button
                          onClick={() => handleEditData(data._id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-full w-[45%]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleOpenModal(data._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-full w-[45%]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center px-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm sm:max-w-md shadow-lg">
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
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteData}
                      className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 text-sm"
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

export default UserAdmin;
