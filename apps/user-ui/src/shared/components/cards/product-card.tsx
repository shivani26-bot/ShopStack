import Link from "next/link";
import React, { useEffect, useState } from "react";
import Ratings from "../ratings";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import ProductDetailsCard from "./product-details-card";
import { useStore } from "apps/user-ui/src/store";
import useUser from "apps/user-ui/src/hooks/useUser";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";

const ProductCard = ({
  product,
  isEvent,
}: {
  product: any;
  isEvent?: boolean;
}) => {
  const [timeLeft, setTimeLeft] = useState("");
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const [open, setOpen] = useState(false);
  const addToCart = useStore((state: any) => state.addToCart);
  const addToWishList = useStore((state: any) => state.addToWishList);
  const removeFromWishList = useStore((state: any) => state.removeFromWishList);
  const wishlist = useStore((state: any) => state.wishlist);
  //   some: Tests whether at least one element in the array passes the condition (callback).
  // Returns a boolean (true or false).
  // Stops checking once it finds the first match.
  //   Tests whether all elements in the array pass the condition (callback).
  // Returns a boolean.
  // Stops checking once it finds the first failure.
  const isWishlisted = wishlist.some((item: any) => item.id === product.id); //check if item is wishlisted or not
  const cart = useStore((state: any) => state.cart);
  const isInCart = cart.some((item: any) => item.id === product.id); //check if item is in cart or not

  useEffect(() => {
    //if product is an event or on offer , then we can show a time left for this offer
    if (isEvent && product?.ending_date) {
      //endTime → timestamp of the offer’s ending date.
      const interval = setInterval(() => {
        const endTime = new Date(product.ending_date).getTime();
        const now = Date.now();
        const diff = endTime - now;
        if (diff <= 0) {
          setTimeLeft("Expired");
          clearInterval(interval);
          return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24)); //milliseconds in a day.
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24); //hours remainder after removing days.
        const minutes = Math.floor((diff / (1000 * 60)) % 60); //minutes remainder after removing hours.
        setTimeLeft(`${days}d ${hours}h ${minutes}m left with this price`);
      }, 60000); //runs a function repeatedly every 60,000 ms (1 minute). 1000ms=1s
      return () => clearInterval(interval); //component unmounts or effect re-runs, the interval is cleared to prevent memory leaks.
    }
  }, [isEvent, product?.ending_date]);
  return (
    <div className="w-full min-h-[350px]  bg-white rounded-lg relative">
      {isEvent && (
        <div className="absolute top-2 left-2 bg-red-600 text-white font-semibold rounded-sm shadow-md">
          OFFER
        </div>
      )}
      {product?.stock <= 5 && (
        <div className="absolute top-2 right-2 bg-yellow-400 text-slate-700 text-[10px] font-semibold  ">
          Limited Stock
        </div>
      )}
      <Link href={`/product/${product?.slug}`}>
        <img
          src={
            product?.images[0]?.url ||
            "https://media.istockphoto.com/id/1353930786/photo/triangular-alert-caution-sign-inside-round-chat-bubble.jpg?s=1024x1024&w=is&k=20&c=HGvYXWSL7BDm5XVVQ-KSdvQe2XhPSc0aY6eS1XKhBok="
          }
          alt={product?.title}
          width={300}
          height={300}
          className="w-full h-[200px] object-cover mx-auto rounded-t-md"
        />
      </Link>
      <Link
        href={`/shop/${product?.Shop?.id}`}
        className="block text-blue-500 text-sm font-medium my-2 px-2"
      >
        {product?.Shop?.name}
      </Link>
      <Link href={`/product/${product?.slug}`}>
        <h3 className="text-base font-semibold px-2 text-gray-800 line-clamp-1 ">
          {product?.title}
        </h3>
      </Link>
      <div className="mt-2 px-2">
        <Ratings rating={product?.ratings} />
      </div>

      <div className="mt-3 flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            ${product?.sale_price}
          </span>
          <span className="text-sm line-through text-gray-400">
            ${product?.regular_price}
          </span>
        </div>
        <span className="text-sm font-medium text-green-500">
          {product?.totalSales} sold
        </span>
      </div>
      {isEvent && timeLeft && (
        <div className="mt-2">
          <span className="inline-block bg-orange-100 text-red">
            {timeLeft}
          </span>
        </div>
      )}
      <div className="absolute z-10 flex flex-col gap-3 right-3 top-10">
        <div className="bg-white rounded-full p-[6px] shadow-md">
          <Heart
            className="cursor-pointer hover:scale-110 transition"
            size={22}
            fill={isWishlisted ? "red" : "transparent"}
            stroke={isWishlisted ? "red" : "#485563"}
            // Never call setState / set / Zustand store updates while React is rendering JSX. Always trigger updates inside useEffect, useCallback, or event handlers
            //  React sees this as: while rendering ProductCard, you are mutating global state, which triggers another render immediately → infinite loop risk → React throws that warning :Cannot update a component while rendering a different component
            // Because when React evaluates your JSX, it executes the function immediately (instead of waiting for a click).
            // onClick={
            //   isWishlisted
            //     ? removeFromWishList(product.id, user, location, deviceInfo)
            //     : addToWishList(
            //         { ...product, quantity: 1 },
            //         user,
            //         location,
            //         deviceInfo
            //       )
            // }

            onClick={() => {
              isWishlisted
                ? removeFromWishList(product.id, user, location, deviceInfo)
                : addToWishList(
                    { ...product, quantity: 1 },
                    user,
                    location,
                    deviceInfo
                  );
            }}
          />
        </div>
        <div className="bg-white rounded-full p-[6px] shadow-md">
          <Eye
            className="cursor-pointer text-[#4b5563] hover:scale-110 transition"
            size={22}
            onClick={() => setOpen(!open)}
          />
        </div>
        <div className="bg-white rounded-full p-[6px] shadow-md">
          <ShoppingBag
            className="cursor-pointer text-[#4b5563] hover:scale-110 transition"
            size={22}
            stroke={isInCart ? "green" : "black"}
            onClick={() =>
              !isInCart &&
              addToCart({ ...product, quantity: 1 }, user, location, deviceInfo)
            }
          />
        </div>
      </div>
      {open && <ProductDetailsCard data={product} setOpen={setOpen} />}
    </div>
  );
};

export default ProductCard;
