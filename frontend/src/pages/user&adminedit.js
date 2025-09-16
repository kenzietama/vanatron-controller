import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../component/header";
import { Eye, EyeOff } from "lucide-react"; // ✅ ganti ikon manual ke Lucide

const EditUserAdmin = () => {
  const { _id } = useParams(); // Get _id from URL
  const navigate = useNavigate();

  // State
  const [photo, setPhoto] = useState(null); // Base64 photo
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("Active");
  const [password, setPassword] = useState(""); // Optional new password
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!_id) {
      setErrorMessage("Invalid user ID.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/accounts/${_id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        const user = await response.json();
        setPhoto(user.photo || null);
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setStatus(user.status.toLowerCase() === "active" ? "Active" : "Non Active");
        setPassword(""); // Clear password in UI
        setErrorMessage("");
      } catch (error) {
        console.error("Error fetching user data:", error);
        setErrorMessage("Failed to fetch user data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [_id]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhoto(reader.result); // Convert to Base64
      reader.readAsDataURL(file);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Hapus prefix "data:image/png;base64,"
    const processedPhoto = photo?.replace(/^data:image\/[a-z]+;base64,/, "") || null;

    const updatedUser = {
      name,
      email,
      role,
      status: status.toLowerCase(),
      photo: processedPhoto,
    };

    if (password) {
      updatedUser.password = password;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/accounts/${_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      navigate("/user&admin");
    } catch (error) {
      console.error("Error updating user:", error);
      setErrorMessage("Failed to update user. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/user&admin");
  };

  return (
    <div className="flex h-fullscreen bg-[#F9F4F4] flex-col">
      <Header
        pageName="Edit Users Admin"
        databaseName="Database / List Users Admin / Edit Users Admin"
        notifications={0}
      />
      <div className="flex-1 p-6">
        <div className="bg-white shadow-lg rounded-lg border border-gray-300 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Edit Users Admin</h2>
            <div className="flex space-x-4">
              <button
                onClick={handleSubmit}
                className="px-6 py-2 w-36 text-sm bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleBack}
                className="px-6 py-2 w-36 text-sm bg-white border border-blue-500 text-blue-500 font-semibold rounded-full hover:bg-blue-600 hover:text-white"
              >
                Back
              </button>
            </div>
          </div>

          {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo Input */}
            <div className="flex justify-start items-center space-x-4 ml-4">
              <label className="w-1/4 text-sm font-medium text-gray-700">Photo</label>
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-300 flex items-center justify-center bg-black">
                  {photo ? (
                    <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500">No Image</span>
                  )}
                </div>
                <input
                  type="file"
                  onChange={handlePhotoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Name Input */}
            <div className="flex justify-start items-center space-x-4 ml-4">
              <label className="w-1/4 text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-3/4 h-10 px-4 py-1 border border-gray-300 rounded-lg"
                placeholder="Enter Name"
                required
              />
            </div>

            {/* Email Input */}
            <div className="flex justify-start items-center space-x-4 ml-4">
              <label className="w-1/4 text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-3/4 h-10 px-4 py-1 border border-gray-300 rounded-lg"
                placeholder="Enter Email"
                required
              />
            </div>

            {/* Role Input */}
            <div className="flex justify-start items-center space-x-4 ml-4">
              <label className="w-1/4 text-sm font-medium text-gray-700">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-3/4 h-10 px-4 py-1 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select Role</option>
                <option value="Administrator">Administrator</option>
                <option value="Operator">Operator</option>
                <option value="Researcher">Researcher</option>
              </select>
            </div>

            {/* Status Input */}
            <div className="flex justify-start items-center space-x-4 ml-4">
              <label className="w-1/4 text-sm font-medium text-gray-700">Status</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="Active"
                    checked={status === "Active"}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="Non Active"
                    checked={status === "Non Active"}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span>Non Active</span>
                </label>
              </div>
            </div>

            {/* Password Input */}
            <div className="flex justify-start items-center space-x-4 ml-4">
              <label className="w-1/4 text-sm font-medium text-gray-700">Password</label>
              <div className="w-3/4 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-4 py-1 border border-gray-300 rounded-lg"
                  placeholder="Enter New Password (optional)"
                />
                <span
                  onClick={toggleShowPassword}
                  className="absolute top-2 right-2 cursor-pointer text-gray-600 hover:text-gray-800"
                >
                  {showPassword ? (
                    <EyeOff className="w-6 h-6" />
                  ) : (
                    <Eye className="w-6 h-6" />
                  )}
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserAdmin;
