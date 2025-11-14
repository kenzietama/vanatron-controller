// File: Monitoring.js
import { useEffect, useState } from "react";
import CardSensor from "../component/cardsensor";
import Header from "../component/header";
import { useDataStore } from "../store/useDataStore";

const Monitoring = () => {
  const {
    latestData,
    getLatestData,
    isValueLoading,
    getGraph,
    isGraphLoading,
    graph,
    subscribe,
  } = useDataStore();

  const [intervalMinutes, setIntervalMinutes] = useState(60);

  useEffect(() => {
    getLatestData();
    subscribe();
  }, [getLatestData, subscribe]);

  useEffect(() => {
    getGraph?.(intervalMinutes);
  }, [getGraph, intervalMinutes]);

  const handleIntervalChange = (minutes) => {
    setIntervalMinutes(minutes);
    getGraph?.(minutes);
  };

  const handleRefresh = (minutes) => {
    const effective = minutes ?? intervalMinutes;
    getGraph?.(effective);
  };

  return (
    <div className="flex min-h-screen bg-[#F9F4F4]">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <Header
          pageName="Monitoring"
          databaseName="Database / Monitoring"
          notifications={0}
        />

        <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
          {/* Map Section */}
          <div className="p-3 bg-white shadow-md sm:p-4 rounded-xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3165.4995481261174!2d109.46853107460685!3d-6.830255646756649!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e705c9ae10d9799%3A0xf0f4bc354d0d2b40!2sTambak%20Udang%20Prima%20Sukses%20Bersama!5e0!3m2!1sen!2sid!4v1234567890123"
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              className="rounded-lg"
              title="Lokasi Tambak Udang"
            ></iframe>
          </div>

          {/* Sensor Data Section */}
          <div>
            {isValueLoading ? (
              <div className="py-6 text-center text-gray-500">Memuat data sensor...</div>
            ) : (
              <div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {latestData && latestData.length > 0 ? (
                  latestData.map((data, index) => {
                    const series = graph?.[index] || [];
                    const graphReady = Array.isArray(series) && series.length > 0 && !isGraphLoading;
                    return (
                      <CardSensor
                        key={data._id}
                        name={`${data.displayName} (${data.unit})`}
                        displayName={data.displayName}
                        value={data.value}
                        data={series}
                        unit={data.unit}
                        minValue={data.minValue}
                        maxValue={data.maxValue}
                        currentInterval={intervalMinutes}
                        onRefresh={handleRefresh}
                        onIntervalChange={handleIntervalChange}
                        graphReady={graphReady}
                      />
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-gray-600 col-span-full">
                    Data sensor tidak ditemukan.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;