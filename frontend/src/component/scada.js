// src/component/SCADADiagram.js
import React from "react";
import { Stage, Layer } from "react-konva";
import Turbin from "./scada/Turbin"; // Impor Turbin.js dari folder scada

const SCADADiagram = () => {
  return (
    <div className="p-6 bg-white shadow-lg rounded-lg w-full">
      <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">
        Sistem Monitoring SCADA Real-Time
      </h2>
      <Stage width={800} height={400}>
        <Layer>
          {/* Panggil komponen Turbin */}
          <Turbin x={400} y={200} width={100} height={100} />
        </Layer>
      </Stage>
    </div>
  );
};

export default SCADADiagram;
