import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../component/header";
import { Search } from "lucide-react"; // ganti pakai lucide-react biar konsisten

const UserAdmin = () => {
  const [usersData, setUsersData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("info"); // info, success, error
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/accounts");
        const data = await response.json();
        setUsersData(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchData();
  }, []);

  const handleAddData = () => {
    navigate("/user&adminadd");
  };

  const handleEditData = (id) => {
    navigate(`/user&adminedit/${id}`);
  };

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
        const response = await fetch(`http://localhost:5000/api/accounts/${userToDelete}`, {
          method: "DELETE",
        });
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
    <div className="flex h-fullscreen bg-[#F9F4F4] flex-col">
      <Header pageName="Users Admin" databaseName="Database / List Users Admin" notifications={0} />
      <div className="flex h-full">
        <div className="flex-1 p-6">
          <div className="bg-white shadow-lg rounded-lg border border-gray-300 p-6 mb-6">
            {/* 🔍 Search + Add Data */}
            <div className="flex justify-between items-center mb-6">
              {/* Search bar fleksibel */}
              <div className="flex-1 max-w-3xl relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-4 pr-12 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={() => console.log("Search:", searchTerm)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-md text-black"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Tombol Add Data */}
              <button
                onClick={handleAddData}
                className="ml-4 px-6 py-2 w-48 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600"
              >
                Add Data
              </button>
            </div>

            {/* Tabel Users */}
            <table className="min-w-full table-auto mb-6">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700"></th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Role</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((data, index) => (
                  <tr
                    key={data._id}
                    className={`border-t ${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-gray-100`}
                  >
                    <td className="px-4 py-2 text-sm text-gray-800">
                      <div className="flex items-center">
                        <img
                          src={`data:image/png;base64,${data.photo}`}
                          alt={data.name}
                          className="w-10 h-10 rounded-full border border-gray-300"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-800">{data.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">{data.email}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">{data.role}</td>
                    <td className="px-4 py-2 text-sm text-center">
                      <span
                        className={`px-3 py-1 rounded-full ${
                          data.status === "active"
                            ? "bg-green-500 text-white"
                            : "bg-gray-400 text-white"
                        }`}
                      >
                        {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-center">
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
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 w-1/3 shadow-lg">
            <h3
              className={`text-lg font-semibold ${
                modalType === "success"
                  ? "text-green-500"
                  : modalType === "error"
                  ? "text-red-500"
                  : "text-gray-800"
              }`}
            >
              {modalMessage}
            </h3>
            <div className="mt-4 flex justify-end space-x-4">
              {modalType === "info" ? (
                <>
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteData}
                    className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAdmin;
