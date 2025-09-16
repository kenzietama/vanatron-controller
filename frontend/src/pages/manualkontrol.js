import React, { useState } from "react";
import Header from "../component/header";

const ManualKontrol = () => {
  const [watt, setWatt] = useState(50); // Nilai awal watt
  const [inputWatt, setInputWatt] = useState(50); // Nilai input sementara
  
  const handleInputChange = (e) => {
    setInputWatt(e.target.value);
  };
  
  const handleConfirm = () => {
    const newWatt = parseInt(inputWatt, 10);
    if (!isNaN(newWatt) && newWatt >= 0 && newWatt <= 100) {
      setWatt(newWatt);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9F4F4]">
      {/* Header */}
      <Header pageName="Manual Kontrol" databaseName="Database / Manual Kontrol" notifications={3} />

      {/* Kontainer utama untuk menengahkan konten */}
      <div className="flex flex-1 justify-center items-center">
        <div className="flex flex-col items-center border-2 border-gray-400 p-6 rounded-lg bg-white shadow-lg w-3/4 max-w-xl">
          <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">Kontrol Manual Watt Turbin</h1>

          {/* Tampilan Watt */}
          <div className="w-full h-20 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center text-4xl font-bold tracking-wider text-gray-700">
            {watt} Watt
          </div>

          {/* Slider dan Input untuk Watt */}
          <div className="w-full bg-gray-100 p-6 rounded-lg shadow-lg text-center border border-gray-300 mt-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Watt: {watt}</h2>

            <input
              type="range"
              min="0"
              max="100"
              value={watt}
              onChange={(e) => setWatt(parseInt(e.target.value, 10))}
              className="w-full cursor-pointer transition-all ease-in-out duration-300"
            />

            <div className="mt-4 flex flex-col items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-700">Untuk Ketepatan Gunakan Input Manual</h2>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={inputWatt}
                  onChange={handleInputChange}
                  className="p-2 border rounded w-20 text-center border-gray-400 text-gray-700"
                />

                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-all"
                >
                  Konfirmasi
                </button>
              </div>
            </div>

            <p className="mt-4 text-lg text-gray-600">Watt Tersimpan: {watt} W</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualKontrol;