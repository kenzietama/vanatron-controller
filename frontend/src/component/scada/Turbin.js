import React, { useRef, useEffect, useState } from "react";
import { Image } from "react-konva";
import useImage from "use-image";
import turbin1Url from "./Turbin 1.svg";
import turbin2Url from "./Turbin 2.svg";

const Turbin = ({ x, y, width, height, sizeFactor = 1, offsetX = 0, offsetY = 30 }) => {
  const [image1] = useImage(turbin1Url);
  const [image2] = useImage(turbin2Url);
  const rotatingRef = useRef(null);
  const [rotation, setRotation] = useState(0);

  // Animasi rotasi untuk Turbin 2
  useEffect(() => {
    let animFrame;
    const rotate = () => {
      setRotation((prev) => (prev + 2) % 360);
      animFrame = requestAnimationFrame(rotate);
    };

    animFrame = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <>
      {/* Gambar Turbin 1 (Statis) */}
      {image1 && (
        <Image
          image={image1}
          x={x}
          y={y}
          width={width}
          height={height}
          offsetX={width / 2}
          offsetY={height / 2}
        />
      )}

      {/* Gambar Turbin 2 (Berputar) dengan posisi lebih ke bawah */}
      {image2 && (
        <Image
          image={image2}
          x={x + offsetX} // Geser horizontal
          y={y + offsetY} // Turunkan lebih jauh ke bawah
          width={width * 0.5}
          height={height * 0.5}
          offsetX={(width * 0.5) / 2}
          offsetY={(height * 0.5) / 2}
          rotation={rotation}
          ref={rotatingRef}
        />
      )}
    </>
  );
};

export default Turbin;
