"use client";
import {
  ChevronLeft,
  Heart,
  MapPin,
  MessageSquareText,
  Package,
  WalletMinimal,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import ReactImageMagnify from "react-image-magnify";
import Ratings from "../../components/ratings";
import Link from "next/link";
import { useStore } from "apps/user-ui/src/store";
import useUser from "apps/user-ui/src/hooks/useUser";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";
import CartIcon from "apps/user-ui/src/assets/svgs/cart-icon";
import ProductCard from "../../components/cards/product-card";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { isProtected } from "apps/user-ui/src/utils/protected";
import { useRouter } from "next/navigation";

const ProductDetails = ({ productDetails }: { productDetails: any }) => {
  const [currentImage, setCurrentImage] = useState(
    productDetails?.images[0]?.url
  );
  const [isChatLoading, setIsChatLoading] = useState(false);
  const router = useRouter();
  console.log("pd", productDetails);
  const [currentIndex, setcurrentIndex] = useState(0);
  const [isSelected, setIsSelected] = useState(
    productDetails?.colors?.[0] || ""
  );
  const [isSizeSelected, setIsSizeSelected] = useState(
    productDetails?.sizes?.[0] || ""
  );

  const [quantity, setQuantity] = useState(1);
  const [priceRange, setPriceRange] = useState([
    productDetails?.sale_price,
    1199,
  ]);

  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const { user, isLoading } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const addToCart = useStore((state: any) => state.addToCart);
  const addToWishList = useStore((state: any) => state.addToWishList);
  const removeFromWishList = useStore((state: any) => state.removeFromWishList);
  const wishlist = useStore((state: any) => state.wishlist);
  const isWishlisted = wishlist.some(
    (item: any) => item.id === productDetails.id
  ); //check if item is wishlisted or not
  const cart = useStore((state: any) => state.cart);
  const isInCart = cart.some((item: any) => item.id === productDetails.id); //check if item is in cart or not

  //for navigating to previous image
  const prevImage = () => {
    if (currentIndex > 0) {
      setcurrentIndex(currentIndex - 1);
      setCurrentImage(productDetails?.images[currentIndex - 1]);
    }
  };

  const nextImage = () => {
    if (currentIndex < productDetails?.images?.length) {
      setcurrentIndex(currentIndex + 1);
      setCurrentImage(productDetails?.images[currentIndex + 1]);
    }
  };

  const discountPercentage = Math.round(
    ((productDetails.regular_price - productDetails.sale_price) /
      productDetails.regular_price) *
      100
  );

  const fetchFilteredProducts = async () => {
    try {
      // built-in JavaScript class for working with query strings (the ?key=value&key2=value2 part of a URL).
      // Creating it with new URLSearchParams() makes an empty query object that you can add key-value pairs to.
      //       query.set("key", "value") → sets/replaces a parameter.
      // query.append("key", "value") → adds another value for same key.
      // query.get("key") → retrieves a value.
      // query.delete("key") → removes a parameter.
      // query.toString() → returns the final query string.
      const query = new URLSearchParams();

      query.set("priceRange", priceRange.join(",")); //sets/replaces a parameter
      query.set("page", "1");
      query.set("limit", "5");
      console.log("q", query); //returns size:3
      //       .toString() does on URLSearchParams
      // It converts the internal key-value pairs into a query string that can be appended to a URL.
      //       const params = new URLSearchParams();
      // params.set("priceRange", "100,200");
      // params.set("page", "1");
      // params.set("limit", "5");
      // console.log(params.toString()); priceRange=100%2C200&page=1&limit=5,Keys and values are URL-encoded (100,200 → 100%2C200 because , is encoded). it's just a string not an object

      // http://localhost:8080/product/api/get-filtered-products?priceRange=69.99%2C1199&page=1&limit=5
      const res = await axiosInstance.get(
        `/product/api/get-filtered-products?${query.toString()}`
      );
      setRecommendedProducts(res.data.products);
    } catch (error) {
      console.error("failed to fetch filtered products", error);
    }
  };

  useEffect(() => {
    fetchFilteredProducts();
  }, [priceRange]);

  const handleChat = async () => {
    if (isChatLoading) {
      return;
    }
    setIsChatLoading(true);
    try {
      const res = await axiosInstance.post(
        "/chatting/api/create-user-conversationGroup",
        { sellerId: productDetails?.Shop?.sellerId },
        isProtected
      );
      router.push(`/inbox?conversationId=${res.data.conversation.id}`);
    } catch (error) {
      console.log(error);
    } finally {
      setIsChatLoading(false);
    }
  };

  console.log("recproduct", recommendedProducts);
  return (
    <div className="w-full bg-[#f5f5f5] py-2">
      {/* lg:grid-cols-[28%_44%_28%] → custom 3-column layout at large breakpoints */}
      <div className="w-[90%] bg-white lg:w-[80%] mx-auto pt-6 grid grid-cols-1 lg:grid-cols-[28%_44%_28%] gap-6 overflow-hidden ">
        {/* left column  */}
        <div className="p-4">
          <div className="relative w-full ">
            <ReactImageMagnify
              {...{
                smallImage: {
                  alt: "product image",
                  isFluidWidth: true,
                  src:
                    currentImage ||
                    "https://ik.imagekit.io/11iwzzqkk/products/No_Image_Available.jpg?updatedAt=1756399207930",
                },
                largeImage: {
                  src:
                    currentImage ||
                    "https://ik.imagekit.io/11iwzzqkk/products/No_Image_Available.jpg?updatedAt=1756399207930",
                  width: 1200,
                  height: 1200,
                },
                enlargedImageContainerStyle: {
                  zIndex: 50,
                  background: "#fff",
                },
                enlargedImageContainerDimensions: {
                  width: "150%",
                  height: "150%",
                },
                enlargedImageStyle: {
                  border: "none",
                  boxShadow: "none",
                },
                enlargedImagePosition: "right",
              }}
            />
          </div>
          {/* thumbnnail images  */}
          <div className="relative flex items-center gap-2 mt-4 overflow-hidden">
            {productDetails?.images?.length > 4 && (
              <button
                className="absolute left-0 bg-white p-2 rounded-full shadow-md z-10"
                onClick={prevImage}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div className="flex gap-2 overflow-x-auto">
              {productDetails?.images?.map((img: any, index: number) => (
                <Image
                  key={index}
                  src={
                    img?.url ||
                    "https://ik.imagekit.io/11iwzzqkk/products/No_Image_Available.jpg?updatedAt=1756399207930"
                  }
                  alt="thumbnail"
                  width={60}
                  height={60}
                  className={`cursor-pointer border rounded-lg p-1 ${
                    currentImage === img ? "border-blue-500" : "border-gray-300"
                  }`}
                  onClick={() => {
                    setcurrentIndex(index);
                    setCurrentImage(img.url);
                  }}
                />
              ))}
            </div>
            {productDetails?.images?.length > 4 && (
              <button
                className="absolute left-0 bg-white p-2 rounded-full shadow-md z-10"
                onClick={nextImage}
                disabled={currentIndex === productDetails?.images?.length - 1}
              >
                <ChevronLeft size={24} />
              </button>
            )}
          </div>
        </div>
        {/* middle column - product details */}
        <div className="p-4">
          <h1 className="text-xl mb-2 font-medium">{productDetails?.title}</h1>
          <div className="w-full flex items-center justify-between">
            <div className="flex gap-2 mt-2 text-yellow-500">
              <Ratings rating={productDetails?.rating} />
              <Link href={"#reviews"} className="text-blue-500 hover:underline">
                (0 Reviews)
              </Link>
            </div>
            <div>
              <Heart
                className="cursor-pointer hover:scale-110 transition"
                size={22}
                fill={isWishlisted ? "red" : "transparent"}
                color={isWishlisted ? "transparent" : "#777"}
                onClick={() => {
                  isWishlisted
                    ? removeFromWishList(
                        productDetails.id,
                        user,
                        location,
                        deviceInfo
                      )
                    : addToWishList(
                        { ...productDetails, quantity },
                        user,
                        location,
                        deviceInfo
                      );
                }}
              />
            </div>
          </div>
          <div className="py-2 border-b border-gray-200">
            <span className="text-gray-500">
              Brand:{" "}
              <span className="text-blue-500">
                {productDetails?.brand || "No Brand"}
              </span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-orange-500">
              ${productDetails?.sale_price}
            </span>{" "}
            <div className="flex gap-2 pb-2 text-lg border-b border-b-slate-200">
              <span className="text-gray-400 line-through">
                ${productDetails?.regular_price}
              </span>{" "}
              <span className="text-gray-500">-{discountPercentage}%</span>
            </div>
            <div className="mt-2">
              <div className="flex flex-col items-start gap-5 mt-4">
                <div>
                  {productDetails?.colors?.length > 0 && (
                    <div>
                      <strong>Color:</strong>{" "}
                      <div className="flex gap-2 mt-1">
                        {productDetails?.colors?.map(
                          (color: string, index: number) => (
                            <button
                              key={index}
                              className={`w-8 h-8  cursor-pointer rounded-full border-2 transition ${
                                isSelected === color
                                  ? "border-gray-400 scale-110 shadow-md"
                                  : "border-transparent"
                              }`}
                              onClick={() => setIsSelected(color)}
                              style={{ backgroundColor: color }}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* size options  */}
                {productDetails?.sizes?.length > 0 && (
                  <div>
                    <strong>Size</strong>{" "}
                    <div className="flex gap-2 mt-1">
                      {productDetails?.sizes?.map(
                        (size: string, index: number) => (
                          <button
                            key={index}
                            className={`px-4 py-1 cursor-pointer rounded-full border-2 transition ${
                              isSizeSelected === size
                                ? "bg-gray-800 text-white"
                                : "bg-gray-300 text-black"
                            }`}
                            onClick={() => setIsSizeSelected(size)}
                          >
                            {size}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md">
                  <button
                    className="px-3 cursor-pointer py-1 bg-gray-300 hover:bg-gray-400 text-black font-semibold rounded-l-md"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  >
                    -
                  </button>
                  <span className="px-4 bg-gray-100 py-1">{quantity}</span>
                  <button
                    className="px-3 cursor-pointer py-1 bg-gray-300 hover:bg-gray-400 text-black font-semibold rounded-l-md"
                    onClick={() => setQuantity((prev) => prev + 1)}
                  >
                    +
                  </button>
                </div>

                {productDetails?.stock > 0 ? (
                  <span className="text-green-600 font-semibold">
                    {" "}
                    In Stock{" "}
                    <span className="text-gray-500 font-medium">
                      (Stock {productDetails?.stock})
                    </span>
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">
                    {" "}
                    Out of Stock
                  </span>
                )}
              </div>
              <button
                className={`flex mt-6 items-center gap-2 px-5 py-[10px] bg-[#ff5722] hover:bg-[#e64a19] text-white font-medium rounded-lg transition ${
                  isInCart ? "cursor-not-allowed" : "cursor-pointer"
                }`}
                disabled={isInCart || productDetails?.stock === 0}
                onClick={() =>
                  addToCart(
                    {
                      ...productDetails,
                      quantity,
                      selectedOptions: {
                        color: isSelected,
                        size: isSizeSelected,
                      },
                    },
                    user,
                    location,
                    deviceInfo
                  )
                }
              >
                <CartIcon size={18} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
        {/* right column -seller info */}
        <div className="bg-[#fafafa] -mt-6">
          <div className="mb-1 p-3 border-b border-b-gray-100">
            <span className="text-sm text-gray-600">Delivery Option </span>
            <div className="flex items-center text-gray-600 gap-1">
              <MapPin size={18} className="ml-[-5px]" />
              {/* users current location  */}
              <span className="text-lg font-normal">
                {location?.city + "," + location?.country}
              </span>{" "}
            </div>
          </div>
          <div className="mb-1 px-3 pb-1 border-b border-b-gray-100">
            {" "}
            <span className="text-sm text-gray-600">Return & Warranty</span>
            <div className="flex items-center text-gray-600 gap-1">
              <Package size={18} className="ml-[-5px]" />
              <span className="text-base font-normal">7 Days Returns</span>
            </div>
            <div className="flex items-center py-2 text-gray-600 gap-1">
              <WalletMinimal size={18} className="ml-[-5px]" />
              <span className="text-base font-normal">
                Warranty not available{" "}
              </span>
            </div>
          </div>
          <div className="px-3 py-1">
            <div className="w-[85%] rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600 font-light">
                    Sold by
                  </span>
                  <span className="block max-w-[150px] truncate font-medium text-lg">
                    {productDetails?.Shop?.name}
                  </span>
                </div>
                <Link
                  href={"#"}
                  onClick={() => handleChat()}
                  className="text-blue-500 text-sm flex items-center gap-1"
                >
                  <MessageSquareText />
                  Chat now
                </Link>
                {/* seller performance stats  */}
              </div>
              {/* 3-column grid */}
              <div className="grid grid-cols-3 gap-2 border-t border-t-gray-200 mt-3 pt-3">
                <div>
                  <p className="text-[12px] text-gray-500">
                    Positive Seller Ratings
                  </p>
                  <p className="text-lg font-semibold">88%</p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500">Ship on Time</p>
                  <p className="text-lg font-semibold">100%</p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500">
                    Chat Response Rate
                  </p>
                  <p className="text-lg font-semibold">100%</p>
                </div>
              </div>
              {/* go to store  */}
              <div className="text-center mt-4 border-t border-t-gray-200 pt-2">
                <Link
                  href={`/shop/${productDetails?.Shop?.id}`}
                  className="text-blue-500 font-medium text-sm hover:underline"
                >
                  Go to Store
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-[90%] lg:w-[80%] mx-auto mt-5">
        <div className="bg-white min-h-[60vh] h-full p-5">
          <h3 className="text-lg font-semibold">
            Product details of {productDetails?.title}
          </h3>
          <div
            className="prose prose-sm text-slate-400 max-w-none"
            dangerouslySetInnerHTML={{
              __html: productDetails?.detailed_description,
            }}
          />
        </div>
      </div>
      <div className="w-[90%] lg:w-[80%] mx-auto mt-5">
        <div className="bg-white min-h-[50vh] h-full p-5">
          <h3 className="text-lg font-semibold">
            Ratings & Reviews of {productDetails?.title}
          </h3>
          <p className="text-center pt-14">No Reviews available yet!</p>
        </div>
      </div>

      <div className="w--90%] lg:w-[80%] mx-auto">
        <div className="w-full h-full my-5 p-5">
          <h3 className="text-xl font-semibold mb-2">You may also like</h3>{" "}
          <div className="m-auto grid grid-col-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {recommendedProducts?.map((i: any) => (
              <ProductCard key={i.id} product={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

// Use --legacy-peer-deps
// Installs the package ignoring the peer dependency mismatch:
// npm install react-image-magnify --legacy-peer-deps
// https://www.npmjs.com/package/react-image-magnify

// object-fit: cover | contain;
// object-cover
// The image fills the container completely.
// It maintains the aspect ratio (does not stretch), but it may crop parts of the image if its aspect ratio doesn’t match the container.
// object-contain
// The image is scaled down to fit entirely within the container.
// It maintains the aspect ratio, but there may be empty space (padding-like effect) around the image if the container’s aspect ratio doesn’t match.

// Since this (product-details) is a client-side component, and we are importing it inside a server-side component, it causes a full reload every time we modify something in it. Sometimes this behavior can be useful, but in our case it is not, because it triggers many reloads. Our server detects this as unusual activity and, as a protection mechanism, blocks the IP and stops sending responses to the client.

// Explanation in Detail
// In Next.js (or similar frameworks), components can be either:
// Server components → Rendered on the server by default.
// Client components → Declared with "use client", rendered in the browser.
// When you import a client component inside a server component, the framework needs to handle hydration (loading the server-rendered page, then attaching client-side interactivity).
// During development, if you modify a client component that is imported into a server component, the dev server often triggers a full reload instead of a partial hot reload.
// This means your entire app reloads repeatedly as you make changes, instead of just re-rendering the updated client component.
// Too many reloads can look like suspicious traffic to your backend server (especially if it’s behind a firewall, rate limiter, or bot protection).
// As a result, the server may temporarily block your IP, thinking you’re sending too many requests too quickly.

// ✅ In short: Importing client components into server components can cause excessive reloads during development, which might make your server think it’s under attack and block requests.
