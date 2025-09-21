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
import Image from "next/image";
import profilePlaceholder from "../../assets/icons/profilePlaceholder.jpg";

// types
type Seller = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  shop: {
    name: string;
    avatar: string;
    address: string;
  };
};
interface SellersResponse {
  data: Seller[];
  meta: {
    totalSellers: number;
    currentPage: number;
    totalPages: number;
  };
}
//i can see all the users and admin in this page and we can ban the user as well
const UsersPage = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const [page, setPage] = useState(1);

  const limit = 10;

  const { data, isLoading }: UseQueryResult<SellersResponse, Error> = useQuery({
    queryKey: ["sellers-list", page],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/admin/api/get-all-sellers?page=${page}&limit=${limit}`
      );
      return res?.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  });

  const allSellers = data?.data || [];
  //useMemo for search
  const filteredSellers = useMemo(() => {
    return allSellers.filter((seller) => {
      return deferredGlobalFilter
        ? Object.values(seller)
            .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
            .join(" ")
            .toLowerCase()
            .includes(deferredGlobalFilter.toLowerCase())
        : true;
    });
  }, [allSellers, deferredGlobalFilter]);

  const totalPages = Math.ceil((data?.meta?.totalSellers ?? 0) / limit);

  const columns = useMemo(
    () => [
      {
        accessorKey: "shop.avatar", //tells the table this column represents,row.original.image (but since you use cell, you override how it’s rendered).
        header: "Avatar", //heading for column
        cell: ({ row }: any) => (
          <Image
            src={row.original.shop?.avatar || profilePlaceholder}
            alt={row.original.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded object-cover"
          />
        ),
      },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "shop.name",
        header: "Shop Name",
        cell: ({ row }: any) => {
          const shopName = row.original.shop?.name;
          return shopName ? (
            <a
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/shop/${row.original.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {shopName}
            </a>
          ) : (
            <span className="text-gray-400 italic">No Shop</span>
          );
        },
      },
      {
        accessorKey: "shop.address",
        header: "Address",
      },

      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }: any) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredSellers, //table data or rows , usually an array of objects. Each object represents a row
    columns, //column definitions you built with useMemo, Defines what each column should show (accessorKey, header, custom cell, etc.). how to display rows
    getCoreRowModel: getCoreRowModel(), //  tells the table how to create the base row model from your raw data. It generates rows from products and attaches column values. Without this, the table won’t know how to render rows.
    getFilteredRowModel: getFilteredRowModel(), //Enables filtering for your table, When you apply a filter (like a search box), this function processes which rows match.
    globalFilterFn: "includesString", //This is the global filtering function. "includesString" is a built-in filter that checks if the row’s text includes the search string. Example: searching "Pro" will match NoiseBeat Pro Headphones
    state: { globalFilter }, //The current table state. globalFilter is a string (e.g., "phone") that you control with React state (useState). By passing it in, you make filtering controlled, meaning React decides what the filter value is.
    onGlobalFilterChange: setGlobalFilter, // This is the callback the table calls when the filter changes. It updates your globalFilter React state, which in turn updates the state above. That’s how the input box for searching stays in sync with the table.
  });

  const exportCSV = () => {
    const csvData = filteredSellers.map(
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

        <button
          type="button"
          className="bg-green-600 hover:bg-green-700 cursor-pointer text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={exportCSV}
        >
          <Download size={16} /> Export CSV
        </button>
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
          placeholder="Search sellers..."
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
      </div>
    </div>
  );
};

export default UsersPage;
