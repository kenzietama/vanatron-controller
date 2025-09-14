import React, {useEffect} from "react";
import {Navigate, Route, Routes, useLocation} from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Monitoring from "./pages/monitoring";
import Plts from "./pages/plts";
import SensorParameter from "./pages/sensor&parameter";
import AddSensorParameter from "./pages/sensor&parameteradd";
import EditSensorParameter from "./pages/sensor&parameteredit";
import UserAdmin from "./pages/user&admin";
import AddUserAdmin from "./pages/user&adminadd";
import EditUserAdmin from "./pages/user&adminedit";
import ManualKontrol from "./pages/manualkontrol";
import Navbar from "./component/navbar";
import {Loader} from 'lucide-react'
import {useAuthStore} from "./store/useAuthStore";
import {Toaster} from "react-hot-toast";

function App() {
  const {authAccount, checkAuth, isCheckingAuth} = useAuthStore()
  const location = useLocation();

  const showNavbar = !["/login"].includes(location.pathname);

  useEffect(() => {
    checkAuth()
  }, [checkAuth]);

  // console.log(authAccount)

  if(isCheckingAuth && !authAccount) return (
    <div className="flex items-center justify-center h-screen">
      <Loader className="size-10 animate-spin" />
    </div>
  )

  return (
    <div className="flex">
      {showNavbar && authAccount && <Navbar />}

      <div className="main-content flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={authAccount ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/login" element={!authAccount ? <Login /> : <Navigate to="/" />} />
          <Route path="/monitoring" element={authAccount ? <Monitoring /> : <Navigate to="/login" />} />
          <Route path="/plts" element={authAccount ? <Plts /> : <Navigate to="/login" />} />
          <Route path="/sensor&parameter" element={authAccount ? (authAccount.role === "Admin" ? <SensorParameter/> : <Navigate to="/" />) : <Navigate to="/login" />} />
          <Route path="/sensor&parameteradd" element={authAccount ? (authAccount.role === "Admin" ? <AddSensorParameter/> : <Navigate to="/" />) : <Navigate to="/login" />} />
          <Route path="/sensor&parameteredit/:_id" element={authAccount ? (authAccount.role === "Admin" ? <EditSensorParameter/> : <Navigate to="/" />) : <Navigate to="/login" />} />
          <Route path="/user&admin" element={authAccount ? (authAccount.role === "Admin" ? <UserAdmin/> : <Navigate to="/" />) : <Navigate to="/login" />} />
          <Route path="/user&adminadd" element={authAccount ? (authAccount.role === "Admin" ? <AddUserAdmin/> : <Navigate to="/" />) : <Navigate to="/login" />} />
          <Route path="/user&adminedit/:_id" element={authAccount ? (authAccount.role === "Admin" ? <EditUserAdmin/> : <Navigate to="/" />) : <Navigate to="/login" />} />
          <Route path="/manualkontrol" element={authAccount ? <ManualKontrol /> : <Navigate to="/login" />} />
        </Routes>

        <Toaster />
      </div>
    </div>
  );
}

// function AppWrapper() {
//   return (
//     <Router>
//       <App />
//     </Router>
//   );
// }

export default App;
