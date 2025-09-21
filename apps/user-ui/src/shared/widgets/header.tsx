"use client";
import Link from "next/link";
import React, { useState } from "react";
import { Search } from "lucide-react";
import ProfileIcon from "../../assets/svgs/profile-icon";
import HeartIcon from "../../assets/svgs/heart-icon";
import CartIcon from "../../assets/svgs/cart-icon";
import HeaderBottom from "./header-bottom";
import useUser from "../../hooks/useUser";
import { useStore } from "../../store";
import ShopStackLogo from "../../assets/svgs/shop-stack-logo";
import axiosInstance from "../../utils/axiosInstance";
import useLayout from "../../hooks/useLayout";
import Image from "next/image";
const Header = () => {
  const { user, isError, isLoading } = useUser();
  const { layout } = useLayout();
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleSearchclick = async () => {
    if (!searchQuery.trim()) return;
    setLoadingSuggestions(true);
    try {
      //       encodeURIComponent(searchQuery): This function safely encodes the search query so it can be used in a URL.
      // Why? Because users might type spaces or special characters.
      // Without encoding:/search-products?q=gaming laptop & mouse
      // With encoding:/search-products?q=gaming%20laptop%20%26%20mouse

      const res = await axiosInstance.get(
        `/product/api/search-products?q=${encodeURIComponent(searchQuery)}`
      );
      setSuggestions(res.data.products.slice(0, 10));
    } catch (error) {
      console.log("error while searching", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };
  return (
    <div className="w-full bg-white">
      <div className="w-[80%] py-5 m-auto flex items-center justify-between ">
        {/* <div> */}
        <Link href={"/"}>
          {/* <span className="text-3xl font-[500]"> */}
          {/* <ShopStackLogo /> */}
          {/* </span> */}
          <Image
            src={layout?.logo || undefined}
            width={300}
            height={100}
            alt="logo image"
            className="h-[70px] ml-[-50px] mb-[-30px] object-cover"
          />
        </Link>
        {/* </div> */}

        <div className="w-[50%] relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for products..."
            className="w-full px-4 font-Poppins font-medium border-[2.5px] border-[#3489FF] outline-none h-[55px]"
          />
          <div
            onClick={handleSearchclick}
            className="w-[60px] cursor-pointer flex items-center justify-center h-[55px] bg-[#3489FF] absolute top-0 right-0 "
          >
            {/* <input type="text"  placeholder="Search for products..." className="w-full px-4 font-poppins" /> */}
            <Search color="#fff" />
          </div>
          {suggestions.length > 0 && (
            <div className="absolute w-full top-[60px] bg-white border border-gray-200 rounded-md shadow-lg z-50">
              {suggestions.map((item) => (
                <Link
                  href={`/product/${item.slug}`}
                  key={item.id}
                  onClick={() => {
                    setSuggestions([]);
                    setSearchQuery("");
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                >
                  {item.title}
                </Link>
              ))}
              {loadingSuggestions && (
                <div className="px-4 py-2 text-sm text-gray-500 border-t border-gray-100">
                  Searching...
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            {/* <Link> is a special component from next/link that enables client-side navigation between pages in your app — meaning the browser doesn’t do a full refresh, making page transitions faster. */}
            {!isLoading && user ? (
              <>
                <Link
                  href={"/profile"}
                  className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]"
                >
                  <ProfileIcon />
                </Link>
                <Link href={"/profile"}>
                  <span className="block font-medium">Hello,</span>
                  <span className="font-semibold">
                    {user?.name?.split(" ")[0]}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={"/login"}
                  className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a]"
                >
                  <ProfileIcon />
                </Link>
                <Link href={"/login"}>
                  <span className="block font-medium">Hello,</span>
                  <span className="font-semibold">
                    {isLoading ? "..." : "Sign in"}
                  </span>
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-5">
            <Link href={"/wishlist"} className="relative">
              <HeartIcon />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]  ">
                <span className="text-white font-medium text-sm">
                  {wishlist?.length}
                </span>
              </div>
            </Link>
            <Link href={"/cart"} className="relative">
              <CartIcon />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]  ">
                <span className="text-white font-medium text-sm">
                  {cart?.length}+
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div className="border-b border-b-[#99999938]" />
      <HeaderBottom />
    </div>
  );
};

export default Header;
