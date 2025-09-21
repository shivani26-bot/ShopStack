"use client";
import React from "react";
import Hero from "../shared/hero";
import SectionTitle from "../shared/components/section/section-title";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import ProductCard from "../shared/components/cards/product-card";
import ShopCard from "../shared/components/cards/shop-card";

const Page = () => {
  const {
    data: products, //Whatever your queryFn returns → that’s what data will be. Because you wrote data: products, you just renamed data to products
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/recommendation/api/get-recommendation-products"
      );
      console.log(res);
      return res.data.recommendations;
    },
    staleTime: 1000 * 60 * 5,
  });

  //fetch latest products
  const { data: latestProducts, isLoading: latestProductsLoading } = useQuery({
    queryKey: ["latest-products"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/product/api/get-all-products?page=1&limit=10&type=latest"
      );
      return res.data.products;
    },
    staleTime: 1000 * 60 * 2,
  });

  //top shops
  const { data: shops, isLoading: shopLoading } = useQuery({
    queryKey: ["shops"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/top-shops");
      return res.data.shops;
    },
    staleTime: 1000 * 60 * 2,
  });

  //get all events
  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/product/api/get-all-events?page=1&limit=10"
      );
      console.log("offers", res.data);
      return res.data.events;
    },
    staleTime: 1000 * 60 * 2,
  });
  return (
    <div className="bg-[#f5f5f5] min-h-screen overflow-y-auto">
      {" "}
      <Hero />
      <div className="md:w-[80%] w-[90%] my-10 m-auto">
        <div className="mb-8">
          <SectionTitle title="Suggested Products" />
        </div>

        {isLoading && (
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5 ">
            {/* show this when our product is loading  */}
            {/* Array.from is a built-in JavaScript method that creates a new array from something that looks like an array (array-like or iterable object). */}
            {/* pass an object with {length:10} means make an array with 10 empty slots  */}
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
              ></div>
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5 ">
            {products?.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {products?.length === 0 && (
          <p className="text-center">No products available yet!</p>
        )}

        {/* latest prouduct */}
        {latestProductsLoading && (
          <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
              ></div>
            ))}
          </div>
        )}
        <div className="my-8 block">
          <SectionTitle title="Latest Products" />
        </div>
        {!latestProductsLoading && !isError && (
          <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {latestProducts?.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {latestProducts?.length === 0 && (
          <p className="text-center">No products available yet!</p>
        )}

        <div className="my-8 block">
          <SectionTitle title="Top Shops" />
        </div>
        {!shopLoading && !isError && (
          <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {shops?.map((shop: any) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
        {shops?.length === 0 && (
          <p className="text-center">No shops available yet!</p>
        )}

        <div className="my-8 block">
          <SectionTitle title="Top Offers" />
        </div>
        {!offersLoading && !isError && (
          <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-5">
            {offers?.map((product: any) => (
              <ProductCard key={product.id} product={product} isEvent={true} />
            ))}
          </div>
        )}
        {offers?.length === 0 && (
          <p className="text-center">No offers available yet!</p>
        )}
      </div>
    </div>
  );
};

export default Page;
