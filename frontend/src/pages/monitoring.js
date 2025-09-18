// File: Monitoring.js
import React, { useEffect, useState } from "react";
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
  }, []);

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
    <div className="flex h-fullscreen bg-[#F9F4F4]">
      <div className="flex-1 flex flex-col">
        <Header
          pageName="Monitoring"
          databaseName="Database / Monitoring"
          notifications={0}
        />

        <div className="p-4 flex flex-col gap-4">
          {/* Map */}
          <div className="bg-white p-4 rounded-lg shadow">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3165.4995481261174!2d109.46853107460685!3d-6.830255646756649!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e705c9ae10d9799%3A0xf0f4bc354d0d2b40!2sTambak%20Udang%20Prima%20Sukses%20Bersama!5e0!3m2!1sen!2sid!4v1234567890123"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen="true"
              loading="lazy"
            ></iframe>
          </div>

          {/* Sensor Data */}
          <div>
            {isValueLoading || isGraphLoading ? (
              <p>loading</p>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {latestData && latestData.length > 0 ? (
                  latestData.map((data, index) => (
                    <CardSensor
                      key={data._id}
                      name={`${data.displayName} (${data.unit})`}
                      displayName={data.displayName}
                      value={data.value}
                      data={graph[index]}
                      unit={data.unit}
                      minValue={data.minValue}
                      maxValue={data.maxValue}
                      currentInterval={intervalMinutes}
                      onRefresh={handleRefresh}
                      onIntervalChange={handleIntervalChange}
                    />
                  ))
                ) : (
                  <div>Not found</div>
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
