"use client";

import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
type FormData = {
  email: string;
  password: string;
};
const ForgotPassword = () => {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const startResendTimer = () => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const requestOtpMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/forgot-password-user`,
        { email }
      );
      return response.data;
    },
    //     onSuccess signature is (data, variables, context).
    // data → the return value of mutationFn (API response).
    // variables → the input you passed into mutate (in this case { email }).
    onSuccess: (_, { email }) => {
      setUserEmail(email);
      setStep("otp");
      setServerError(null);
      setCanResend(false);
      setTimer(60); //after 60 seconds make resend to true
      startResendTimer();
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        "Invalid OTP. Try again!";
      setServerError(errorMessage);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userEmail) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-forgot-password-otp`,
        { email: userEmail, otp: otp.join("") }
      );
      return response.data;
    },
    onSuccess: () => {
      setStep("reset");
      setServerError(null);
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message?: string })
        ?.message;
      setServerError(errorMessage || "Invalid OTP. Try again!");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      if (!password) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/reset-password-user`,
        { email: userEmail, newPassword: password }
      );
      return response.data;
    },
    onSuccess: () => {
      setStep("email");

      toast.success(
        "Password reset successfully! Please login with your new password."
      );
      setServerError(null);
      setTimeout(() => {
        router.push("/login"); //Redirects the user to /login,triggers instant navigation,
      }, 1500); //1.5 sec delay
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message?: string })
        ?.message;
      setServerError(errorMessage || "Failed to reset password. Try agin!");
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // each form has single field
  // destructuring
  //   we can also d:
  //   const onSubmitEmail = (data: { email: string }) => {
  //   requestOtpMutation.mutate(data); // data = { email: "abc@test.com" }
  // };
  // const onSubmitPassword = (data: { password: string }) => {
  //   resetPasswordMutation.mutate(data);
  // };

  const onSubmitEmail = ({ email }: { email: string }) => {
    requestOtpMutation.mutate({ email });
  };

  const onSubmitPassword = ({ password }: { password: string }) => {
    resetPasswordMutation.mutate({ password });
  };

  return (
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
      <h1 className="text-4xl font-Poppins font-semibold text-black text-center">
        Forgot Password
      </h1>
      <p className="text-center text-lg font-medium py-3 text-[#00000099">
        Home . Forgot-password
      </p>
      <div className="w-full flex justify-center">
        {/* md:w-[480px] — that means only 480 pixels wide on medium screens */}
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
          {step === "email" && (
            <>
              <h3 className="text-3xl font-semibold text-center mb-2">
                Login to ShopStack
              </h3>
              <p className="text-center text-gray-500 mb-4">
                Go back to?{" "}
                <Link href={"/login"} className="text-blue-500">
                  Login
                </Link>
              </p>

              <form onSubmit={handleSubmit(onSubmitEmail)}>
                <label className="block text-gray-700 mb-1">Email</label>

                <input
                  type="email"
                  placeholder="noreply.enterprise.mail@gmail.com"
                  className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value:
                        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">
                    {String(errors.email.message)}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={requestOtpMutation.isPending}
                  className="w-full text-lg cursor-pointer bg-black text-white py-2 rounded-lg mt-4"
                >
                  {requestOtpMutation.isPending ? "Sending OTP..." : "Submit"}
                </button>
                {serverError && (
                  <p className="text-red-500 text-sm mt-2">{serverError}</p>
                )}
              </form>
            </>
          )}
          {step === "otp" && (
            <>
              <h3 className="text-xl font-semibold text-center mb-4">
                Enter OTP
              </h3>
              <div className="flex justify-center gap-6">
                {otp?.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    ref={(el) => {
                      if (el) inputRefs.current[index] = el;
                    }}
                    maxLength={1}
                    className="w-12 h-12 text-center border border-gray-300 outline-none !rounded"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  />
                ))}
              </div>
              <button
                className="w-full mt-4 text-lg cursor-pointer bg-blue-500 text-white py-2 rounded-lg"
                disabled={verifyOtpMutation.isPending}
                onClick={() => verifyOtpMutation.mutate()}
              >
                {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
              </button>
              {/* <p className="text-center text-sm mt-4"> */}
              {canResend ? (
                <button
                  onClick={() =>
                    requestOtpMutation.mutate({ email: userEmail! })
                  }
                  className="text-blue-500 cursor-pointer"
                >
                  Resend OTP
                </button>
              ) : (
                <p className="text-center text-sm mt-4">
                  Resend OTP in {timer}s
                </p>
              )}
              {/* </p> */}
              {serverError && (
                <p className="text-red-500 text-sm mt-2">{serverError}</p>
              )}
            </>
          )}
          {step === "reset" && (
            <>
              <h3 className="text-xl font-semibold text-center mb-4">
                Reset Password
              </h3>
              <form onSubmit={handleSubmit(onSubmitPassword)}>
                <label className="block text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                  >
                    {passwordVisible ? <Eye /> : <EyeOff />}
                  </button>
                  {errors.password && (
                    <p className="text-red-500 text-sm">
                      {String(errors.password.message)}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-2 mt-4 curor-pointer bg-black text-white rounded-lg"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending
                    ? "Resetting ..."
                    : "Reset Password"}
                </button>
                {serverError && (
                  <p className="text-red-500 text-sm mt-2">{serverError}</p>
                )}
              </form>
            </>
          )}
          <Toaster position="top-right" />
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
