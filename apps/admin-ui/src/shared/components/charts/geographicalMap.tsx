"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";

const geoURL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const countryData = [
  { name: "United States of America", users: 120, sellers: 30 },
  { name: "India", users: 100, sellers: 20 },
  { name: "United Kingdom", users: 85, sellers: 15 },
  { name: "Germany", users: 70, sellers: 10 },
  { name: "Canada", users: 60, sellers: 5 },
];

const getColor = (countryName: string) => {
  const country = countryData.find((c) => c.name === countryName);
  if (!country) return "#1e293b";
  const total = country.users + country.sellers;
  if (total > 100) return "#22c55e"; // ✅ fixed color
  if (total > 0) return "#3b82f6";
  return "#1e293b";
};

const GeographicalMap = () => {
  const [hovered, setHovered] = useState<{
    name: string;
    users: number;
    sellers: number;
  } | null>(null);

  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  return (
    <div>
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 230, center: [0, 10] }}
        width={1400}
        height={500}
        viewBox="0 0 1400 500" // ✅ fixed
        preserveAspectRatio="xMidYMid slice" // ✅ fixed
        style={{
          width: "100%",
          height: "35vh",
          background: "transparent",
          margin: 0,
          padding: 0,
          display: "block",
        }}
      >
        <Geographies geography={geoURL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryName = geo.properties.name;
              const match = countryData.find((c) => c.name === countryName);
              const baseColor = getColor(countryName);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) => {
                    setTooltipPosition({ x: e.pageX, y: e.pageY });
                    setHovered({
                      name: countryName,
                      users: match?.users || 0,
                      sellers: match?.sellers || 0,
                    });
                  }}
                  onMouseMove={(e) => {
                    setTooltipPosition({ x: e.pageX, y: e.pageY });
                  }}
                  onMouseLeave={() => setHovered(null)}
                  fill={baseColor}
                  stroke="#334155"
                  style={{
                    default: {
                      outline: "none",
                      transition: "fill 0.3s ease-in-out",
                    },
                    hover: {
                      fill: match ? baseColor : "#facc15",
                      outline: "none",
                      transition: "fill 0.3s ease-in-out",
                    },
                    pressed: { fill: "#ef4444", outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip with animation */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key={hovered.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed bg-gray-800 text-white text-xs p-2 rounded shadow-lg"
            style={{ top: tooltipPosition.y, left: tooltipPosition.x }}
          >
            <strong>{hovered.name}</strong>
            <br />
            Users: <span className="text-green-400">{hovered.users}</span>
            <br />
            Sellers: <span className="text-yellow-400">{hovered.sellers}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GeographicalMap;
