"use client";

import { useEffect, useState } from "react";
import { UAParser } from "ua-parser-js";

// use ua-parser-js for device tracking info
const useDeviceTracking = () => {
  const [deviceInfo, setDeviceInfo] = useState("");
  useEffect(() => {
    const parser = new UAParser();

    const result = parser.getResult();
    console.log("p", result);
    //set device info only once when component mounts
    setDeviceInfo(
      `${result.device.type || "Desktop"}-${result.os.name} ${
        result.os.version
      }-${result.browser.name} -${result.browser.version}`
    );
  }, []);
  return deviceInfo;
};

export default useDeviceTracking;

// parser: ua parser returns
// getBrowser
// getCPU
// getDevice
// getEngine
// getOS
// getResult
// getUA
// setUA

// result return :
// IData {ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Ap…KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', browser: IData, cpu: IData, device: IData, engine:
