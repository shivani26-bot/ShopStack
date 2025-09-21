"use client"; //mark a component as a Client Component instead of a Server Component (which is the default).

import { AlignLeft, ChevronDown, HeartIcon } from "lucide-react";
// Why it's needed
// By default, all components in app/ are Server Components — they:
// Render on the server
// Don’t include browser-only JavaScript
// Can’t use React hooks like useState, useEffect, useRef
// Can’t access browser APIs (window, document, etc.)

// When you need Client Component:
// State (useState)
// Lifecycle methods (useEffect)
// Event handlers (onClick, onChange, etc.)
// Browser APIs (localStorage, cookies from browser, etc.)
import React, { useEffect, useState } from "react";
import { navItems } from "../../configs/constants";
import Link from "next/link";
import CartIcon from "../../assets/svgs/cart-icon";
import ProfileIcon from "../../assets/svgs/profile-icon";
import useUser from "../../hooks/useUser";
import { useStore } from "../../store";

const HeaderBottom = () => {
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const { user, isLoading } = useUser();
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);
  console.log("user", user);
  //track scroll position
  // runs once after the component mounts ([] dependency array).
  // adds a scroll event listener to window that:
  // Checks how far down the page is scrolled (window.scrollY).
  // If the scroll position is more than 100px, it sets isSticky = true.
  // component unmounts, it removes the event listener to prevent memory leaks.
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <div
      className={`w-full transition-all duration-300 ${
        isSticky
          ? "fixed top-0 left-0  z-[100] bg-white  shadow-lg"
          : "relative"
      }`}
    >
      <div
        className={`w-[80%] relative m-auto flex items-center justify-between ${
          isSticky ? "pt-3" : "py-0"
        } `}
      >
        {/* add all dropdowns  */}
        <div
          className={`w-[260px] ${
            isSticky && "-mb-2"
          } cursor-pointer flex items-center justify-between px-5 h-[50px] bg-[#3489ff]`}
          onClick={() => setShow(!show)}
        >
          <div className="flex items-center gap-2">
            <AlignLeft color="white" />
            <span className="text-white font-medium">All Departments</span>
          </div>
          <ChevronDown color="white" />
        </div>
        {/* dropdown menu  */}
        {show && (
          <div
            className={`absolute left-0 ${
              isSticky ? "top-[70px]" : "top-[50px]"
            } w-[260px] h-[400px] bg-[#f5f5f5]`}
          ></div>
        )}

        {/* navigation links  */}
        <div className="flex items-center">
          {navItems.map((i: NavItemsTypes, index: number) => (
            <Link
              className="px-5 font-medium text-lg"
              href={i.href}
              key={index}
            >
              {i.title}
            </Link>
          ))}
        </div>
        <div>
          {isSticky && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderBottom;
