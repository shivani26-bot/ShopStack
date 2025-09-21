"use client";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { saveAs } from "file-saver";

import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import { Download, Eye, Search, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useDeferredValue, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import BreadCrumbs from "apps/admin-ui/src/shared/components/breadcrumbs";

const AllProductsPage = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const deferredFilter = useDeferredValue(globalFilter);
  const [page, setPage] = useState(1);

  const limit = 10;

  const { data, isLoading }: UseQueryResult<any> = useQuery({
    queryKey: ["all-products", page],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/admin/api/get-all-products?page=${page}&limit=${limit}`
      );
      return res?.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  });

  const allProducts = data?.data || [];
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product: any) =>
      Object.values(product)
        .join(" ")
        .toLowerCase()
        .includes(deferredFilter.toLowerCase())
    );
  }, [allProducts, deferredFilter]);

  const totalPages = Math.ceil((data?.meta?.totalProducts ?? 0) / limit);

  //Without useMemo, every render would create a new columns array, which could cause unnecessary re-renders in the table.
  // When you pass [] as the dependency array to useMemo, it means:
  // The function you give to useMemo will only run once, when the component mounts.
  // After that, React will reuse the memoized value (in this case, your columns array) and will not recompute it again, unless the component unmounts and remounts

  //   Why row.original?
  // In TanStack Table, each row object has metadata like id, index, etc.
  // row.original is the raw product data from your API.
  const columns = useMemo(
    () => [
      {
        accessorKey: "image", //tells the table this column represents,row.original.image (but since you use cell, you override how it’s rendered).
        header: "Image", //heading for column
        cell: ({ row }: any) => {
          console.log("roworigianl", row.original);
          //           row.original = the entire product object (not just one field).
          // Displays the first product image using Next.js <Image />.
          return (
            <Image
              src={row.original.images[0]?.url || "/placeholder.png"}
              alt={row.original.title}
              width={40}
              height={40}
              className="w-10 h-10 rounded object-cover"
            />
          );
        },
      },
      {
        // If the title is longer than 25 chars → truncates it.
        // Renders it as a link to the user-facing product page (/product/:slug).
        // Tooltip (title={row.original.title}) shows the full name on hover.
        accessorKey: "title",
        header: "Title",
        cell: ({ row }: any) => (
          // will redirect to http://localhost:3000/product/noisebeat-pro-headphones
          <Link
            href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
            target="_blank"
            className="text-blue-400 hover:underline"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "sale_price",
        header: "Price",
        cell: ({ row }: any) => `$${row.original.sale_price}`,
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }: any) => (
          <span
            className={row.original.stock < 10 ? "text-red-500" : "text-white"}
          >
            {row.original.stock} left
          </span>
        ),
      },
      {
        //No custom cell, so the table just shows row.original.category directly.
        accessorKey: "category",
        header: "Category",
      },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-1">
            <Star fill="#fde047" size={18} />
            <span className="text-white">{row.original.ratings || 5}</span>
          </div>
        ),
      },
      {
        accessorKey: "Shop.name",
        header: "Shop",
        cell: ({ row }: any) => (
          <span className="text-purple-400">{row.original.Shop.name} </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }: any) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        header: "Actions",
        cell: ({ row }: any) => (
          <Link
            href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
            className="text-blue-400 hover:underline"
          >
            <Eye size={18} />
          </Link>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredProducts, //table data or rows , usually an array of objects. Each object represents a row
    columns, //column definitions you built with useMemo, Defines what each column should show (accessorKey, header, custom cell, etc.). how to display rows
    getCoreRowModel: getCoreRowModel(), //  tells the table how to create the base row model from your raw data. It generates rows from products and attaches column values. Without this, the table won’t know how to render rows.
    getFilteredRowModel: getFilteredRowModel(), //Enables filtering for your table, When you apply a filter (like a search box), this function processes which rows match.
    globalFilterFn: "includesString", //This is the global filtering function. "includesString" is a built-in filter that checks if the row’s text includes the search string. Example: searching "Pro" will match NoiseBeat Pro Headphones
    state: { globalFilter }, //The current table state. globalFilter is a string (e.g., "phone") that you control with React state (useState). By passing it in, you make filtering controlled, meaning React decides what the filter value is.
    onGlobalFilterChange: setGlobalFilter, // This is the callback the table calls when the filter changes. It updates your globalFilter React state, which in turn updates the state above. That’s how the input box for searching stays in sync with the table.
  });

  const exportCSV = () => {
    const csvData = filteredProducts.map(
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
      {/* breadcrumbs  */}
      <BreadCrumbs title="All Products" />

      {/* search bar  */}
      <div className="my-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search products..."
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

export default AllProductsPage;
