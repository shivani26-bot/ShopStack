"use client";
import BreadCrumbs from "apps/admin-ui/src/shared/components/breadcrumbs";
import { Download } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

// Defines allowed categories of logs.
type LogType = "success" | "error" | "warning" | "info" | "debug";

// Shape of each log:
// type: one of "success" | "error" | "warning" | "info" | "debug"
// message: the actual log message.
// timestamp: when the log was generated.
// source: optional — which service/module produced it.
type LogItem = {
  type: LogType;
  message: string;
  timestamp: string;
  source?: string;
};

// Maps each log type to a Tailwind CSS text color class.
// Used for displaying logs in different colors in the UI.
//for each type of message we give different colors
const typeColorMap: Record<LogType, string> = {
  success: "text-green-400",
  error: "text-red-500",
  warning: "text-yellow-300",
  info: "text-blue-300",
  debug: "text-gray-400",
};
const Loggers = () => {
  //   logs: stores all logs received from WebSocket.
  // filteredLogs: stores only the logs currently being shown (after filtering).
  // logcontainerRef: points to the log container div so we can auto-scroll to the bottom.
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogItem[]>([]);
  const logcontainerRef = useRef<HTMLDivElement | null>(null);

  //   Runs once on mount ([] dependency).
  // Creates a WebSocket connection to the backend (NEXT_PUBLIC_SOCKET_URI).
  // On message:
  // Parse incoming log as JSON.
  // Append it to logs.
  // On unmount:
  // Close the socket to clean up.
  useEffect(() => {
    const socket = new WebSocket(process.env.NEXT_PUBLIC_SOCKET_URI!);

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setLogs((prev) => [...prev, parsed]);
      } catch (err) {
        console.error("Invalid log format", err);
      }
    };
    return () => socket.close();
  }, []);

  // auto scroll to bottom on log update
  //   Every time logs changes:
  // Update filteredLogs to show all logs (default behavior).
  // Scroll the log container to the bottom → so the newest logs are always visible (like a terminal).
  useEffect(() => {
    setFilteredLogs(logs);
    if (logcontainerRef.current) {
      logcontainerRef.current.scrollTop = logcontainerRef.current.scrollHeight;
    }
  }, [logs]);

  // handle key presses for filtereing
  //   Adds a global keydown event listener:
  // Press 1 → show only error logs.
  // Press 2 → show only success logs.
  // Press 0 → reset, show all logs.
  // Cleaned up on unmount.
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "1") {
        setFilteredLogs(logs.filter((log) => log.type === "error"));
      } else if (e.key === "2") {
        setFilteredLogs(logs.filter((log) => log.type === "success"));
      } else if (e.key === "0") {
        setFilteredLogs(logs);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [logs]);

  // download logs as .log file
  // Converts filteredLogs into plain text.
  // Each log line looks like:[12:34:56 PM] auth-service [ERROR] User not found
  // Creates a .log file blob in memory.
  // Triggers a hidden <a> download with filename application-logs.log.
  // Revokes the object URL to free memory.
  const downloadLogs = () => {
    const content = filteredLogs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toLocaleTimeString()}] ${
            log.source
          } [${log.type.toUpperCase()}] ${log.message}`
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "application-logs.log";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="w-full min-h-screen p-8 bg-black text-white text-sm">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold tracking-wide">Application Logs</h2>{" "}
        <button
          onClick={downloadLogs}
          className="text-xs px-3 flex items-center justify-center gap-1 py-2 bg-gray-700 "
        >
          <Download size={18} /> Download Logs
        </button>
      </div>
      {/* breadcrumbs  */}
      <div className="mb-4">
        <BreadCrumbs title="Application Logs" />
      </div>

      {/* terminal log screen  */}
      <div
        ref={logcontainerRef}
        className="bg-black font-mono border border-gray-800 rounded-md p-4 h-[600px]"
      >
        {filteredLogs.length === 0 ? (
          <p className="text-gray-500">Waiting for logs...</p>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={idx} className="whitespace-pre-wrap">
              <span className="text-gray-50">
                [{new Date(log.timestamp).toLocaleTimeString()}]{" "}
              </span>
              <span className="text-purple-400">{log.source}</span>
              <span className={typeColorMap[log.type]}>
                [{log.type.toUpperCase()}]
              </span>
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Loggers;
