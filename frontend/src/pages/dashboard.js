import React, { useState } from "react";
import Header from "../component/header";
import kolam from "../gambar/kolam.jpeg";
import laboratorium from "../gambar/laboratorium.jpeg";
import vaname from "../gambar/vaname.jpg";
import rangkaian from "../gambar/rangkaian.png";
import diagram from "../gambar/diagram.png";
import hardware from "../gambar/3dhardware.png";

const Dashboard = () => {
  const [previewImage, setPreviewImage] = useState(null);

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F4F4]">
      {/* Header */}
      <Header pageName="Dashboard" />

      {/* Hero Section */}
      <section className="px-4 py-12 text-center shadow-md sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-100 to-blue-200">
        <h1 className="text-3xl font-extrabold leading-tight text-gray-800 sm:text-4xl md:text-5xl drop-shadow-lg">
          Selamat Datang di Smart Tambak Udang Vaname
        </h1>
        <p className="mt-3 text-lg font-medium text-gray-600 sm:text-xl">
          Pemantauan cerdas dengan energi terbarukan – Pemalang
        </p>
      </section>

      {/* Rangkaian Alat */}
      <section className="px-4 py-10 text-center sm:px-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-800 sm:text-3xl">
          Rangkaian Sistem
        </h2>

        <div className="grid max-w-5xl grid-cols-1 gap-6 mx-auto sm:grid-cols-2">
          <div
            className="cursor-pointer"
            onClick={() => setPreviewImage(diagram)}
          >
            <img
              src={diagram}
              alt="Diagram Sistem"
              className="object-contain w-full h-56 p-3 transition bg-white shadow-md rounded-xl hover:scale-105"
            />
            <p className="mt-2 text-sm text-gray-600">Diagram Sistem</p>
          </div>

          <div
            className="cursor-pointer"
            onClick={() => setPreviewImage(rangkaian)}
          >
            <img
              src={rangkaian}
              alt="Rangkaian Sistem"
              className="object-contain w-full h-56 p-3 transition bg-white shadow-md rounded-xl hover:scale-105"
            />
            <p className="mt-2 text-sm text-gray-600">Rangkaian Alat</p>
          </div>
        </div>
      </section>

      {/* Modal Preview Gambar */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative w-full max-w-6xl px-4">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute text-3xl font-bold text-white -top-10 right-4 hover:text-gray-300"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl bg-white p-4"
            />
          </div>
        </div>
      )}

      {/* Latar Belakang + Video */}
      <section className="flex flex-col items-center gap-8 px-4 py-12 bg-white sm:px-8 md:flex-row">
        <div className="text-left md:w-1/2">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 sm:text-3xl">
            Latar Belakang
          </h2>
          <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
            Tambak udang vaname membutuhkan sistem pemantauan yang efisien agar
            kualitas air tetap terjaga dan hasil panen optimal. Dengan
            menggabungkan teknologi IoT dan energi terbarukan, sistem ini
            dirancang untuk membantu petambak lebih hemat, ramah lingkungan, dan
            produktif.
          </p>
        </div>

        <div className="w-full md:w-1/2 h-60 sm:h-72 md:h-80 lg:h-96">
          <iframe
            className="w-full h-full shadow-lg rounded-2xl"
            src="https://www.youtube.com/embed/5Da5scyju8Y"
            title="Video Penjelasan"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          ></iframe>
        </div>
      </section>

      {/* Tentang Udang Vaname */}
      <section className="flex flex-col items-center gap-8 px-4 py-12 sm:px-8 bg-gradient-to-r from-gray-100 to-gray-200 md:flex-row">
        <div className="text-left md:w-1/2">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 sm:text-3xl">
            Mengenal Udang Vaname
          </h2>
          <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
            Udang Vaname (Litopenaeus vannamei) adalah salah satu komoditas
            unggulan budidaya perikanan. Pertumbuhannya cepat, tahan penyakit,
            dan memiliki permintaan pasar yang tinggi baik dalam negeri maupun
            ekspor.
          </p>
        </div>

        <div className="w-full md:w-1/2">
          <img
            src={vaname}
            alt="Udang Vaname"
            className="object-cover w-full h-64 shadow-lg rounded-2xl sm:h-80 md:h-full"
          />
        </div>
      </section>

      {/* Galeri Sistem */}
      <section className="px-4 py-10 sm:px-8">
        <h2 className="mb-8 text-2xl font-bold text-center text-gray-800 sm:text-3xl">
          Galeri Sistem
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {[{ src: hardware, label: "3D Design Hardware" }, { src: kolam, label: "Kolam Tambak" }, { src: laboratorium, label: "Green Vaname Laboratory" }].map((item, i) => (
            <div
              key={i}
              onClick={() => setPreviewImage(item.src)}
              className="overflow-hidden transition-transform bg-white shadow-lg cursor-pointer rounded-2xl hover:scale-105"
            >
              <img
                src={item.src}
                alt={item.label}
                className="object-cover w-full h-48 sm:h-56"
              />
              <p className="py-3 font-semibold text-center text-gray-700">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-6 text-sm text-center text-gray-600">
        © 2025 Sistem Monitoring Tambak Udang – Energi Terbarukan
      </footer>
    </div>
  );
};

export default Dashboard;
