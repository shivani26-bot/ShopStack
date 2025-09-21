"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import BreadCrumbs from "apps/admin-ui/src/shared/components/breadcrumbs";
import axiosInstance from "apps/admin-ui/src/utils/axiosInstance";
import React, { useState } from "react";

const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role", header: "Role" },
];
const Page = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("user");
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/api/get-all-admins");
      return res.data.admins || [];
    },
  });

  const { mutate: updateRole, isPending: updating } = useMutation({
    mutationFn: async () => {
      return await axiosInstance.put("/admin/api/add-new-admin", {
        email: search,
        role: selectedRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      setOpen(false);
      setSearch("");
      setSelectedRole("user");
    },
    onError: (err) => {
      console.error("Role update failed", err);
    },
  });

  const table = useReactTable({
    data: data || [], //table data or rows , usually an array of objects. Each object represents a row
    columns, //column definitions you built with useMemo, Defines what each column should show (accessorKey, header, custom cell, etc.). how to display rows
    getCoreRowModel: getCoreRowModel(), //  tells the table how to create the base row model from your raw data. It generates rows from products and attaches column values. Without this, the table won’t know how to render rows.
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    updateRole();
  };
  return (
    <div className="w-full min-h-screen p-8 bg-black text-white text-sm ">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl tracking-wide font-bold">Team Management</h2>
        <button
          type="button"
          className="bg-green-600 hover:bg-green-700 cursor-pointer text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => setOpen(true)}
        >
          Add Admin
        </button>
      </div>

      <div className="mb-4">
        <BreadCrumbs title="Team Management" />
      </div>

      {/* <div className="!rounded shadow-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-white">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-3">
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
            {isLoading ? (
              <tr>
                <td className="p-4 text-center text-slate-400" colSpan={3}>
                  Loading...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td className="p-4 text-center text-slate-400" colSpan={3}>
                  Failed to load admins.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-800 hover:bg-gray-900 transition"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div> */}
      <div className="!rounded-lg shadow-xl border border-slate-700 overflow-hidden">
        <table className="w-full border-collapse text-sm text-left text-slate-300">
          <thead className="bg-slate-800/70 text-slate-200 uppercase text-xs tracking-wider">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 font-semibold border-b border-slate-700"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-700">
            {isLoading ? (
              <tr>
                <td className="p-6 text-center text-slate-400" colSpan={3}>
                  Loading...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td className="p-6 text-center text-red-400" colSpan={3}>
                  Failed to load admins.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md relative">
            <button
              className="absolute top-3 right-4 text-slate-400 hover:text-white text-center"
              onClick={() => setOpen(false)}
            >
              &times;
            </button>
            <h3 className="text-lg font-semibold mb-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 text-slate-300">Email</label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 outline-none bg-slate-800 text-white border border-slate-600 !rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-300">Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 tet-white border border-slate-600 !rounded outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-8 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-full bg-slate-700 text-white px-4 py-2 !rounded hover:bg-slate-800"
                  >
                    {" "}
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full bg-blue-600 text-white px-4 py-2 !rounded hover:bg-blue-800"
                  >
                    {updating ? "Updating..." : "Add Admin"}
                  </button>
                </div>
              </form>
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
