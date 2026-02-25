import { useState, useEffect } from "react";
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
          `${process.env.REACT_APP_BACKEND_URL}/api/accounts/${userToDelete}`,
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
      <div className="flex flex-col flex-1">
        {/* Header */}
        <Header
          pageName="Users Admin"
        />

        <div className="flex h-full">
          <div className="flex-1 p-4 sm:p-6">
            <div className="p-4 mb-6 bg-white border border-gray-300 rounded-lg shadow-lg sm:p-6">
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
                  onClick={handleAddData}
                  className="w-full px-6 py-2 text-sm font-semibold text-white bg-blue-500 rounded-full sm:w-48 hover:bg-blue-600 sm:text-base"
                >
                  Add Data
                </button>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto">
                {/* Tabel untuk layar besar */}
                <table className="hidden min-w-full mb-6 table-auto sm:table">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-sm font-medium text-left text-gray-700"></th>
                      <th className="px-3 py-2 text-sm font-medium text-left text-gray-700">Name</th>
                      <th className="px-3 py-2 text-sm font-medium text-left text-gray-700">Email</th>
                      <th className="px-3 py-2 text-sm font-medium text-left text-gray-700">Role</th>
                      <th className="px-3 py-2 text-sm font-medium text-left text-gray-700">Status</th>
                      <th className="px-3 py-2 text-sm font-medium text-center text-gray-700">Action</th>
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
                            className="w-10 h-10 mx-auto border border-gray-300 rounded-full"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-800">{data.name}</td>
                        <td className="px-3 py-2 text-sm text-gray-800 break-all">{data.email}</td>
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
                              className="w-24 px-3 py-1 font-semibold text-white bg-blue-500 rounded-full hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenModal(data._id)}
                              className="w-24 px-3 py-1 font-semibold text-white bg-red-500 rounded-full hover:bg-red-600"
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
                <div className="grid gap-4 sm:hidden">
                  {filteredData.map((data) => (
                    <div
                      key={data._id}
                      className="p-4 border rounded-lg shadow-sm bg-gray-50"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={`data:image/png;base64,${data.photo}`}
                          alt={data.name}
                          className="w-12 h-12 border border-gray-300 rounded-full"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">{data.name}</p>
                          <p className="text-xs text-gray-500 break-all">{data.email}</p>
                        </div>
                      </div>
                      <p className="mb-1 text-sm">
                        <span className="font-semibold">Role: </span>
                        {data.role}
                      </p>
                      <p className="mb-2 text-sm">
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
                      <div className="flex justify-between mt-4">
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

export default UserAdmin;
