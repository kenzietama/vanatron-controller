import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../component/header";
import { Eye, EyeOff } from "lucide-react";

const EditUserAdmin = () => {
  const { _id } = useParams();
  const navigate = useNavigate();

  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("Active");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch existing user data
  useEffect(() => {
    if (!_id) {
      setErrorMessage("Invalid user ID.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/accounts/${_id}`
        );
        if (!response.ok) throw new Error("Failed to fetch user data");
        const user = await response.json();

        setPhoto(user.photo || null);
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setStatus(
          user.status?.toLowerCase() === "active" ? "Active" : "Non Active"
        );
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
      reader.onload = () => setPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);

    const processedPhoto =
      photo?.replace(/^data:image\/[a-z]+;base64,/, "") || null;

    const updatedUser = {
      name,
      email,
      role,
      status: status.toLowerCase(),
      photo: processedPhoto,
    };

    if (password) updatedUser.password = password;

    try {
      const response = await fetch(
        process.env.REACT_APP_BACKEND_URL + `/api/accounts/${_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedUser),
        }
      );

      if (!response.ok) throw new Error("Failed to update user");

      navigate("/user&admin");
    } catch (error) {
      console.error("Error updating user:", error);
      setErrorMessage(
        "Failed to update user. Please check your inputs and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate("/user&admin");

  return (
    <div className="flex min-h-screen bg-[#F9F4F4]">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <Header pageName="Edit Users Admin" />

        <div className="flex justify-center flex-1 p-6">
          <div className="w-full max-w-5xl p-6 bg-white border border-gray-300 rounded-lg shadow-lg">
            {/* ================= TOP BUTTONS (DESKTOP ONLY) ================= */}
            <div className="items-center justify-between hidden gap-4 mb-6 md:flex">
              <h2 className="text-2xl font-semibold text-gray-800">
                Edit Users Admin
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-36 px-6 py-2 text-sm font-semibold text-white bg-blue-500 rounded-full hover:bg-blue-600 disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleBack}
                  className="w-36 px-6 py-2 text-sm font-semibold text-blue-500 bg-white border border-blue-500 rounded-full hover:bg-blue-600 hover:text-white"
                >
                  Back
                </button>
              </div>
            </div>

            {/* ================= TITLE (MOBILE & TABLET) ================= */}
            <h2 className="block mb-6 text-2xl font-semibold text-gray-800 md:hidden">
              Edit Users Admin
            </h2>

            {errorMessage && (
              <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
                {errorMessage}
              </div>
            )}

            {/* ================= MOBILE FORM ================= */}
            <form
              onSubmit={handleSubmit}
              className="block space-y-6 divide-y divide-gray-200 md:hidden"
            >
              <div className="flex flex-col items-start gap-4 pt-2 sm:flex-row">
                <label className="text-sm font-medium text-gray-700">
                  Photo
                </label>
                <div className="relative">
                  <div className="flex items-center justify-center w-24 h-24 overflow-hidden bg-gray-100 border border-gray-300 rounded-full">
                    {photo ? (
                      <img
                        src={photo}
                        alt="Preview"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-xs text-gray-500">No Image</span>
                    )}
                  </div>
                  <input
                    type="file"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 px-4 mt-1 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 px-4 mt-1 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="h-10 px-4 mt-1 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Operator">Operator</option>
                    <option value="Researcher">Researcher</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="Active"
                        checked={status === "Active"}
                        onChange={(e) => setStatus(e.target.value)}
                      />
                      <span>Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="Non Active"
                        checked={status === "Non Active"}
                        onChange={(e) => setStatus(e.target.value)}
                      />
                      <span>Non Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-10 px-4 border border-gray-300 rounded-lg"
                      placeholder="Enter New Password (optional)"
                    />
                    <span
                      onClick={toggleShowPassword}
                      className="absolute text-gray-600 cursor-pointer top-2 right-3"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </form>

            {/* ================= DESKTOP / TABLET FORM ================= */}
            <form
              onSubmit={handleSubmit}
              className="hidden mt-4 space-y-4 md:block"
            >
              <div className="flex items-center ml-4 space-x-4">
                <label className="w-1/4 text-sm font-medium text-gray-700">
                  Photo
                </label>
                <div className="relative">
                  <div className="flex items-center justify-center w-24 h-24 overflow-hidden bg-black border border-gray-300 rounded-full">
                    {photo ? (
                      <img
                        src={photo}
                        alt="Preview"
                        className="object-cover w-full h-full"
                      />
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

              <div className="flex items-center ml-4 space-x-4">
                <label className="w-1/4 text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-3/4 h-10 px-4 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center ml-4 space-x-4">
                <label className="w-1/4 text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-3/4 h-10 px-4 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center ml-4 space-x-4">
                <label className="w-1/4 text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-3/4 h-10 px-4 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Operator">Operator</option>
                  <option value="Researcher">Researcher</option>
                </select>
              </div>

              <div className="flex items-center ml-4 space-x-4">
                <label className="w-1/4 text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="Active"
                      checked={status === "Active"}
                      onChange={(e) => setStatus(e.target.value)}
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="Non Active"
                      checked={status === "Non Active"}
                      onChange={(e) => setStatus(e.target.value)}
                    />
                    <span>Non Active</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center ml-4 space-x-4">
                <label className="w-1/4 text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative w-3/4">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 px-4 border border-gray-300 rounded-lg"
                  />
                  <span
                    onClick={toggleShowPassword}
                    className="absolute text-gray-600 cursor-pointer top-2 right-2"
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

            {/* ================= BOTTOM BUTTONS (MOBILE & TABLET) ================= */}
            <div className="flex flex-col gap-3 mt-8 md:hidden">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full px-6 py-3 text-sm font-semibold text-white bg-blue-500 rounded-full hover:bg-blue-600 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleBack}
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

export default EditUserAdmin;