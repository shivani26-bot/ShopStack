"use client";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const statuses = [
  "Ordered",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];
const Page = () => {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axiosInstance.get(
          `/order/api/get-order-details/${orderId}`
        );
        setOrder(res.data.order);
      } catch (error) {
        setLoading(false);
        console.error("Failed to fetch order details", error);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[40vh]">
        <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
      </div>
    );
  }
  if (!order) {
    return <p className="text-center text-sm text-red-500">Order not found.</p>;
  }
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">Order #{order.id.slice(-6)}</h1>

      {/* delivery progress bar  */}
      <div className="my-4">
        {/* Labels */}
        <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-2">
          {statuses.map((step, idx) => {
            const current =
              step.toLowerCase() ===
              (order.deliveryStatus || "processing").toLowerCase();
            const passed =
              idx <=
              statuses.findIndex(
                (s) =>
                  s.toLowerCase() ===
                  (order.deliveryStatus || "processing").toLowerCase()
              );
            return (
              <div
                key={step}
                className={`text-left flex-1 ${
                  current
                    ? "text-blue-600"
                    : passed
                    ? "text-green-600"
                    : "text-black-400"
                }`}
              >
                {step}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="flex items-center">
          {statuses.map((step, idx) => {
            const reached =
              idx <=
              statuses.findIndex(
                (s) =>
                  s.toLowerCase() ===
                  (order.deliveryStatus || "processing").toLowerCase()
              );
            return (
              <div key={step} className="flex-1 flex items-center">
                {/* Dot */}
                <div
                  className={`w-4 h-4 rounded-full ${
                    reached ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />

                {/* Line */}
                {idx !== statuses.length - 1 && (
                  <div
                    className={`flex-1 h-1 ${
                      reached ? "bg-blue-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* summary info  */}
      <div className="mb-6 space-y-1 text-sm ">
        <p>
          <span className="font-semibold">Payment Status: </span>
          <span className="text-green-600 font-medium">{order.status}</span>
        </p>
        <p>
          <span className="font-semibold">Total Paid:</span>{" "}
          <span className="font-medium">${order.total.toFixed(2)} </span>
        </p>

        {order.discountAmount > 0 && (
          <p>
            <span className="font-semibold">Discount Applied:</span>{" "}
            <span className="text-green-400">
              -${order.discountAmount.toFixed(2)}(
              {order.couponCode?.discountType === "percentage"
                ? `${order.couponCode.discountValue}%`
                : `$${order.couponCode.discountValue}`}
              off){" "}
            </span>
          </p>
        )}
        {order.couponCode && (
          <p>
            <span className="font-semibold">Coupon Used:</span>
            <span className="text-blue-400">
              {order.couponCode.public_name}{" "}
            </span>
          </p>
        )}
        <p>
          <span className="font-semibold">Date: </span>
          {new Date(order.createdAt).toLocaleDateString()}{" "}
        </p>
      </div>

      {/* shipping address  */}
      {order.shippingAddress && (
        <div className="mb-6 text-sm ">
          <h2 className="text-md font-semibold mb-2">Shipping Address</h2>
          <p>{order.shippingAddress.name} </p>
          <p>
            {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
            {order.shippingAddress.zip}{" "}
          </p>
          <p>{order.shippingAddress.country} </p>{" "}
        </div>
      )}

      {/* order items  */}
      <div>
        <h2 className="text-lg font-semibold  mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item: any) => (
            <div
              key={item.productId}
              className="border border-gray-200 rounded-md p-4 flex items-center gap-2"
            >
              <img
                src={item.product?.images[0]?.url || "/placeholder.png"}
                alt={item.product?.title || "Product image"}
                className="w-16 h-16 object-cover rounded-md border border-gray-200"
              />
              <div className="flex items-start justify-between w-full">
                {/* Left side: Title, Quantity, Size */}
                <div className="flex-1 space-y-1">
                  <p className="text-base font-semibold ">
                    {item.product?.title || "Unnamed Product"}
                  </p>

                  <p className="text-sm ">
                    Quantity:{" "}
                    <span className="font-medium text-white">
                      {item.quantity}
                    </span>
                  </p>

                  <p className="text-sm ">
                    Size:{" "}
                    <span className="font-medium ">
                      {item.product?.size || "Standard Size"}
                    </span>
                  </p>
                </div>

                {/* Right side: Price */}
                <p className="text-lg font-bold text-green-400 ml-4 whitespace-nowrap">
                  ${item.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}{" "}
        </div>
      </div>
    </div>
  );
};

export default Page;
