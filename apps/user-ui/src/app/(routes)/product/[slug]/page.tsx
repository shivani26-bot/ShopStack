// dynamic routes (/product/[slug]).

import ProductDetails from "apps/user-ui/src/shared/modules/product/product-details";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { Metadata } from "next";
import React from "react";
import productImage from "../../../../assets/icons/productImage.jpeg";
// Page is already a Server Component (default in app/ router unless you add "use client").
// You’re fetching product data server-side with fetchProductDetails before rendering.
// Then you pass the data into ProductDetails
// generateMetadata → builds SEO tags using that data.
async function fetchProductDetails(slug: string) {
  // Calls your backend API endpoint /product/api/get-product/:slug.
  // Returns the product object from the response.
  const response = await axiosInstance(`/product/api/get-product/${slug}`);
  return response.data.product;
}

//Dynamic Metadata for SEO purpose
// Error: Route "/product/[slug]" used params.slug. params should be awaited before using its properties.
// In Next.js App Router (app/ directory), route parameters (params) are passed as async objects when used in server functions like generateMetadata or generateStaticParams.
// You must await before accessing params.slug.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  //   Next.js will run this function at request/build time to generate SEO metadata (title, description, OG tags, Twitter cards).
  // Notice params is a Promise → you must await params before extracting slug.
  // Calls your API to get product details, then uses them to build meta tags.
  const { slug } = await params; //await here,MUST await because params is async in App Router

  console.log("slugdata", slug); //get slug
  const product = await fetchProductDetails(slug);
  return {
    title: `${product?.title} ` || "Marketplace", //browser tab title (<title> in <head>)
    //<meta name="description"> tag.Search engines (Google, Bing) often show this in search results.
    description:
      product?.short_description ||
      "Discouver high-quality prodcuts on Marketplace.",
    // Defines Open Graph meta tags (<meta property="og:*">).
    // Used by platforms like Facebook, LinkedIn, WhatsApp for link previews.
    //     output in html:
    //     <meta property="og:title" content="Nike Air Max 90" />
    // <meta property="og:description" content="Best running shoes with comfort." />
    // <meta property="og:image" content="https://example.com/nike.jpg" />
    // <meta property="og:type" content="website" />

    openGraph: {
      title: product?.title,
      description: product?.short_description || "",
      images: [product?.images?.[0]?.url || productImage.src],
      type: "website",
    },

    // Defines Twitter Card meta tags (<meta name="twitter:*">).
    // Controls how links look when shared on Twitter/X.
    // summary_large_image → makes Twitter preview show a big image card instead of a small thumbnail.
    //     <meta name="twitter:card" content="summary_large_image" />
    // <meta name="twitter:title" content="Nike Air Max 90" />
    // <meta name="twitter:description" content="Best running shoes with comfort." />
    // <meta name="twitter:image" content="https://example.com/nike.jpg" />

    twitter: {
      card: "summary_large_image",
      title: product?.title,
      description: product?.short_description || "",
      images: [product?.images?.[0]?.url || productImage.src],
    },
  };
}

// Dynamic Product Page
// Page → renders the product page UI with the product details.
const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const productDetails = await fetchProductDetails(slug); //get a Server response Object of product data, tab name also changes to slug
  console.log(productDetails);
  return <ProductDetails productDetails={productDetails} />;
};

export default Page;

// SEO inside Next.js. When we are fetching data on the client side, it’s not completely SEO-friendly. That’s why for product details we should definitely fetch this data on the server side. This way, when the page loads, Google can fetch the content directly from the website. It will not load on a simple blank HTML DOM; instead, it will directly load the full content since we are fetching the data from the backend.

// Additional SEO optimization tips in Next.js:

// Server-Side Rendering (SSR)
// Use getServerSideProps to fetch data on the server for pages that need to be indexed immediately.
// This ensures search engines see the full content on the initial load.

// Static Site Generation (SSG)
// Use getStaticProps to generate pages at build time for content that doesn’t change frequently.
// This improves page load speed, which is an SEO ranking factor.

// Dynamic Metadata
// Use the <Head> component from next/head to set dynamic <title>, <meta> description, and other SEO tags for each page.

// Structured Data
// Add JSON-LD structured data for products, articles, and events to help search engines understand your content better.

// Canonical URLs
// Use <link rel="canonical"> to avoid duplicate content issues for similar pages.

// Image Optimization
// Use Next.js <Image> component with alt attributes. Optimized images improve SEO and page performance.

// Robots.txt & Sitemap
// Make sure you provide robots.txt and a sitemap to guide search engines.

// Performance & Core Web Vitals
// Fast loading times, minimal layout shifts, and responsive design improve SEO. Next.js helps with these out-of-the-box.
