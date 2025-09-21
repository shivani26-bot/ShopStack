"use client";
import React from "react";
import { Layers3, ShoppingCart } from "lucide-react";

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2 cursor-pointer select-none">
      <div className="relative">
        <Layers3 className="w-10 h-10 text-blue-600" />
        <ShoppingCart className="w-4 h-4 text-white absolute bottom-0 right-0 bg-blue-600 rounded-full p-0.5" />
      </div>
      <span className="text-3xl font-semibold tracking-tight text-gray-900">
        Shop<span className="text-blue-600">Stack</span>
      </span>
    </div>
  );
};

export default Logo;
