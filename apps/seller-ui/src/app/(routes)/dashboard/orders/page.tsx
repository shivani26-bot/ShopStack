"use client";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import { ChevronRight, Eye, Search } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";

const fetchOrders = async () => {
  const res = await axiosInstance.get("/order/api/get-seller-orders");
  return res.data.orders;
};
const OrdersTable = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: fetchOrders,
    staleTime: 1000 * 60 * 5,
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: "id", //tells the table this column represents,row.original.image (but since you use cell, you override how it’s rendered).
        header: "Order ID", //heading for column
        cell: ({ row }: any) => (
          <span className="text-white text-sm truncate">
            #{row.original.id.slice(-6).toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: "user.name",
        header: "Buyer",
        cell: ({ row }: any) => (
          <span className="text-white">
            {row.original.user?.name ?? "Guest"}
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }: any) => <span>${row.original.total}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              row.original.status === "Paid"
                ? "bg-green-600 text-white"
                : "bg-yellow-500 text-white"
            }`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }: any) => {
          const date = new Date(row.original.createdAt).toLocaleDateString();
          return <span className="text-white text-sm">{date}</span>;
        },
      },

      {
        header: "Actions",
        cell: ({ row }: any) => (
          <Link
            href={`/order/${row.original.id}`}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            <Eye size={18} />
          </Link>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: orders, //table data or rows , usually an array of objects. Each object represents a row
    columns, //column definitions you built with useMemo, Defines what each column should show (accessorKey, header, custom cell, etc.). how to display rows
    getCoreRowModel: getCoreRowModel(), //  tells the table how to create the base row model from your raw data. It generates rows from products and attaches column values. Without this, the table won’t know how to render rows.
    getFilteredRowModel: getFilteredRowModel(), //Enables filtering for your table, When you apply a filter (like a search box), this function processes which rows match.
    globalFilterFn: "includesString", //This is the global filtering function. "includesString" is a built-in filter that checks if the row’s text includes the search string. Example: searching "Pro" will match NoiseBeat Pro Headphones
    state: { globalFilter }, //The current table state. globalFilter is a string (e.g., "phone") that you control with React state (useState). By passing it in, you make filtering controlled, meaning React decides what the filter value is.
    onGlobalFilterChange: setGlobalFilter, // This is the callback the table calls when the filter changes. It updates your globalFilter React state, which in turn updates the state above. That’s how the input box for searching stays in sync with the table.
  });

  return (
    <div className="w-full min-h-screen p-8">
      <h2 className="text-2xl text-white font-semibold mb-2">All Orders</h2>
      {/* breadcrumbs */}
      <div className="flex items-center text-white">
        <Link href={"/dashboard"} className="text-[#80deea] cursor-pointer">
          Dashboard
        </Link>

        <ChevronRight size={20} className="opacity-[.8] " />
        <span>All Orders</span>
      </div>
      {/* search bar  */}
      <div className="my-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search orders..."
          className="w-bull bg-transparent text-white outline-none"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>
      {/* table  */}
      <div className="overflow-x-auto bg-gray-900 rounded-lg p-4">
        {isLoading ? (
          <p className="text-center text-white">Loading orders... </p>
        ) : (
          <table className="w-full text-white">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-800">
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
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-800 hover:bg-gray-900 transition"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && orders?.length === 0 && (
          <p className="text-center py-3 text-white">No Orders found!</p>
        )}
      </div>
    </div>
  );
};

export default OrdersTable;
