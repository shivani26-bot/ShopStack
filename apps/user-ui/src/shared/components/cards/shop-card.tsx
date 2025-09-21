import Image from "next/image";
import React from "react";
import banner from "../../../assets/icons/no-banner.jpg";
import shopProfile from "../../../assets/icons/shop-profiile.png";
import { ArrowUpRight, MapPin, Star } from "lucide-react";
import Link from "next/link";
interface ShopCardProps {
  shop: {
    id: string;
    name: string;
    description?: string;
    avatar: string;
    coverBanner?: string;
    address?: string;
    followers?: [];
    ratings?: number;
    category?: string;
  };
}
const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  return (
    <div className="w-full rounded-md cursor-pointer bg-white border border-gray-200 shadow-sm overflow-hidden transition">
      {/* cover photo  */}
      <div className="h-[120px] w-full relative">
        <Image
          src={shop?.coverBanner || banner}
          alt="Cover"
          fill
          className="object-cover w-full h-full"
        />
      </div>
      {/* avatar  */}
      <div className="relative flex justify-center -mt-8">
        <div className="w-16 h-16 rounded-full border-4 border-white shadow overflow-hidden ">
          {" "}
          <Image
            src={shop.avatar || shopProfile}
            alt={shop.name || "shop name"}
            width={64}
            height={64}
            className="object-cover"
          />
        </div>
      </div>
      {/* shop informatin  */}
      <div className="px-4 pb-4 pt-2 text-center">
        <h3 className="text-base font-semibold text-gray-800">{shop?.name} </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {shop?.followers?.length ?? 0} Followers{" "}
        </p>{" "}
        {/* address rating  */}
        <div className="flex items-center justify-center text-xs text-gray-500 mt-2 gap-4 flex-wrap">
          {shop.address && (
            <span className="flex items-center gap-1 max-w-[120px]">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{shop.address} </span>
            </span>
          )}
          <span className="flex items-center gap-1 ">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            {shop.ratings ?? "N/A"}
          </span>
        </div>
        {/* category  */}
        {shop.category && (
          <div className="flex mt-3 flex-wrap justify-center gap-2 text-xs rounded-md">
            <span className="bg-blue-50 capitalize text-blue-600 px-2 py-0.5 ">
              {shop.category}{" "}
            </span>
          </div>
        )}
        <div className="mt-4">
          <Link
            href={`/shop/${shop.id}`}
            className="inline-flex items-center text-blue-600 font-medium hover:underline hover:text-blue-700 transition"
          >
            Visit Shop <ArrowUpRight className="w-4 h-4 ml-1" />{" "}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShopCard;
