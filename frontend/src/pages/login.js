import { useState } from 'react';
import gambarudang from '../gambar/gambarudang.png';
import logo from '../ikon/icon.png';
import { useAuthStore } from "../store/useAuthStore";
import { Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const Login = () => {
  const [passwordType, setPasswordType] = useState('password');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const validateForm = () => {
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");
    return true;
  };

  const togglePasswordVisibility = () => {
    setPasswordType(passwordType === 'password' ? 'text' : 'password');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success === true) {
      await login(formData);
    }
  };

  return (
    <div className="flex flex-col h-screen font-bold md:flex-row">
      <div className="relative w-full md:w-1/3">
        <img src={gambarudang} alt="Background" className="object-cover w-full h-full" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black bg-opacity-40">
          <div className="absolute flex items-center top-4 left-4">
            <img src={logo} alt="Logo" className="w-10 h-10 mr-2" />
            <span className="text-xl">Admin</span>
          </div>
          <h1 className="mb-4 text-4xl md:text-5xl">Welcome Back!</h1>
          <p className="px-6 text-lg text-center md:px-12">
            Use your access in the application and login to your dashboard account.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-full py-8 bg-gray-100 md:w-2/3 md:py-0">
        <div className="w-11/12 md:w-3/4">
          <h2 className="mb-8 text-3xl text-left md:text-4xl">Login</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 text-sm text-gray-600">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 transition border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block mb-2 text-sm text-gray-600">
                Password
              </label>
              <div className="relative">
                <input
                  type={passwordType}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 transition border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
                <span
                  onClick={togglePasswordVisibility}
                  className="absolute text-gray-600 transform -translate-y-1/2 cursor-pointer top-1/2 right-3 hover:text-gray-800"
                >
                  {passwordType === 'password' ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center w-full gap-2 px-4 py-2 text-white transition bg-blue-500 rounded-md hover:bg-blue-600"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
