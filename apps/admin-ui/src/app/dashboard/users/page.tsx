"use client";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import axiosInstance from "apps/admin-ui/src/utils/axiosInstance";
import { Ban, Download, Search } from "lucide-react";
import React, { useDeferredValue, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import BreadCrumbs from "apps/admin-ui/src/shared/components/breadcrumbs";

// types
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};
type UsersResponse = {
  data: User[];
  meta: {
    totalUsers: number;
  };
};
//i can see all the users and admin in this page and we can ban the user as well
const UsersPage = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const [page, setPage] = useState(1);
  const limit = 10;
  const queryClient = useQueryClient();

  const { data, isLoading }: UseQueryResult<UsersResponse, Error> = useQuery<
    UsersResponse,
    Error,
    UsersResponse,
    [string, number]
  >({
    queryKey: ["users-list", page],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/admin/api/get-all-users?page=${page}&limit=${limit}`
      );
      return res?.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await axiosInstance.put(`/admin/api/ban-user/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-list"] });
      setIsModalOpen(false);
      setSelectedUser(null);
    },
  });

  const allUsers = data?.data || [];
  //useMemo for search
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const matchesRole = roleFilter
        ? user.role.toLowerCase() === roleFilter.toLowerCase()
        : true;
      const matchesGlobal = deferredGlobalFilter
        ? Object.values(user)
            .join(" ")
            .toLowerCase()
            .includes(deferredGlobalFilter.toLowerCase())
        : true;
      return matchesRole && matchesGlobal;
    });
  }, [allUsers, roleFilter, deferredGlobalFilter]);

  const totalPages = Math.ceil((data?.meta?.totalUsers ?? 0) / limit);

  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "role",
        header: "Role",
        cells: ({ row }: any) => (
          <span className="uppercase font-semibold text-blue-600">
            {row.original.role}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }: any) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        accessorKey: "actions",
        header: "Actions",
        cell: ({ row }: any) => (
          <button
            className="text-red-400 hover:text-red-300 transition"
            onClick={() => {
              setSelectedUser(row.original);
              setIsModalOpen(true);
            }}
          >
            <Ban size={18} />
          </button>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredUsers, //table data or rows , usually an array of objects. Each object represents a row
    columns, //column definitions you built with useMemo, Defines what each column should show (accessorKey, header, custom cell, etc.). how to display rows
    getCoreRowModel: getCoreRowModel(), //  tells the table how to create the base row model from your raw data. It generates rows from products and attaches column values. Without this, the table won’t know how to render rows.
    getFilteredRowModel: getFilteredRowModel(), //Enables filtering for your table, When you apply a filter (like a search box), this function processes which rows match.
    globalFilterFn: "includesString", //This is the global filtering function. "includesString" is a built-in filter that checks if the row’s text includes the search string. Example: searching "Pro" will match NoiseBeat Pro Headphones
    state: { globalFilter }, //The current table state. globalFilter is a string (e.g., "phone") that you control with React state (useState). By passing it in, you make filtering controlled, meaning React decides what the filter value is.
    onGlobalFilterChange: setGlobalFilter, // This is the callback the table calls when the filter changes. It updates your globalFilter React state, which in turn updates the state above. That’s how the input box for searching stays in sync with the table.
  });

  const exportCSV = () => {
    const csvData = filteredUsers.map(
      (p: any) =>
        `${p.title},${p.sale_price},${p.stock},${p.category},${p.ratings},${p.Shop.name}`
    );
    const blob = new Blob(
      [`Title,Price,Stock,Category,Rating,Shop\n${csvData.join("\n")}`],
      { type: "text/csv;charset=utf-8" }
    );
    saveAs(blob, `products-page-${page}.csv`);
  };

  return (
    <div className="w-full min-h-screen p-8 bg-black text-white text-sm ">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl tracking-wide font-bold">All Products</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="bg-green-600 hover:bg-green-700 cursor-pointer text-white px-4 py-2 rounded-lg flex items-center gap-2"
            onClick={exportCSV}
          >
            <Download size={16} /> Export CSV
          </button>
          <select
            className="bg-gray-800 border border-gray-700 outline-none text-white px-4 py-2 rounded-lg "
            value={roleFilter}
            name={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>
      <div className="mb-4">
        {/* breadcrumbs  */}
        <BreadCrumbs title="All Users" />
      </div>
      {/* search bar  */}
      <div className="my-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search users..."
          className="w-bull bg-transparent text-white outline-none"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>
      {/* table  */}
      <div>
        {isLoading ? (
          <p className="text-center text-white">Loading products... </p>
        ) : (
          <table className="w-full text-white">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-gray-800">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-3 text-left">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
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
                    <td key={cell.id} className="p-3">
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

        {/* pagination controls  */}
        <div className="flex justify-between items-center mt-4">
          <button
            className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page == 1}
          >
            Previous
          </button>
          <span className="text-gray-300">
            Page {page} of {totalPages || 1}{" "}
          </span>
          <button
            className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page == totalPages}
          >
            Next
          </button>
        </div>

        {/* ban confirmation modal  */}
        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
            <div className="bg-[#1e293b] rounded-2xl shadow-lg w-[90%] max-w-md p-6">
              {/* Title */}
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-white text-lg font-semibold">Ban User</h3>
              </div>

              {/* Warning Text */}
              <div className="mb-6">
                <p className="text-gray-300 leading-6">
                  <span className="text-yellow-400 font-semibold">
                    ⚠️ Important:
                  </span>{" "}
                  Are you sure you want to ban{" "}
                  <span className="text-red-400 font-medium">
                    {selectedUser.name}
                  </span>
                  ? This action{" "}
                  <span className="font-semibold">can be reverted later</span>.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => banUserMutation.mutate(selectedUser.id)}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-white font-semibold flex items-center gap-2 transition"
                >
                  <Ban size={16} />
                  Confirm Ban
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
