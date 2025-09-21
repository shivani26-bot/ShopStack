import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import shopProfile from "../../../assets/icons/shop-profiile.png";
import Ratings from "../ratings";
import { Heart, MapPin, X } from "lucide-react";
import { useRouter } from "next/navigation";
import CartIcon from "apps/user-ui/src/assets/svgs/cart-icon";
import { useStore } from "apps/user-ui/src/store";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";
import useUser from "apps/user-ui/src/hooks/useUser";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { isProtected } from "apps/user-ui/src/utils/protected";

const ProductDetailsCard = ({
  data,
  setOpen,
}: {
  data: any;
  setOpen: (open: boolean) => void;
}) => {
  console.log("dat", data);
  const [activeImage, setActiveImage] = useState(0);
  const [isSelected, setIsSelected] = useState(data?.colors?.[0] || "");
  const [isSizeSelected, setIsSizeSelected] = useState(data?.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const addToCart = useStore((state: any) => state.addToCart);
  const addToWishList = useStore((state: any) => state.addToWishList);
  const removeFromWishList = useStore((state: any) => state.removeFromWishList);
  const wishlist = useStore((state: any) => state.wishlist);
  const isWishlisted = wishlist.some((item: any) => item.id === data.id); //check if item is wishlisted or not
  const cart = useStore((state: any) => state.cart);
  const isInCart = cart.some((item: any) => item.id === data.id); //check if item is in cart or not
  const router = useRouter();
  const handleChat = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await axiosInstance.post(
        "/chatting/api/create-user-conversationGroup",
        { sellerId: data?.Shop?.sellerId },
        isProtected
      );
      router.push(`/inbox?conversationId=${res.data.conversation.id}`);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // make a modal
    <div
      className="fixed flex items-center justify-center top-0 left-0 h-screen  w-full bg-[#0000001d] z-50"
      onClick={() => setOpen(false)}
    >
      {/* whenn clicked inside the content it should not close the modal */}
      <div
        className="w-[90%] md:w-[70%] md:mt-14 2xl:mt-0 h-max overflow-scroll min-h-[70vh] p-4 md:p-6 bg-white shadow-md rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 h-full">
            <Image
              src={data?.images?.[activeImage]?.url}
              alt={data?.images?.[activeImage]?.url}
              width={400}
              height={400}
              className="w-full rounded-lg object-contain"
            />
            {/* thumbnails  */}
            <div className="flex gap-2 mt-4">
              {data?.images?.map((img: any, index: number) => (
                <div
                  key={index}
                  className={`cursor-pointer border round-md ${
                    activeImage === index
                      ? "border-gray-500 pt-1"
                      : "border-transparent"
                  }`}
                  onClick={() => setActiveImage(index)}
                >
                  <Image
                    src={img?.url || shopProfile}
                    alt={`Thumbnail ${index}`}
                    width={80}
                    height={80}
                    className="rounded-md"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full md:w-1/2 md:pl-8 mt-6 md:mt-8">
            {/* seller info  */}
            <div className="border-b relative pb-3 border-gray-300 flex items-center justify-between">
              <div className="flex items-start gap-3">
                {/* shop logo */}
                <Image
                  src={data?.Shop?.avatar || shopProfile}
                  alt="Shop logo"
                  width={60}
                  height={60}
                  className="rounded-full w-[60px] h-[60px] object-cover"
                />
                <div>
                  <Link
                    href={`shop/${data?.Shop?.id}`}
                    className="text-lg font-medium"
                  >
                    {data?.Shop?.name}
                  </Link>
                  {/* shop ratings  */}
                  <span className="block mt-1">
                    <Ratings rating={data?.Shop?.ratings} />
                  </span>
                  {/* shop location  */}
                  <p className="text-gray-600 mt-1 flex items-center">
                    <MapPin size={20} />
                    {data?.Shop?.address || "Location Not Available"}
                  </p>
                </div>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium hover:scale-105 transition transform duration-200 ease-in-out cursor-pointer"
                onClick={() => handleChat()}
                type="button"
              >
                💬 Chat with Seller
              </button>
              <button className="w-full absolute cursor-pointer right-[-5px] top-[-5px] flex justify-end my-2 mt-[-10px] ">
                <X size={25} onClick={() => setOpen(false)} />
              </button>
            </div>
            <h3 className="text-xl font-semibold mt-3">{data?.title}</h3>
            {/* pre wrap  Preserves all line breaks (\n) and multiple spaces. */}
            <p className="mt-2 text-gray-700 whitespace-pre-wrap w-full">
              {data?.short_description}{" "}
            </p>
            {/* brand */}
            {data?.brand && (
              <p className="mt-2">
                <strong>Brand:</strong> {data.brand}
              </p>
            )}

            {/* color and size selection  */}
            <div className="flex flex-col md:flex-row items-start gap-5 mt-4">
              {/* color options  */}
              {data?.colors?.length > 0 && (
                <div>
                  <strong>Color:</strong>
                  <div className="flex gap-2 mt-1">
                    {data.colors.map((color: string, index: number) => (
                      <button
                        key={index}
                        className={`w-8 h-8 cursor-pointer rounded-full border-2 
               ${
                 isSelected === color
                   ? "border-gray-400 scale-110 shadow-md"
                   : "border-transparent"
               }`}
                        onClick={() => setIsSelected(color)}
                        style={{ backgroundColor: color }}
                      ></button>
                    ))}
                  </div>
                </div>
              )}

              {/* size options  */}
              {data?.sizes?.length > 0 && (
                <div>
                  <strong>Size:</strong>
                  <div className="flex gap-2 mt-1">
                    {data.sizes.map((size: string, index: number) => (
                      <button
                        key={index}
                        className={`px-4 py-1 cursor-pointer rounded-md transition
             ${
               isSizeSelected === size
                 ? "bg-gray-800 text-white"
                 : "bg-gray-300 text-black"
             }`}
                        onClick={() => setIsSizeSelected(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* price section  */}
            <div className="mt-5 flex items-center gap-4">
              <h3 className="text-2xl font-semibold text-gray-900">
                ${data?.sale_price}{" "}
              </h3>
              {data?.regular_price && (
                <h3 className="text-lg text-red-600 line-through">
                  ${data.regular_price}{" "}
                </h3>
              )}
            </div>

            <div className="mt-5 flex items-center gap-5">
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
              <button
                disabled={isInCart}
                onClick={() =>
                  addToCart(
                    {
                      ...data,
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
                className={`flex items-center ${
                  isInCart ? "cursor-not-allowed" : "cursor-pointer"
                } gap-2 px-4 py-2 bg-[#ff5722] hover:bg-[#e64a19] text-white font-medium rounded-lg transition`}
              >
                <CartIcon size={18} /> Add to Cart
              </button>
              <button className="opacity-[.7] cursor-pointer">
                <Heart
                  size={30}
                  fill={isWishlisted ? "red" : "transparent"}
                  stroke={isWishlisted ? "red" : "#485563"}
                  onClick={() => {
                    isWishlisted
                      ? removeFromWishList(data.id, user, location, deviceInfo)
                      : addToWishList(
                          { ...data, quantity: 1 },
                          user,
                          location,
                          deviceInfo
                        );
                  }}
                />
              </button>
            </div>
            <div className="mt-3">
              {data?.stock > 0 ? (
                <span className="text-green-600 font-semibold"> In Stock</span>
              ) : (
                <span className="text-red-600 font-semibold">
                  {" "}
                  Out of Stock
                </span>
              )}
            </div>
            {/* estimated delivery depends on delivery gateway like DHL , ekart, we get the estimated time from their api . but here we will just be adding +5 days for easy implementation  */}
            <div className="mt-3 text-gray-600 text-sm">
              Estimated Delivery:
              <strong>{estimatedDelivery.toDateString()}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsCard;
