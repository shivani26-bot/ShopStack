import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import React from "react";
import { Metadata } from "next";
import shopProfile from "../../../../assets/icons/shop-profiile.png";
import SellerProfile from "apps/user-ui/src/shared/modules/seller/seller-profile";
// this is important for seo purpose,don't make this client side
// we will fetch the shops on serverside rendering, before showing the client side data it will keep the data on backend side
// when search engines like google it can take our product data also when we fetch on server side
// data important for seo must be fetch on server

async function fetchSellerDetails(id: string) {
  const response = await axiosInstance.get(`/seller/api/get-seller/${id}`);
  console.log(response.data);
  return response.data;
}

// dynamic metadata generator
// basic seo
// That means shopProfile is a StaticImageData object (from Next.js image import), not a string URL. Next.js Metadata API expects a string URL for images[].url. Passing an object causes path argument must be a string error.
// use shopProfile.src  instead of shopProfile
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  console.log(id);
  const data = await fetchSellerDetails(id);

  return {
    title: `${data?.shop?.name} | ShopStack Marketplace`,
    description:
      data?.shop?.bio ||
      "Explore products and services from trusted sellers on ShopStack",
    openGraph: {
      title: `${data?.shop?.name} | ShopStack Marketplace`,
      description:
        data?.shop?.bio ||
        "Explore products and services from trusted sellers on ShopStack",
      type: "website",
      images: [
        {
          url: data?.shop?.avatar || shopProfile.src,
          width: 800,
          height: 600,
          alt: data?.shop?.name || "Shop Logo",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${data?.shop?.name} | ShopStack Marketplace`,
      description:
        data?.shop?.bio ||
        "Explore products and services from trusted sellers on ShopStack",
      images: [
        {
          url: data?.shop?.avatar || shopProfile.src,
          width: 800,
          height: 600,
          alt: data?.shop?.name || "Shop Logo",
        },
      ],
    },
  };
}
const Page = async ({ params }: { params: { id: string } }) => {
  const { id } = await params;
  console.log(id);
  const data = await fetchSellerDetails(params.id);
  return (
    <div>
      <SellerProfile shop={data?.shop} followersCount={data?.followersCount} />
    </div>
  );
};

export default Page;
