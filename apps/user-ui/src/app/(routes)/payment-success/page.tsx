"use client";
import { useStore } from "apps/user-ui/src/store";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle, Truck } from "lucide-react";

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const router = useRouter();

  //clear cart and trigger confetti
  useEffect(() => {
    useStore.setState({ cart: [] });

    // confetti burst
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg max-w-[450px] w-full p-6 text-center">
        <div className="text-green-500 mb-4">
          <CheckCircle className="w-16 h-16 mx-auto" />{" "}
        </div>
        <h2 className="text-3xl  leading-relaxed font-semibold text-gray-800 mb-2">
          Payment Successful 🎉
        </h2>
        <p className="text-sm text-gray-600 mb-6 ">
          Thank you for your purchase. Your order has been placed successfully!
        </p>
        <button
          onClick={() => router.push(`/profile?acitve=My+Orders`)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm"
        >
          <Truck className="w-4 h-4" /> Track Order
        </button>
        <div className="mt-8 text-xs text-gray-500 text-center">
          Payment Session ID: <span className="font-mono">{sessionId}</span>{" "}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
