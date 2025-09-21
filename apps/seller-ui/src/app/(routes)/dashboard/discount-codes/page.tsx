"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import { AxiosError } from "axios";
import { ChevronRight, Plus, Trash, X } from "lucide-react";
import Link from "next/link";
import Input from "packages/components/input";
import DeleteDiscountCodeModal from "apps/seller-ui/src/shared/components/modals/delete.discount-codes";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";

const Page = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setshowDeleteModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<any>();
  const queryClient = useQueryClient();
  const {
    register,
    reset, //reset is a function that resets the form values to either:initial defaultValues you provided when calling useForm(), or A new set of values you pass to reset().
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      public_name: "",
      discountType: "percentage",
      discountValue: "",
      discountCode: "",
    },
  });

  //fetching discount codes
  //   useQuery is a React Query hook for fetching data and caching it.
  //   data is renamed to discountCodes,f data is undefined (e.g., API hasn't returned yet), discountCodes will default to an empty array.
  //   queryKey is a unique identifier for this query
  // React Query uses it to cache the result and know when to refetch.
  const { data: discountCodes = [], isLoading } = useQuery({
    queryKey: ["shop-discounts"],
    // queryFn is the function React Query runs to fetch data.
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-discount-codes");
      return res?.data?.discount_codes || [];
    },
  });

  //   useMutation is for operations that change data (POST, PUT, DELETE), unlike useQuery which is for fetching data.
  // createDiscountCodeMutation is an object with methods like mutate or mutateAsync that you call to trigger the mutation.
  const createDiscountCodeMutation = useMutation({
    //     mutationFn is the function that performs the mutation.
    // It takes data (the new discount code info) and sends a POST request to your backend.
    mutationFn: async (data) => {
      await axiosInstance.post("/product/api/create-discount-code", data);
    },
    onSuccess: () => {
      // Tells React Query to refetch the discount codes so the UI shows the newly added code.
      queryClient.invalidateQueries({ queryKey: ["shop-discounts"] });
      reset(); // all fields revert to the defaultValues
      setShowModal(false);
    },
  });

  const deleteDiscountCodeMutation = useMutation({
    mutationFn: async (discountId) => {
      await axiosInstance.delete(
        `/product/api/delete-discount-code/${discountId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-discounts"] });
      setshowDeleteModal(false);
    },
  });
  const handleDeleteClick = async (discount: any) => {
    setSelectedDiscount(discount); //tracks the selected discount
    setshowDeleteModal(true);
  };
  const onSubmit = (data: any) => {
    if (discountCodes.length >= 8) {
      toast.error("You can only create up to 8 discount code");
      return;
    }
    createDiscountCodeMutation.mutate(data);
  };
  console.log(discountCodes);
  return (
    <div className="w-full min-h-screen p-8 ">
      <div className="flex justify-between mb-1">
        <h2 className="text-2xl text-white font-semibold">Discount Codes</h2>
        <button
          type="button"
          className="bg-blue-500 hover:bg-blue-700 cursor-pointer text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} /> Create Discount
        </button>
      </div>
      {/* breadcrumbs  */}
      <div className="flex items-center text-white">
        <Link href={"/dashboard"} className="text-[#80deea] cursor-pointer">
          Dashboard
        </Link>

        <ChevronRight size={20} className="opacity-[.8] " />
        <span>Discount Codes</span>
      </div>

      {/* list of existing discount codes  */}
      <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">
          Your Discount Codes
        </h3>
        {isLoading ? (
          <p className="text-gray-400 text-center">Loading discounts...</p>
        ) : (
          <table className="w-full text-white">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Value</th>
                <th className="p-3 text-left">Code</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {discountCodes?.map((discount: any) => (
                <tr
                  key={discount.id}
                  className="border-b border-gray-800 hover:bg-gray-800 transition"
                >
                  <td className="p-3">{discount?.public_name}</td>
                  <td className="p-3 capitalize">
                    {discount.discountType === "percentage"
                      ? "Percentage (%)"
                      : "Flat ($)"}
                  </td>

                  <td className="p-3 ">
                    {discount.discountType === "percentage"
                      ? `${discount.discountValue}%`
                      : `$${discount.discountValue}`}
                  </td>

                  <td className="p-3 ">{discount.discountCode}</td>
                  <td className="p-3 ">
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(discount)}
                      className="text-red-400 hover:text-red-300 transition cursor-pointer"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && discountCodes?.length === 0 && (
          <p className="text-gray-400 w-full pt-4 block text-center">
            No discount codes available.
          </p>
        )}
      </div>

      {/* create discount modal  */}
      {showModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-gray-800 p-6 rounded-lg w-[450px] shadow-lg">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 className="text-xl text-white">Create Discount Code</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                {" "}
                <X size={22} />{" "}
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
              {/* title  */}
              <Input
                label="Title (Public name)"
                {...register("public_name", { required: "Title is required" })}
              />
              {errors.public_name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.public_name.message}
                </p>
              )}

              {/* discount type  */}
              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Discount Type
                </label>
                <Controller
                  name="discountType"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full border outline-none border-gray-700 bg-transparent text-white"
                    >
                      <option value="percentage" className="bg-black">
                        Percentage (%)
                      </option>
                      <option value="flat" className="bg-black">
                        Flat Amount ($)
                      </option>
                    </select>
                  )}
                />
              </div>

              {/* discount value  */}
              <div className="mt-2">
                {/* The issue you're experiencing is common with HTML type="number" inputs. While type="number" provides some validation, it doesn't prevent users from typing non-numeric characters during input - it only validates on form submission. */}
                <Input
                  label="Discount value"
                  type="number" //only enforces numeric input on form submission
                  min={1}
                  integerOnly={true}
                  {...register("discountValue", {
                    required: "Value  is required",
                    // validate: (value) => {
                    //   const num = parseInt(value);
                    //   if (isNaN(num) || !Number.isInteger(num)) {
                    //     return "Please enter a valid integer";
                    //   }
                    //   if (num < 1) {
                    //     return "Value must be at least 1";
                    //   }
                    //   return true;
                    // },
                  })}
                />
                {errors.discountValue && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.discountValue.message}
                  </p>
                )}
              </div>
              {/* discount code */}
              <div className="mt-2">
                <Input
                  label="Discount Code"
                  {...register("discountCode", {
                    required: "Discount Code is required",
                  })}
                />
                {errors.discountCode && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.discountCode.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={createDiscountCodeMutation?.isPending}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                {createDiscountCodeMutation?.isPending
                  ? "Creating ... "
                  : "Create"}
              </button>
              {createDiscountCodeMutation?.isError &&
                createDiscountCodeMutation.error instanceof AxiosError && (
                  <p className="text-center text-red-500 text-sm">
                    {createDiscountCodeMutation.error.response?.data?.message ||
                      createDiscountCodeMutation.error.message}
                  </p>
                )}
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedDiscount && (
        <DeleteDiscountCodeModal
          discount={selectedDiscount}
          onClose={() => setshowDeleteModal(false)}
          onConfirm={() =>
            deleteDiscountCodeMutation.mutate(selectedDiscount?.id)
          }
        />
      )}
      <Toaster position="top-right" />
    </div>
  );
};

export default Page;
