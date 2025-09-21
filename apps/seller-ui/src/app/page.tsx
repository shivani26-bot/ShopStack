"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Image from "next/image";
import banner from "../assets/icons/no-banner.jpg";
import shopProfile from "../assets/icons/shop-profiile.png";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Heart,
  MapPin,
  Pencil,
  Star,
  Users,
} from "lucide-react";
import axiosInstance from "../utils/axiosInstance";
import useSeller from "../hooks/useSeller";
import { useRouter } from "next/navigation";
import ImageEditModal from "../shared/components/modals/image-edit-modal";
const TABS = ["Products", "Offers", "Reviews"];

const fetchProducts = async () => {
  const res = await axiosInstance.get("/product/api/get-shop-products");
  const products = res.data.products?.filter((i: any) => !i.starting_date);
  return products;
};

const fetchEvents = async () => {
  const res = await axiosInstance.get("/product/api/get-shop-products");
  const products = res.data.products?.filter((i: any) => i.starting_date);
  return products;
};
const SellerProfile = () => {
  const [activeTab, setActiveTab] = useState("Products");
  const { seller, isLoading } = useSeller();
  console.log("seller", seller);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editype, setEditType] = useState<"cover" | "avatar" | null>(null);
  const router = useRouter();
  const { data: products = [] } = useQuery({
    queryKey: ["shop-products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!seller && !isLoading) {
      router.push("/login");
    }
  }, [seller, isLoading]);

  const { data: events = [] } = useQuery({
    queryKey: ["shop-events"],
    queryFn: fetchEvents,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <>
      {isLoading ? (
        <div></div>
      ) : (
        <div className="w-full bg-gray-900 min-h-screen">
          {/* back button */}
          <div className="w-full px-3 py-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Dashboard</span>
            </button>
          </div>

          {/* cover photo */}
          <div className="relative w-full bg-gray-800">
            <Image
              src={seller?.shop?.coverBanner || banner}
              alt="Seller Cover"
              className="w-full h-[350px] object-cover"
              width={1200}
              height={350}
            />

            {seller?.id && (
              <button
                className="absolute top-3 right-3 bg-black/60 px-3 py-2 rounded-md flex items-center gap-2 text-white hover:bg-black/80 transition"
                onClick={() => setEditType("cover")}
              >
                <Pencil size={16} /> Edit Cover
              </button>
            )}
          </div>

          {/* seller info section */}
          <div className="w-[90%] lg:w-[70%] -mt-20 mx-auto relative z-20">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col lg:flex-row gap-6">
              {/* avatar */}
              <div className="relative w-[120px] h-[120px] rounded-full border-4 border-white shadow-md overflow-hidden">
                <Image
                  src={seller?.shop?.avatar || shopProfile}
                  alt="seller avatar"
                  fill
                  className="object-cover"
                />
                {seller?.id && (
                  <button
                    className="absolute bottom-1 right-1 bg-black/70 p-1 rounded-full"
                    onClick={() => setEditType("avatar")}
                  >
                    <Pencil size={14} className="text-white" />
                  </button>
                )}
              </div>

              {/* info */}
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {seller?.shop?.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  {seller?.shop?.bio || "No bio available."}
                </p>

                {/* ratings & followers */}
                <div className="flex items-center gap-6 mt-3 text-sm text-gray-700">
                  <div className="flex items-center gap-1">
                    <Star fill="#facc15" size={18} />
                    {/* in JS, 0 is falsy, so the expression falls back to "N/A" if ratings is 0 */}
                    {/* {seller?.shop?.ratings !== null &&
                      seller?.shop?.ratings !== undefined
                        ? seller.shop.ratings
                        : "N/A"} */}
                    <span>{seller?.shop?.ratings ?? "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={18} />
                    <span>{seller?.followers || 0} Followers</span>
                  </div>
                </div>

                {/* opening hours & address */}
                <div className="flex items-center gap-2 mt-3 text-gray-700 text-sm">
                  <Clock size={18} />
                  <span>
                    {seller?.shop?.opening_hours || "Mon-Sat: 9 AM - 6 PM"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-gray-700 text-sm">
                  <MapPin size={18} />
                  <span>{seller?.shop?.address || "No address provided"}</span>
                </div>
              </div>

              {/* action button */}
              <div className="flex items-start">
                {seller?.id ? (
                  <button
                    className="px-5 py-2 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 flex items-center gap-2 transition"
                    onClick={() => router.push("/edit-profile")}
                  >
                    <Pencil size={16} /> Edit Profile
                  </button>
                ) : (
                  <button
                    className={`px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition ${
                      isFollowing
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                    onClick={() => setIsFollowing(!isFollowing)}
                  >
                    <Heart size={16} />
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editype && (
        <ImageEditModal
          editType={editype}
          onClose={() => setEditType(null)}
          onSave={async (imageUrl: string) => {
            try {
              await axiosInstance.put("/edit-profile/picture", {
                editType: editype,
                imageUrl,
              });
              // ✅ refetch seller info if you’re using react-query
              // queryClient.invalidateQueries(["seller"]);
              setEditType(null);
            } catch (err: any) {
              console.error("Failed to update image:", err);
            }
          }}
        />
      )}
    </>
  );
};

export default SellerProfile;
