"use client";
import { MoveRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import useLayout from "../../hooks/useLayout";

const Hero = () => {
  const router = useRouter();
  const { layout } = useLayout();
  return (
    <div className="bg-gradient-to-b from-[#0A1A2F] via-[#0D2238] to-[#0A1625] h-[85vh] flex flex-col justify-center w-full">
      <div className="md:w-[80%] w-[90%] m-auto md:flex h-full items-center">
        {/* Left Section */}
        <div className="md:w-1/2">
          <div className="font-Roboto font-normal text-white pb-2 text-xl">
            <p>Starting from 40$</p>
            <h1 className="text-white text-6xl font-extrabold font-Roboto">
              The best watch <br />
              Collection 2025
            </h1>
            <p className="font-Oregano text-3xl pt-4 text-white">
              Exclusive offer <span className="text-yellow-400">10%</span> off
              this week
            </p>
            <br />
            <button
              onClick={() => router.push("/products")}
              className="w-[140px] h-[40px] flex items-center justify-center gap-2 
             font-semibold  bg-white rounded-md text-black
             hover:bg-transparent hover:text-white transition-colors hover:border hover:border-white"
            >
              Shop Now <MoveRight />
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="md:w-1/2 flex justify-center">
          <Image
            src={
              layout?.banner ||
              "https://ik.imagekit.io/11iwzzqkk/products/watch_collection.jpg?updatedAt=1756187319547"
            }
            alt="Watch Collection"
            width={550}
            height={550}
            className="rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] hover:scale-105 hover:shadow-[0_25px_60px_rgba(0,0,0,0.9)] transition-transform duration-500 ease-in-out"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;

// we can change the logo and banner from admin dashboard under customization option and it will reflect dynamically
