"use client";

import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import Link from "next/link";
import { useRouter } from "next/navigation";

import React, { useEffect, useState } from "react";
import { categories } from "apps/user-ui/src/configs/categories";
import ShopCard from "apps/user-ui/src/shared/components/cards/shop-card";
import { countries } from "apps/user-ui/src/configs/countries";

//filter shops by countries
const Page = () => {
  const router = useRouter();
  const [isShopLoading, setIsShopLoading] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [shops, setShops] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  //builds a query string (?priceRange=...&categories=...) based on your selected filters and then updates the browser URL without reloading the page
  const updateURL = () => {
    const query = new URLSearchParams();

    if (selectedCategories.length > 0)
      query.set("categories", selectedCategories.join(","));
    if (selectedCountries.length > 0)
      query.set("countries", selectedCountries.join(","));
    query.set("page", page.toString());
    router.replace(`/shops?${decodeURIComponent(query.toString())}`);
    // router.replace (Next.js) so it doesn’t add a new history entry (good for filters).ets you navigate to a new URL without adding a new entry in the browser’s history stack.
    // If you used router.push, the back button would step through every filter change.
  };

  const fetchFilteredShops = async () => {
    setIsShopLoading(true);
    try {
      const query = new URLSearchParams();

      if (selectedCategories.length > 0)
        query.set("categories", selectedCategories.join(","));
      if (selectedCountries.length > 0)
        query.set("countries", selectedCountries.join(","));
      query.set("page", page.toString());
      query.set("limit", "12");
      const res = await axiosInstance.get(
        `/product/api/get-filtered-shops?${query.toString()}`
      );
      setShops(res.data.shops);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.log("Failed to fetch filtered products", error);
    } finally {
      setIsShopLoading(false);
    }
  };

  //while applying the filters we should must update the url as well
  useEffect(() => {
    updateURL(); //changes the /products url based on applied filters
    fetchFilteredShops();
  }, [selectedCategories, selectedCountries, page]);

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label)
        ? prev.filter((cat) => cat !== label)
        : [...prev, label]
    );
  };
  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country]
    );
  };

  return (
    <div className="w-full bg-[#f5f5f5] pb-10">
      <div className="w-[90%] lg:w-[80%] m-auto">
        <div className="pb-[50px]">
          {/* leading-* controls line-height */}
          <h1 className="md:pt-[40px] font-medium text-[44px] leading-1 mb-[14px] font-jost">
            All Shops
          </h1>
          <Link href={"/"} className="text-[#55585b]  hover:underline ">
            Home
          </Link>

          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span>All Shops</span>
        </div>
        <div className="w-full flex flex-col lg:flex-row gap-8">
          {/* sidebar */}
          <aside className="w-full lg:w-[270px] !rounded bg-white p-4 space-y-6 shadow-md">
            {/* categories  */}
            {/* if we click the category it will change the url as well  */}
            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1">
              Categories
            </h3>
            <ul className="space-y-2 !mt-3">
              {categories?.map((category: any, index) => (
                <li key={index}>
                  <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.value)}
                      onChange={() => toggleCategory(category.value)}
                      className="accent-blue-600"
                    />
                    {category.label}
                  </label>
                </li>
              ))}
            </ul>

            <h3 className="text-xl font-Poppins font-medium border-b border-b-slate-300 pb-1">
              Countries
            </h3>
            <ul className="space-y-2 !mt-3">
              {countries?.map((country: any, index) => (
                <li key={index}>
                  <label className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedCountries.includes(country)}
                      onChange={() => toggleCountry(country)}
                      className="accent-blue-600"
                    />
                    {country}
                  </label>
                </li>
              ))}
            </ul>
          </aside>

          {/* shop grid  */}
          <div className="flex-1 px-2 lg:px-3">
            {isShopLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
                  ></div>
                ))}
              </div>
            ) : shops.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {shops.map((shop) => (
                  //   <div className="gap-5">
                  <ShopCard key={shop.id} shop={shop} />
                  //   </div>
                ))}
              </div>
            ) : (
              <p>No Shops found!</p>
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
