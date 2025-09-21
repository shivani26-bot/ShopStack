"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { countries } from "apps/user-ui/src/configs/countries";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { MapPin, Plus, Trash2, X } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const ShippingAddressSection = () => {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      label: "Home",
      name: "",
      street: "",
      city: "",
      zip: "",
      country: "Bangladesh",
      isDefault: "false",
    },
  });

  //   get address
  const { data: addresses, isLoading } = useQuery({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/shipping-addresses");
      return res.data.addresses;
    },
  });

  //   add address mutation
  const { mutate: addAddress } = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosInstance.post("/api/add-address", payload);
      return res.data.address;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] }); //refetch the shipping address
      reset(); //reset the form
      setShowModal(false);
    },
  });

  const onSubmit = async (data: any) => {
    addAddress({ ...data, isDefault: data?.isDefault === "true" });
  };

  const { mutate: deleteAddress } = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/delete-address/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
    },
  });

  console.log("addresses", addresses);
  return (
    <div className="space-y-4">
      {/* header  */}
      <div className="flex justify-between items-center">
        {" "}
        <h2 className="text-lg font-semibold text-gray-800">
          Saved Address
        </h2>{" "}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline"
        >
          <Plus className="w-4 h-4" /> Add New Address
        </button>{" "}
      </div>

      {/* address list  */}
      <div>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading Addresses...</p>
        ) : !addresses || addresses.length === 0 ? (
          <p className="text-sm text-gray-600">No saved addresses found.</p>
        ) : (
          <div className="grid grid-cols:1 sm:grid-cols-2 gap-4">
            {addresses.map((address: any) => (
              <div
                key={address.id}
                className="border border-gray-200 rounded-md p-4 relative"
              >
                {address.isDefault && (
                  <span className="absolute top-2 right-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin className="w-10 h-10 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium">
                      {address.label} - {address.name}
                    </p>
                    <p>
                      {address.street}, {address.city}, {address.zip},{" "}
                      {address.country}{" "}
                    </p>{" "}
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                    onClick={() => deleteAddress(address.id)}
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* modal  */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-md shadow-md relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Add New Address
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <select
                {...register("label")}
                className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
              <input
                placeholder="Name"
                {...register("name", { required: "Name is required" })}
                className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
              />
              {errors.name && (
                <p className="text-red-500 text-xs">{errors.name.message}</p>
              )}

              <input
                placeholder="Street"
                {...register("street", { required: "Street is required" })}
                className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
              />
              {errors.street && (
                <p className="text-red-500 text-xs">{errors.street.message}</p>
              )}
              <input
                placeholder="City"
                {...register("city", { required: "City is required" })}
                className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
              />
              {errors.city && (
                <p className="text-red-500 text-xs">{errors.city.message}</p>
              )}

              <input
                placeholder="ZIP Code"
                {...register("zip", { required: "ZIP Code is required" })}
                className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
              />
              {errors.zip && (
                <p className="text-red-500 text-xs">{errors.zip.message}</p>
              )}
              <select
                {...register("country")}
                className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
              >
                {/* <option value="">Select Country</option> */}
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              <select
                {...register("isDefault")}
                className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
              >
                <option value="true">Set as Default</option>
                <option value="false">Not Default</option>
              </select>

              <button
                className="w-full bg-blue-600 text-white text-sm py-2 rounded-md hover:bg-blue-700 transition"
                type="submit"
              >
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingAddressSection;
