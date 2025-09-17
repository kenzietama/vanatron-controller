import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../component/header";
import { Eye, EyeOff } from "lucide-react";

const CreateUserAdmin = () => {
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("Active");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage("Photo exceeds the maximum size limit of 50MB.");
        return;
      }
      setErrorMessage("");
      const reader = new FileReader();
      reader.onload = () => setPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("role", role);
    formData.append("status", status.toLowerCase());
    if (photo) {
      const file = await fetch(photo).then((res) => res.blob());
      formData.append("photo", file);
    }

    try {
      const response = await fetch("http://localhost:5000/api/accounts/add", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        navigate("/user&admin");
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      console.error("Error submitting account:", error);
      setErrorMessage("An error occurred while creating the account.");
    }
  };

  const handleBack = () => {
    navigate("/user&admin");
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="flex h-fullscreen bg-[#F9F4F4] flex-col">
      <Header
        pageName="Create Users Admin"
        databaseName="Database / List Users Admin / Create Users Admin"
        notifications={0}
      />
      <div className="flex-1 p-6">
        <div className="bg-white shadow-lg rounded-lg border border-gray-300 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Create Users Admin</h2>
            <div className="flex space-x-4">
              <button
                onClick={handleSubmit}
                className="px-6 py-2 w-36 text-sm bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={handleBack}
                className="px-6 py-2 w-36 text-sm bg-white border border-blue-500 text-blue-500 font-semibold rounded-full hover:bg-blue-600 hover:text-white"
              >
                Back
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

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

export default CreateUserAdmin;
