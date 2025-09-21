"use client";
import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Eye, Link } from "lucide-react";
import SalesChart from "../../shared/components/charts/sale-chart";
import GeographicalMap from "../../shared/components/charts/geographicalMap";

// in admin dashboard we can see users and sellers in the map
// in graph it shows overall data, all the shops with sale, seller data graph will only show the data for that shop
// device data
const deviceData = [
  { name: "Phone", value: 55 },
  { name: "Tablet", value: 20 },
  { name: "Computer", value: 25 },
];

const COLORS = ["#4ade80", "#facc15", "#60a5fa"];

const orders = [
  { id: "ORD-001", customer: "John Doe", amount: "$250", status: "Paid" },
  { id: "ORD-002", customer: "Jane", amount: "$180", status: "Pending" },
  { id: "ORD-003", customer: "Alice", amount: "$340", status: "Paid" },
  { id: "ORD-004", customer: "Bob Lee", amount: "$90", status: "Failed" },
  { id: "ORD-005", customer: "Bob Lee", amount: "$90", status: "Failed" },
  { id: "ORD-006", customer: "Bob Lee", amount: "$90", status: "Failed" },
];

const columns = [
  {
    accessorKey: "id", //tells the table this column represents,row.original.image (but since you use cell, you override how it’s rendered).
    header: "Order ID", //heading for column
  },
  {
    accessorKey: "customer",
    header: "Customer",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }: any) => {
      const value = getValue();
      const color =
        value === "Paid"
          ? "text-green-400"
          : value === "Pending"
          ? "text-yellow-400"
          : "text-red-400";

      return <span className={`font-medium ${color}`}>{value}</span>;
    },
  },
];

const OrdersTable = () => {
  const table = useReactTable({
    data: orders, //table data or rows , usually an array of objects. Each object represents a row
    columns, //column definitions you built with useMemo, Defines what each column should show (accessorKey, header, custom cell, etc.). how to display rows
    getCoreRowModel: getCoreRowModel(), //  tells the table how to create the base row model from your raw data. It generates rows from products and attaches column values. Without this, the table won’t know how to render rows.
  });

  return (
    <div className="mt-6">
      <h2 className="text-white text-xl font-semibold mb-4">
        Recent Orders{" "}
        <span className="block text-sm text-slate-400 font-normal">
          A quick snapshot of your latest transactions
        </span>
      </h2>
      <div className="!rounded shadow-xl overflow-hidden border border-slate-700">
        <table className="min-w-full text-sm text-white">
          <thead className="bg-slate-900 text-slate-300">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-3 text-left">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-transparent">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-slate-600 hover:bg-slate-800 transition"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 truncate">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// dashboard layout
const DashboardPage = () => {
  return (
    <div className="p-8">
      {/* top charts  */}
      <div className="w-full flex gap-8">
        {/* revenue chart  */}
        <div className="w-[65%]">
          <div className="rounded-2xl shadow-xl">
            <h2 className="text-white text-xl font-semibold">
              Revenue{" "}
              <span className="block text-sm text-slate-400 font-normal">
                Last 6 months performance
              </span>
            </h2>
            <SalesChart />
          </div>
        </div>
        {/* device usage  */}
        <div className="w-[35%] rounded-2xl shadow-xl">
          <h2 className="text-white text-xl font-semibold mb-2">
            Device usage{" "}
            <span className="block text-sm text-slate-400 font-normal">
              How users acess your platform
            </span>
          </h2>
          <div className="mt-14">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <defs>
                  <filter
                    id="shadow"
                    x="-10%"
                    y="-10%"
                    width="120%"
                    height="120%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="0"
                      stdDeviation="4"
                      floodColor="#000"
                      floodOpacity="0.2"
                    />
                  </filter>
                </defs>
                <Pie
                  data={deviceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="#0f172a"
                  strokeWidth={2}
                  isAnimationActive
                  filter="url(#shadow)"
                >
                  {deviceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                />

                {/* external legend  */}
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-white text-sm ml-1">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* geomap+ orders  */}
      <div className="w-full flex gap-8">
        {/* {" "}map  */}
        <div className="w-[60%]">
          <h2 className="text-white text-xl font-semibold mt-6">
            User & Seller Distribution{" "}
            <span className="block text-sm text-slate-400 font-normal">
              Visual breakdown of global user & seller activity
            </span>
          </h2>
          <GeographicalMap />
        </div>
        {/* orders table  */}
        <div className="w-[40%]">
          <OrdersTable />
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;

// error happens because you’re on React 19 (the newest RC) but some older libraries in your project (like react-image-magnify → react-cursor-position) still have peer dependencies locked to React ≤16.
// So every time you run npm install, npm’s resolver sees:
// react@19.0.0 (your app)
// react-cursor-position@2.5.3 → peer react@"~0.14.9 || ^15.0.0 || ^16.0.0"
// conflict 🚨 (it wants React ≤16, but you have 19)
// That’s why it fails unless you tell npm to ignore peer dep conflicts.
