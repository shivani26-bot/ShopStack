"use client";

import { useMutation } from "@tanstack/react-query";
import GoogleButton from "apps/user-ui/src/shared/components/google-button";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import React, { use, useRef, useState } from "react";
import { useForm } from "react-hook-form";
// custom TypeScript type:
type FormData = {
  name: string;
  email: string;
  password: string;
};
const Signup = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [showOtp, setShowOtp] = useState(false); //Decides whether to show OTP input UI.
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(["", "", "", ""]); //Stores each digit of OTP separately (like ["1","2","3","4"]).
  const [userData, setUserData] = useState<FormData | null>(null); //stores the user’s signup form data (e.g. name, email, password) before OTP verification.FormData is a type,state can either be: null (initially, when no data is filled), or object
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]); //useRef holds references to each OTP input box.Auto-move cursor to next input when user types a digit.Go back to previous input when pressing backspace.
  // store multiple input fields (one per OTP digit).
  // So it’s an array of input refs:
  // HTMLInputElement → type of each input (like <input type="text" />)
  // | null → because when the component first renders, refs aren’t attached yet (so they are null initially).
  const router = useRouter(); //From Next.js → allows programmatic navigation
  //   useForm is a hook from react-hook-form.
  // <FormData> is a TypeScript generic type,describing the shape of your form.
  // useForm<FormData>() returns an object like:
  // {
  // register: Function,
  // handleSubmit: Function,
  // watch: Function,
  // setValue: Function,
  // reset: Function,
  // formState: {
  //   errors: Record<string, any>,
  //   isDirty: boolean,
  //   isValid: boolean,
  //   // ... more states
  // }
  // }
  // similar to:
  // const form = useForm<FormData>();
  // const register = form.register;
  // const handleSubmit = form.handleSubmit;
  // const errors = form.formState.errors;

  // here we are destructuring directly from the object returned by useForm
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  //Runs the callback every 1000ms = 1 second.
  //   When you call setInterval(callback, 1000), it immediately returns a unique interval ID (a number in browsers, an object in Node.js).
  // That ID does not change each second. It’s the identifier for that repeating timer.
  // You use that ID later in clearInterval(id) to stop the timer.
  const startResendTimer = () => {
    const interval = setInterval(() => {
      //setTimer updates the countdown.
      setTimer((prev) => {
        //prev is the previous value of timer.
        if (prev <= 1) {
          clearInterval(interval); //stop the timer
          setCanResend(true); //Enable the "Resend OTP" button
          return 0; //Reset timer to 0.
        }
        return prev - 1; //Otherwise: subtract 1 (countdown continues).
      });
    }, 1000);
  };

  // userData is an object ... will spread all the elements in the userData
  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userData) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-user`,
        {
          ...userData,
          otp: otp.join(""), //otp.join("") makes it "1234"
        }
      );
      return response.data;
    },
    onSuccess: () => {
      router.push("/login");
    },
  });
  // using React Query’s useMutation hook
  // mutationFn → the function that actually calls your API.
  // Takes data (FormData) as input.
  // Sends it to /api/user-registration via axios.post.
  // Returns the server response.
  const signupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/user-registration`,
        data
      );
      return response.data;
    },
    //     onSuccess → callback that runs if the request succeeds.
    // React Query passes two arguments:
    // The response data (ignored here with _).
    // The variables you passed into .mutate() → in this case formData.
    onSuccess: (_, formData) => {
      setUserData(formData);
      setShowOtp(true);
      setCanResend(false); //Disabling the resend button for 60 seconds
      setTimer(60); //after 60 seconds make resend to true
      startResendTimer();
    },
  });

  //function called when the form is submitted.
  // data comes from react-hook-form (collected form inputs).
  // here form has multiple field
  const onSubmit = (data: FormData) => {
    console.log("signup", data);
    // runs the mutationFn in signupMutation
    signupMutation.mutate(data);
  };

  const handleOtpChange = (index: number, value: string) => {
    // only a single digit (0–9) or empty ? is allowed
    // if doesnot follow the regex then return
    if (!/^[0-9]?$/.test(value)) return;
    // Creates a copy of the current OTP array (["", "", "", ""]).
    // You should never directly mutate React state, so this copy is important.
    const newOtp = [...otp];
    // Updates the digit at the given input index.
    newOtp[index] = value;
    setOtp(newOtp);
    //     Checks if:
    // User typed a value (value is not empty), and
    // It’s not the last input box (index < length - 1).
    // Moves cursor to the next OTP box automatically.
    // ?. :optional chaining in TypeScript/JavaScript,safely tries to access a property or call a method, but only if the left side isn’t null or undefined.

    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  //   index: which OTP input the user is currently typing in.
  // e: the keyboard event, so you can check which key was pressed (Backspace, Enter, etc.).
  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // check if backspace was pressed,if the current box is already empty,Ensure we’re not on the very first input
    // Move focus to the previous input
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendOtp = () => {
    //If we still have userData stored → re-trigger signupMutation
    if (userData) {
      signupMutation.mutate(userData);
    }
  };
  return (
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
      <h1 className="text-4xl font-Poppins font-semibold text-black text-center">
        Signup
      </h1>
      <p className="text-center text-lg font-medium py-3 text-[#00000099">
        Home . Signup
      </p>
      <div className="w-full flex justify-center">
        {/* md:w-[480px] — that means only 480 pixels wide on medium screens */}
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">
          <h3 className="text-3xl font-semibold text-center mb-2">
            Signup to ShopStack
          </h3>
          <p className="text-center text-gray-500 mb-4">
            Already have an account?{" "}
            <Link href={"/login"} className="text-blue-500">
              Login
            </Link>
          </p>
          <GoogleButton />
          <div className="flex items-center my-5 text-gray-400 text-sm">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-3">or Sign in with Email</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>
          {!showOtp ? (
            // handleSubmit → provided by react-hook-form. It takes care of preventing default behavior and validating inputs before calling onSubmit.
            // onSubmit → your custom function that runs after validation.
            // React Hook Form will call this onSubmit function only when validation succeeds.
            // onSubmit attribute is a React prop (camelCase, because JSX follows JS naming).
            // → It expects a function that runs when the form is submitted.
            // → React automatically gives this function an event object (like FormEvent).
            <form onSubmit={handleSubmit(onSubmit)}>
              <label className="block text-gray-700 mb-1">Name</label>
              {/* register is a function provided by useForm() in React Hook Form. 
connect your input fields (<input>, <select>, etc.) to RHF’s internal form state & validation system.
returns an object of props that you need to spread (...) onto the input.
<input
  name="name"
  ref={...}          // RHF attaches to track the field
  onChange={...}     // RHF intercepts changes
  onBlur={...}       // RHF tracks when user leaves the field
/>
spreads name, ref, onChange, onBlur attribute
second argument to register() sets validation rules:Run these checks automatically. Populate errors.name if validation fails. */}
              <input
                type="text"
                placeholder="Shivani"
                className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                {...register("name", {
                  required: "Name is required",
                })}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">
                  {String(errors.name.message)}
                </p>
              )}
              <label className="block text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="noreply.enterprise.mail@gmail.com"
                className="w-full p-2 border border-gray-300 outline-0 !rounded mb-1"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                    message: "Invalid email address",
                  },
                })}
              />
              {/* checks if the field email has an error. */}
              {/* errors.email.message:The exact message you wrote in the validation rule: */}
              {errors.email && (
                <p className="text-red-500 text-sm">
                  {/* String():converts a value to a string (even if the value is undefined, null, number, boolean, objectetc.). */}
                  {String(errors.email.message)}
                </p>
              )}
              <label className="block text-gray-700 mb-1">Password</label>
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
              {/* When clicked, it triggers the form’s onSubmit handler While the
              signup request is in progress, this (signupMutation.isPending is
              coming from React Query mutation state.) becomes true. disabled
              prevents multiple clicks (no duplicate submissions). */}
              <button
                type="submit"
                disabled={signupMutation.isPending}
                className="w-full text-lg cursor-pointer bg-black text-white py-2 rounded-lg mt-4"
              >
                {signupMutation.isPending ? " Signing up ..." : "Signup"}
              </button>
            </form>
          ) : (
            <div>
              <h3 className="text-xl font-semibold text-center mb-4">
                Enter OTP
              </h3>
              <div className="flex justify-center gap-6">
                {/* inputRefs.current is an array of references to the actual <input> DOM elements.
For each input, you assign its DOM node (el) to inputRefs.current[index].
This lets you programmatically focus/clear an OTP box later.
inputRefs.current = [
  HTMLInputElement(1),  // first box
  HTMLInputElement(2),  // second box
  HTMLInputElement(3),  // third box
  HTMLInputElement(4),  // fourth box
];
For each <input> inside .map(...), React will pass its DOM element (el) to this function when it mounts.
We check if (el) to ensure the element exists (not null).
Then we save that element in the inputRefs.current array at the correct position (index). */}
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
              <p className="text-center text-sm mt-4">
                {canResend ? (
                  <button
                    onClick={resendOtp}
                    className="text-blue-500 cursor-pointer"
                  >
                    Resend OTP
                  </button>
                ) : (
                  `Resend OTP in ${timer}s`
                )}
              </p>
              {/* isError is a flag from React Query’s mutation state. It becomes
              true if your mutation (verifyOtpMutation.mutate) fails. React
              Query’s error type is unknown, so you need to check if it’s an
              AxiosError before accessing properties like .response. */}
              {verifyOtpMutation?.isError &&
                verifyOtpMutation.error instanceof AxiosError && (
                  <p>
                    {verifyOtpMutation.error.response?.data?.message ||
                      verifyOtpMutation.error.message}
                  </p>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
