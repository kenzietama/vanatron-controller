import React from "react";
import Header from "../component/header";
import galeri1 from "../gambar/galeri1.jpg";
import vaname from "../gambar/vaname.jpg";
import rangkaian from "../gambar/rangkaian.png";
import diagram from "../gambar/diagram.png";
import hardware from "../gambar/3dhardware.png";

const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9F4F4]">
      {/* Header */}
      <Header
        pageName="Dashboard"
        databaseName="Home / Dashboard"
        notifications={3}
      />

      {/* Hero Section */}
      <section className="text-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-100 to-blue-200 shadow-md">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-800 drop-shadow-lg leading-tight">
          Selamat Datang di Smart Tambak Udang Vaname
        </h1>
        <p className="text-lg sm:text-xl font-medium text-gray-600 mt-3">
          Pemantauan cerdas dengan energi terbarukan – Pemalang
        </p>
      </section>

      {/* Rangkaian Alat */}
      <section className="px-4 sm:px-8 py-10 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
          Rangkaian Sistem
        </h2>
        <img
          src={diagram}
          alt="Diagram Sistem"
          className="rounded-2xl shadow-lg mx-auto w-full sm:w-4/5 lg:w-3/4 object-contain"
        />
        <img
          src={rangkaian}
          alt="Rangkaian Sistem"
          className="rounded-2xl shadow-lg mx-auto w-full sm:w-4/5 lg:w-3/4 object-contain"
        />
      </section>

      {/* Latar Belakang + Video */}
      <section className="px-4 sm:px-8 py-12 bg-white flex flex-col md:flex-row items-center gap-8">
        {/* Teks */}
        <div className="md:w-1/2 text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            Latar Belakang
          </h2>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Tambak udang vaname membutuhkan sistem pemantauan yang efisien agar
            kualitas air tetap terjaga dan hasil panen optimal. Dengan
            menggabungkan teknologi IoT dan energi terbarukan, sistem ini
            dirancang untuk membantu petambak lebih hemat, ramah lingkungan, dan
            produktif.
          </p>
        </div>
        {/* Video */}
        <div className="md:w-1/2 w-full h-60 sm:h-72 md:h-80 lg:h-96">
          <iframe
            className="w-full h-full rounded-2xl shadow-lg"
            src="https://www.youtube.com/embed/5Da5scyju8Y"
            title="Video Penjelasan"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </section>

      {/* Tentang Udang Vaname */}
      <section className="px-4 sm:px-8 py-12 bg-gradient-to-r from-gray-100 to-gray-200 flex flex-col md:flex-row items-center gap-8">
        {/* Penjelasan */}
        <div className="md:w-1/2 text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            Mengenal Udang Vaname
          </h2>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Udang Vaname (Litopenaeus vannamei) adalah salah satu komoditas
            unggulan budidaya perikanan. Pertumbuhannya cepat, tahan penyakit,
            dan memiliki permintaan pasar yang tinggi baik dalam negeri maupun
            ekspor. Karena itulah, vaname menjadi pilihan utama petambak di
            Indonesia.
          </p>
        </div>
        {/* Gambar */}
        <div className="md:w-1/2 w-full">
          <img
            src={vaname}
            alt="Udang Vaname"
            className="rounded-2xl shadow-lg w-full h-64 sm:h-80 md:h-full object-cover"
          />
        </div>
      </section>

      {/* Galeri Sistem */}
      <section className="px-4 sm:px-8 py-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-8">
          Galeri Sistem
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { src: hardware, label: "3D Design Hardware" },
            { src: galeri1, label: "Turbin Air" },
            { src: galeri1, label: "Kontrol IoT" },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:scale-105 transition-transform"
            >
              <img
                src={item.src}
                alt={item.label}
                className="w-full h-48 sm:h-56 object-cover"
              />
              <p className="text-center font-semibold text-gray-700 py-3">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-600 text-sm px-4">
        © 2025 Sistem Monitoring Tambak Udang – Energi Terbarukan
      </footer>
    </div>
  );
};

export default Dashboard;
