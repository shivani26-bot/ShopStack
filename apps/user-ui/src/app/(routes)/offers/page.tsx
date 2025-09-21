"use client";

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Range } from "react-range";
import React, { useEffect, useState } from "react";
import ProductCard from "apps/user-ui/src/shared/components/cards/product-card";

const MIN = 0;
const MAX = 1199;
const Page = () => {
  const router = useRouter();
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1199]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [tempPriceRange, setTempPriceRange] = useState([0, 199]);

  const colors = [
    //       "#000000", //black
    //   "#ffffff", //white
    //   "#ff00ff", //magenta
    //   "#F87171", // red-400
    //   "#60A5FA", // blue-400
    //   "#FACC15", // yellow-400
    //   "#4ADE80", // green-400
    //   "#22D3EE", // cyan-400
    { name: "Black", code: "#000000" },
    { name: "White", code: "ffffff" },
    { name: "Red", code: "#F87171" },
    { name: "Green", code: "#00FF00" },
    { name: "Blue", code: "#60A5FA" },
    { name: "Yellow", code: "#FACC15" },
    { name: "Magenta", code: "#FF00FF" },
    { name: "Cyan", code: "#22D3EE" },
    // { name: "Black", code: "#000000" },
    // { name: "Red", code: "#FF0000" },
    // { name: "Green", code: "#00FF00" },
    // { name: "Blue", code: "#0000FF" },
    // { name: "Yellow", code: "#FFFF00" },
    // { name: "Magenta", code: "#FF00FF" },
    // { name: "Cyan", code: "#00FFFF" },
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  //builds a query string (?priceRange=...&categories=...) based on your selected filters and then updates the browser URL without reloading the page
  const updateURL = () => {
    const query = new URLSearchParams();
    query.set("priceRange", priceRange.join(","));
    if (selectedCategories.length > 0)
      query.set("categories", selectedCategories.join(","));
    if (selectedColors.length > 0)
      query.set("colors", selectedColors.join(","));
    if (selectedSizes.length > 0) query.set("sizes", selectedSizes.join(","));
    query.set("page", page.toString());
    router.replace(`/offers?${decodeURIComponent(query.toString())}`);
    // router.replace (Next.js) so it doesn’t add a new history entry (good for filters).ets you navigate to a new URL without adding a new entry in the browser’s history stack.
    // If you used router.push, the back button would step through every filter change.
  };

  const fetchFilteredProducts = async () => {
    setIsProductLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("priceRange", priceRange.join(","));
      if (selectedCategories.length > 0)
        query.set("categories", selectedCategories.join(","));
      if (selectedColors.length > 0)
        query.set("colors", selectedColors.join(","));
      if (selectedSizes.length > 0) query.set("sizes", selectedSizes.join(","));
      query.set("page", page.toString());
      query.set("limit", "12");
      const res = await axiosInstance.get(
        `/product/api/get-filtered-offers?${query.toString()}`
      );
      setProducts(res.data.products);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.log("Failed to fetch filtered products", error);
    } finally {
      setIsProductLoading(false);
    }
  };

  //while applying the filters we should must update the url as well
  useEffect(() => {
    updateURL(); //changes the /products url based on applied filters
    fetchFilteredProducts();
  }, [priceRange, selectedCategories, selectedColors, selectedSizes, page]);

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-categories");
      return res.data;
    },
    staleTime: 1000 * 60 * 30,
  });

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label)
        ? prev.filter((cat) => cat !== label)
        : [...prev, label]
    );
  };
  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((c) => c !== size) : [...prev, size]
    );
  };
  return (
    <div className="w-full bg-[#f5f5f5] pb-10">
      <div className="w-[90%] lg:w-[80%] m-auto">
        <div className="pb-[50px]">
          {/* leading-* controls line-height */}
          <h1 className="md:pt-[40px] font-medium text-[44px] leading-1 mb-[14px] font-jost">
            All Products
          </h1>
          <Link href={"/"} className="text-[#55585b]  hover:underline ">
            Home
          </Link>

          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span>All Products</span>
        </div>
        <div className="w-full flex flex-col lg:flex-row gap-8">
          {/* sidebar */}
          <aside className="w-full lg:w-[270px] !rounded bg-white p-4 space-y-6 shadow-md">
            <h3 className="text-xl font-Poppins font-medium">Price Filter</h3>
            <div className="ml-2">
              <Range
                step={1}
                min={MIN}
                max={MAX}
                values={tempPriceRange}
                onChange={(values) => setTempPriceRange(values)}
                renderTrack={({ props, children }) => {
                  const [min, max] = tempPriceRange;
                  const percentageLeft = ((min - MIN) / (MAX - MIN)) * 100;
                  const percentageRight = ((max - MIN) / (MAX - MIN)) * 100;
                  return (
                    <div
                      {...props}
                      className="h-[6px] bg-blue-200 rounded relative"
                      style={{ ...props.style }}
                    >
                      <div
                        {...props}
                        className="h-[6px] bg-blue-200 rounded relative"
                        style={{
                          left: `${percentageLeft}%`,
                          width: `${percentageRight - percentageLeft}%`,
                        }}
                      />
                      {children}
                    </div>
                  );
                }}
                renderThumb={({ props }) => {
                  const { key, ...rest } = props;
                  return (
                    <div
                      key={key}
                      {...rest}
                      className="w-[16px] h-[16px] bg-blue-600 rounded-full shadow-md"
                    />
                  );
                }}
              />
            </div>
            {/* we must need a button  otherwise when we change or filter  it will send a lot of request inside backend . adding a button will not send unusual request to backend 
            when we click on apply button it will change the url price range
            */}
            <div className="flex justify-between items-center mt-2">
              <div className="text-sm text-gray-600">
                {" "}
                ${tempPriceRange[0]} - ${tempPriceRange[1]}
              </div>
              <button
                onClick={() => {
                  setPriceRange(tempPriceRange);
                  setPage(1);
                }}
                className="text-sm px-4 py-1 bg-gray-200 hover:bg-blue-600 hover:text-white transition !rounded"
              >
                Apply
              </button>
            </div>

            {/* categories  */}
            {/* if we click the category it will change the url as well  */}
            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1">
              Categories
            </h3>
            <ul className="space-y-2 !mt-3">
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                data?.categories?.map((category: any) => (
                  <li key={category}>
                    <label className="flex items-center gap-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="accent-blue-600"
                      />
                      {category}
                    </label>
                  </li>
                ))
              )}
            </ul>

            {/* colors  */}
            {/* we we select the colors ,size,it will change from the url  */}
            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1 mt-6">
              Filter by Color
            </h3>
            <ul className="space-y-2 !mt-3">
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                colors.map((color: any) => (
                  <li key={color.name}>
                    <label className="flex items-center gap-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color.name)}
                        onChange={() => toggleColor(color.name)}
                        className="accent-blue-600"
                      />
                      <span
                        className="w-[16px] h-[16px] rounded-full border border-gray-200"
                        style={{ backgroundColor: color.code }}
                      ></span>
                      {color.name}
                    </label>
                  </li>
                ))
              )}
            </ul>

            {/* sizes */}
            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1 mt-6">
              Filter by Size
            </h3>
            <ul className="space-y-2 !mt-3">
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                sizes.map((size: any) => (
                  <li key={size}>
                    <label className="flex items-center gap-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size)}
                        onChange={() => toggleSize(size)}
                        className="accent-blue-600"
                      />
                      <span className="font-medium">{size}</span>
                    </label>
                  </li>
                ))
              )}
            </ul>
          </aside>

          {/* product grid  */}
          <div className="flex-1 px-2 lg:px-3">
            {isProductLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
                  ></div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  //   <div className="gap-5">
                  <ProductCard
                    key={product.id}
                    product={product}
                    isEvent={true}
                  />
                  //   </div>
                ))}
              </div>
            ) : (
              <p>No products found!</p>
            )}

            {/* pagination   */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-1 !rounded border border-gray-200 ttext-sm ${
                      page === i + 1
                        ? "bg-blue-600 text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
