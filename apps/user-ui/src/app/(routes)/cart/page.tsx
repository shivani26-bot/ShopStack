"use client";
import { useQuery } from "@tanstack/react-query";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useUser from "apps/user-ui/src/hooks/useUser";
import { useStore } from "apps/user-ui/src/store";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const CartPage = () => {
  const [discountedProductId, setDiscountedProdutId] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddressId, setSelectAddressId] = useState("");
  const router = useRouter();
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const addToCart = useStore((state: any) => state.addToCart);
  const addToWishList = useStore((state: any) => state.addToWishList);
  const removeFromCart = useStore((state: any) => state.removeFromCart);
  const cart = useStore((state: any) => state.cart);
  const removeFromWishList = useStore((state: any) => state.removeFromWishList);
  const [storedCouponCode, setStoredCouponCode] = useState("");
  const [error, setError] = useState("");
  const couponCodeApplyHandler = async () => {
    setError("");
    if (!couponCode.trim()) {
      setError("Coupon code is required!");
      return;
    }
    try {
      const res = await axiosInstance.put("/order/api/verify-coupon", {
        couponCode: couponCode.trim(),
        cart,
      });
      //coupon can be applied t specific product
      if (res.data.valid) {
        setStoredCouponCode(couponCode.trim());
        setDiscountAmount(parseFloat(res.data.discountAmount));
        setDiscountPercent(res.data.discount);
        setDiscountedProdutId(res.data.discountedProductId);
        setCouponCode("");
      } else {
        setDiscountAmount(0);
        setDiscountPercent(0);
        setDiscountedProdutId("");
        setError(res.data.message || "copon not valid for any items in cart.");
      }
    } catch (error: any) {
      setDiscountAmount(0);
      setDiscountPercent(0);
      setDiscountedProdutId("");
      setError(error?.response?.data?.message);
    }
  };
  //step 1 for payment
  const createPaymentSession = async () => {
    if (addresses?.length === 0) {
      toast.error("Please set your delivery address to create an order!");
      return;
    }
    setLoading(true);
    try {
      console.log("selectedadressid", selectedAddressId);
      const res = await axiosInstance.post(
        "/order/api/create-payment-session", //this returns a session id
        {
          cart,
          selectedAddressId,
          coupon: {
            code: storedCouponCode,
            discountAmount,
            discountPercent,
            discountedProductId,
          },
        }
      );
      const sessionId = res.data.sessionId;
      //after getting sessionId, we have to send user to checkout session
      router.push(`/checkout?sessionId=${sessionId}`);
    } catch (error) {
      toast.error("Something went wrong. Please try again. ");
    } finally {
      setLoading(false);
    }
  };
  const decreaseQuantity = (id: string) => {
    // console.log("decid", id);
    useStore.setState((state: any) => ({
      cart: state.cart.map((item: any) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ),
    }));
  };
  const increaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      cart: state.cart.map((item: any) =>
        item.id === id ? { ...item, quantity: (item.quantity ?? 1) + 1 } : item
      ),
    }));
  };

  const removeItem = (id: string) => {
    removeFromCart(id, user, location, deviceInfo);
  };

  const subtotal = cart.reduce(
    (total: number, item: any) =>
      total + (item.quantity ?? 1) * item.sale_price,
    0
  );
  console.log("sub", subtotal);

  // get addresses
  const { data: addresses = [] } = useQuery<any[], Error>({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get("api/shipping-addresses");
      return res.data.addresses;
    },
  });

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((addr) => addr.isDefault);
      if (defaultAddr) {
        setSelectAddressId(defaultAddr.id);
      }
    }
  }, [addresses, selectedAddressId]);
  return (
    <div className="w-full bg-white">
      <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
        {/* breadcrumbs  */}
        <div className="pb-[50px]">
          {/* leading-[1] is a utility class that controls line-height. line-height: 1;
           */}
          <h1 className="md:pt-[50px] font-medium text-[44px] leading-[1] mb-[16px] font-jost">
            Shopping Cart
          </h1>
          <Link href={"/"} className="text-[#55585b]  hover:underline ">
            Home
          </Link>

          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span>Cart</span>
        </div>
        {cart.length === 0 ? (
          <div className="text-center text-gray-600 text-lg">
            Your cart is empty! Start adding products.
          </div>
        ) : (
          <div className="lg:flex items-start gap-10">
            <table className="w-full lg:w-[70%] border-collapse">
              <thead className="bg-[#f1f3f4] rounded">
                <tr>
                  <th className="py-3 text-left pl-6 align-middle">Product</th>
                  <th className="py-3 text-left align-middle">Price</th>
                  <th className="py-3 text-left align-middle ">Quantity</th>
                  <th className="py-3 text-left align-middle "></th>
                </tr>
              </thead>
              <tbody>
                {cart?.map((item: any) => (
                  <tr key={item.id} className="border-b border-b-[#00000000e] ">
                    <td className="flex items-center gap-4 p-4">
                      <Image
                        src={item.images[0]?.url}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="rounded"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{item.title} </span>
                        {item?.selectedOptions && (
                          <div className="text-sm text-gray-500">
                            {item?.selectedOptions?.color && (
                              <span>
                                Color:{" "}
                                <span
                                  style={{
                                    backgroundColor:
                                      item?.selectedOptions?.color,
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "100%",
                                    display: "inline-block",
                                  }}
                                />
                              </span>
                            )}
                            {item?.selectedOptions.size && (
                              <span className="ml-2">
                                Size:{item?.selectedOptions?.size}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="pr-6 text-lg ">
                      {item?.id === discountedProductId ? (
                        <div className="flex flex-col items-center">
                          <span className="line-through text-gray-500 text-sm">
                            ${item.sale_price.toFixed(2)}
                          </span>
                          <span className="text-green-600 font-semibold">
                            $
                            {(
                              (item.sale_price * (100 - discountPercent)) /
                              100
                            ).toFixed(2)}
                          </span>
                          <span className="text-xs text-green-600 bg-white">
                            Discount Applied
                          </span>
                        </div>
                      ) : (
                        <span>${item.sale_price.toFixed(2)}</span>
                      )}
                    </td>

                    <td>
                      <div className="flex justify-center items-center border border-gray-200  rounded-[20px] w-[90px] p-[2px]">
                        <button
                          type="button"
                          className="text-black cursor-pointer text-xl"
                          onClick={() => decreaseQuantity(item?.id)}
                        >
                          -
                        </button>
                        <span className="px-4">{item?.quantity}</span>
                        <button
                          type="button"
                          className="text-black cursor-pointer text-xl"
                          onClick={() => increaseQuantity(item?.id)}
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="text-center">
                      <button
                        className="cursor-pointer text-[#818487] px-5 py-2 rounded-md hover:text-[#ff1826] transition duration-200"
                        onClick={() => removeItem(item?.id)}
                      >
                        X Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* right side table  */}
            <div className="w-full p-6 shadow-md lg:w-[30%] bg-[#f9f9f9] rounded-lg">
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-[#010f1c] text-base font-medium pb-1">
                  <span className="font-jost">
                    Discount ({discountPercent}%)
                  </span>
                  <span>-${discountAmount.toFixed(2)} </span>
                </div>
              )}
              <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                <span className="font-jost">Subtotal</span>
                <span>${(subtotal - discountAmount).toFixed(2)}</span>
              </div>
              <hr className="my-4 text-slate-200" />
              <div className="mb-4">
                <h4 className="mb-[7px] font-[500] text-[15px]">
                  Have a Coupon?
                </h4>
                <div className="flex">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e: any) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="w-full p-2 border border-gray-200 rounded-l-m focus:ouline-none focus:border-blue-500"
                  />
                  <button
                    className="bg-blue-500 cursor-pointer text-white px-4 rounded-r-md hover:bg-blue-600 transition-all"
                    onClick={() => couponCodeApplyHandler()}
                  >
                    Apply
                  </button>
                </div>
                {error && <p className="text-sm pt-2 text-red-500">{error}</p>}
                <hr className="my-4 text-slate-200" />
                <div className="mb-4">
                  <h4 className="mb-[7px] font-medium text-[15px]">
                    Select Shipping Address
                  </h4>

                  {addresses?.length !== 0 && (
                    <select
                      className="w-full p-2 border border-gray-200 rounded-md"
                      value={selectedAddressId}
                      onChange={(e: any) => setSelectAddressId(e.target.value)}
                    >
                      {addresses.map((address: any) => (
                        <option key={address.id} value={address.id}>
                          {address.label} - {address.street}, {address.city},{" "}
                          {address.country}{" "}
                        </option>
                      ))}
                    </select>
                  )}
                  {addresses?.length === 0 && (
                    <p className="text-sm text-slate-800">
                      Please add an address from profile to create an order!
                    </p>
                  )}
                </div>

                <hr className="my-4 text-slate-200" />
                <div className="mb-4">
                  <h4 className="mb-[7px] font-medium text-[15px]">
                    Select Payment Method
                  </h4>
                  <select className="w-full p-2 border border-gray-200 rounded-md focus:outline-none foucus:border-blue">
                    <option value="credit_card">Online Payment</option>
                    <option value="cash_on_delivery">Cash On delivery</option>
                  </select>
                </div>
                <hr className="my-4 text-slate-200" />
                <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                  <span className="font-jost">Total</span>
                  <span>${(subtotal - discountAmount).toFixed(2)}</span>
                </div>
                <button
                  onClick={createPaymentSession}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 cursor-pointer mt-4 py-3 bg-[#010f1c] text-white hover:bg-[#0989FF] transition-all rounded-lg"
                >
                  {loading && <Loader2 className="animate-spin w-5 h-5" />}
                  {loading ? "Redirecting..." : "Proceed to Checkout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default CartPage;
