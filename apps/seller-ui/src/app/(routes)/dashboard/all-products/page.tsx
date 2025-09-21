"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import {
  BarChart,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Star,
  Trash,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { setGlobal } from "next/dist/trace";
import DeleteConfirmationModal from "apps/seller-ui/src/shared/components/modals/delete.confirmation.modal";

const fetchProducts = async () => {
  const res = await axiosInstance.get("/product/api/get-shop-products");
  return res?.data?.products;
};
const deleteProduct = async (productId: string) => {
  await axiosInstance.delete(`/product/api/delete-product/${productId}`);
};
const restoreProduct = async (productId: string) => {
  await axiosInstance.put(`/product/api/restore-product/${productId}`);
};
const ProductList = () => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>();
  const queryClient = useQueryClient(); //It holds the cache of your fetched data and provides methods to update, invalidate, or refetch queries.
  //   useQueryClient() is a React Hook that gives you access to that central queryClient instance inside your component.

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });

  //   delete product mutation
  //it will make isDeleted in products table to true
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      setShowDeleteModal(false);
    },
  });

  //   delete product mutation
  const restoreMutation = useMutation({
    mutationFn: restoreProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      setShowDeleteModal(false);
    },
  });

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
              src={row.original.images[0]?.url}
              alt={row.original.images[0]?.url}
              width={200}
              height={200}
              className="w-12 h-12 rounded-md object-cover"
            />
          );
        },
      },
      {
        // If the title is longer than 25 chars → truncates it.
        // Renders it as a link to the user-facing product page (/product/:slug).
        // Tooltip (title={row.original.title}) shows the full name on hover.
        accessorKey: "name",
        header: "Product Name",
        cell: ({ row }: any) => {
          const truncatedTitle =
            row.original.title.length > 25
              ? `${row.original.title.substring(0, 25)}...`
              : row.original.title;
          return (
            // will redirect to http://localhost:3000/product/noisebeat-pro-headphones
            <Link
              href={`${process.env.NEXT_PUBLIC_USER_UI_LINK}/product/${row.original.slug}`}
              className="text-blue-400 hover:underline"
              title={row.original.title}
            >
              {truncatedTitle}
            </Link>
          );
        },
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }: any) => <span>{row.original.sale_price}</span>,
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
        header: "Actions",
        cell: ({ row }: any) => (
          <div className="flex gap-3">
            <Link
              href={`/product/${row.original.id}`}
              className="text-blue-400 hover:text-blue-300 transition"
            >
              <Eye size={18} />
            </Link>
            <Link
              href={`/product/edit/${row.original.id}`}
              className="text-yellow-400 hover:text-yellow-300 transition"
            >
              <Pencil size={18} />
            </Link>
            <button className="text-green-400 hover:text-green-300 transition">
              <BarChart size={18} />
            </button>
            <button
              className="text-red-400 hover:text-red-300 transition"
              onClick={() => openDeleteModal(row.original)}
            >
              <Trash size={18} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: products, //table data or rows , usually an array of objects. Each object represents a row
    columns, //column definitions you built with useMemo, Defines what each column should show (accessorKey, header, custom cell, etc.). how to display rows
    getCoreRowModel: getCoreRowModel(), //  tells the table how to create the base row model from your raw data. It generates rows from products and attaches column values. Without this, the table won’t know how to render rows.
    getFilteredRowModel: getFilteredRowModel(), //Enables filtering for your table, When you apply a filter (like a search box), this function processes which rows match.
    globalFilterFn: "includesString", //This is the global filtering function. "includesString" is a built-in filter that checks if the row’s text includes the search string. Example: searching "Pro" will match NoiseBeat Pro Headphones
    state: { globalFilter }, //The current table state. globalFilter is a string (e.g., "phone") that you control with React state (useState). By passing it in, you make filtering controlled, meaning React decides what the filter value is.
    onGlobalFilterChange: setGlobalFilter, // This is the callback the table calls when the filter changes. It updates your globalFilter React state, which in turn updates the state above. That’s how the input box for searching stays in sync with the table.
  });

  const openDeleteModal = (product: any) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };
  return (
    <div className="w-full min-h-screen p-8 ">
      <div className="flex justify-between mb-1">
        <h2 className="text-2xl text-white font-semibold">All Products</h2>
        <button
          type="button"
          className="bg-blue-500 hover:bg-blue-700 cursor-pointer text-white px-4 py-2 rounded-lg flex items-center gap-2"
          //   onClick={() => setShowModal(true)}
        >
          <Plus size={18} /> Add Product
        </button>
      </div>
      {/* breadcrumbs  */}
      <div className="flex items-center text-white">
        <Link href={"/dashboard"} className="text-[#80deea] cursor-pointer">
          Dashboard
        </Link>

        <ChevronRight size={20} className="opacity-[.8] " />
        <span>All Products</span>
      </div>

      {/* search bar  */}
      <div className="mb-4 flex items-center bg-gray-900 p-2 rounded-md flex-1">
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
        {showDeleteModal && (
          <DeleteConfirmationModal
            product={selectedProduct}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={() => deleteMutation.mutate(selectedProduct?.id)}
            onRestore={() => restoreMutation.mutate(selectedProduct?.id)}
          />
        )}
      </div>
    </div>
  );
};

export default ProductList;

// React Table supports grouped/nested headers.
// So instead of giving you a flat list of headers, it returns an array of header groups (each group represents one row of headers in <thead>).
// no grouping:
// const columns = [
//   {
//     accessorKey: "name",
//     header: "Name",
//   },
//   {
//     accessorKey: "price",
//     header: "Price",
//   },
//   {
//     accessorKey: "stock",
//     header: "Stock",
//   },
// ];
// table.getHeaderGroups()
// For this setup, you’ll only have 1 header group:
// [
//   {
//     "id": "header_0",
//     "headers": [
//       { "id": "name", "column": "name", "isPlaceholder": false },
//       { "id": "price", "column": "price", "isPlaceholder": false },
//       { "id": "stock", "column": "stock", "isPlaceholder": false }
//     ]
//   }
// ]

// This means your <thead> has one row:
// | Name | Price | Stock |

// nested headers:
// const columns = [
//   {
//     header: "Product Info",
//     columns: [
//       { accessorKey: "name", header: "Name" },
//       { accessorKey: "category", header: "Category" },
//     ],
//   },
//   {
//     header: "Inventory",
//     columns: [
//       { accessorKey: "price", header: "Price" },
//       { accessorKey: "stock", header: "Stock" },
//     ],
//   },
// ];

// table.getHeaderGroups()

// Now you’ll get 2 groups (because there are 2 header rows):
// [
//   {
//     "id": "header_0",
//     "headers": [
//       { "id": "product_info", "isPlaceholder": false },
//       { "id": "inventory", "isPlaceholder": false }
//     ]
//   },
//   {
//     "id": "header_1",
//     "headers": [
//       { "id": "name", "isPlaceholder": false },
//       { "id": "category", "isPlaceholder": false },
//       { "id": "price", "isPlaceholder": false },
//       { "id": "stock", "isPlaceholder": false }
//     ]
//   }
// ]

// Rendered <thead> will look like:
// |  Product Info   |   Inventory   |
// |  Name | Category| Price | Stock |

// table.getHeaderGroups() → array of rows in the header.
// Each headerGroup.headers → array of cells in that row.
// Works for both simple and nested/grouped headers.

// flexRender(header.column.columnDef.header, header.getContext())
// This is how React Table renders dynamic content:
// header.column.columnDef.header → could be a string (e.g. "Price") or a React component/function.
// header.getContext() → provides context (row, column, table) if the header is a function.
// flexRender decides how to handle both cases (string or function).
// If your column definition looks like:
// {
//   accessorKey: "price",
//   header: "Price",
// }
// flexRender just renders "Price".
// If you do:
// {
//   accessorKey: "stock",
//   header: ({ column }) => <span>{column.id.toUpperCase()}</span>,
// }
// flexRender calls the function and renders <span>STOCK</span>.

// What is isPlaceholder?
// A placeholder header is a "filler" cell used to keep the table’s header grid aligned properly.
// It doesn’t actually have a column definition to render.

// const columns = [
//   {
//     header: "Product Info",
//     columns: [
//       { accessorKey: "name", header: "Name" },
//       { accessorKey: "category", header: "Category" },
//     ],
//   },
//   {
//     header: "Inventory",
//     columns: [
//       { accessorKey: "price", header: "Price" },
//       { accessorKey: "stock", header: "Stock" },
//     ],
//   },
// ];

// What happens internally?

// When react-table builds header groups, it generates two rows:
// Top row: Product Info and Inventory
// Each of these cells will "span" across its children columns.
// But to keep the grid rectangular, it may also insert placeholders.
// Second row: Name, Category, Price, Stock
// Each aligns under its parent.

// +-----------------------+-------------------+
// |      Product Info     |     Inventory     |   <-- headerGroup row 1
// |   (spans 2 columns)   | (spans 2 columns) |
// +-----------+-----------+-----------+-------+
// |   Name    | Category  |   Price   | Stock |   <-- headerGroup row 2
// +-----------+-----------+-----------+-------+
// |  "Book"   |  "Novel"  |   200     |  50   |   <-- table body row
// |  "Pen"    | "Station" |   20      | 100   |
// +-----------+-----------+-----------+-------+
// How isPlaceholder fits in
// Row 1 (Product Info + Inventory) → these are group headers.
// Since each spans 2 sub-columns, react-table inserts placeholder headers so the grid stays rectangular.

// For example:
// Row 1 (headers):
// Product Info → covers Name + Category
// Inventory → covers Price + Stock
// Placeholders are created underneath so that the array lengths match.

// [
//   {
//     "id": "header_0",
//     "headers": [
//       { "id": "product_info", "isPlaceholder": false },
//       { "id": "name", "isPlaceholder": true },
//       { "id": "inventory", "isPlaceholder": false },
//       { "id": "price", "isPlaceholder": true }
//     ]
//   },
//   {
//     "id": "header_1",
//     "headers": [
//       { "id": "name", "isPlaceholder": false },
//       { "id": "category", "isPlaceholder": false },
//       { "id": "price", "isPlaceholder": false },
//       { "id": "stock", "isPlaceholder": false }
//     ]
//   }
// ]

// Why placeholders?

// They make sure the header grid lines up perfectly in a <table> layout.
// Without placeholders, merged headers (colspan/rowspan) would break alignment.
// isPlaceholder = true means “don’t render anything here, it’s just a spacer to keep columns aligned under grouped headers.”

// table.getRowModel().rows
// This gives you all the rows in the current table model.
// Rows are built by react-table after applying sorting, filtering, pagination, etc.
// Example row object:
// {
//   "id": "0",
//   "original": { "name": "Book", "category": "Novel", "price": 200, "stock": 50 },
//   "index": 0,
//   "getVisibleCells": [...]
// }

// row.getVisibleCells()
// For each row, this returns its cells (columns visible in the table).
// Each cell knows:
// Which column it belongs to (cell.column)
// The data it should display (row.original[column.accessorKey])
// Example cell object:
// {
//   "id": "0_name",
//   "column": { "id": "name", "columnDef": { "header": "Name" } },
//   "row": { ... },
//   "getContext": { ... }
// }
// flexRender(cell.column.columnDef.cell, cell.getContext())
// react-table allows header and cell definitions to be React nodes OR functions.
// flexRender is a helper that:
// If cell is a string/ReactNode, renders it directly.
// If cell is a function, calls it with cell.getContext() (so it knows row/column data).

// { accessorKey: "price",
//   header: "Price",
//   cell: ({ row }) => <span>${row.original.price}</span> }
// flexRender will call that function with the row context.
// const products = [
//   { name: "Book", category: "Novel", price: 200, stock: 50 },
//   { name: "Pen", category: "Stationery", price: 20, stock: 100 },
// ];
// rendered table;
// <tr>   <-- row 1
//   <td>Book</td>
//   <td>Novel</td>
//   <td>200</td>
//   <td>50</td>
// </tr>

// <tr>   <-- row 2
//   <td>Pen</td>
//   <td>Stationery</td>
//   <td>20</td>
//   <td>100</td>
// </tr>
