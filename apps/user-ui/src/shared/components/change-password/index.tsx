"use client";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const ChangePassword = () => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const onSubmit = async (data: any) => {
    setError("");
    setMessage("");
    try {
      await axiosInstance.post("/api/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data?.confirmPassword,
      });
      setMessage("Password updated successfully!");
    } catch (error: any) {}
  };
  return (
    <div className="max-w-md mx-auto space-y-6">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Current Password
          </label>
          <input
            type="password"
            {...register("currentPassword", {
              required: "Current password is required",
              minLength: {
                value: 6,
                message: "Minimum 6 characters required ",
              },
            })}
            className="w-full rounded-md focus:outline-none border border-gray-300 px-3 py-2"
            placeholder="Enter current password"
          />
          {errors.currentPassword?.message && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.currentPassword.message)}{" "}
            </p>
          )}
        </div>

        {/* new password  */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            type="password"
            {...register("newPassword", {
              required: "New password is required",
              minLength: {
                value: 8,
                message: "Must be at least 8 characters",
              },
              validate: {
                hasLower: (value) =>
                  /[a-z]/.test(value) || "Must include a lowercase letter",
                hasUpper: (value) =>
                  /[A-Z]/.test(value) || "Must include a uppercase letter",
                hasNumber: (value) =>
                  /\d/.test(value) || "Must include a number",
              },
            })}
            className="w-full rounded-md focus:outline-none border border-gray-300 px-3 py-2"
            placeholder="Enter new password"
          />
          {errors.newPassword?.message && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.newPassword.message)}{" "}
            </p>
          )}
        </div>

        {/* confirm password  */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            type="password"
            {...register("confirmPassword", {
              required: "Confirm your password",
              validate: (value) =>
                value === watch("newPassword") || "Password do not match",
            })}
            className="w-full rounded-md border focus:outline-none border-gray-300 px-3 py-2"
            placeholder="Re-enter new password"
          />
          {errors.confirmPassword?.message && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.confirmPassword.message)}{" "}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-700"
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </form>
      {error && <p className="text-red-500 text-center text-sm">{error}</p>}
      {message && (
        <p className="text-green-500 text-center text-sm">{message}</p>
      )}
    </div>
  );
};

export default ChangePassword;
