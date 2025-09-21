import { useMutation } from "@tanstack/react-query";
import { shopCategories } from "apps/seller-ui/src/utils/categories";
import axios from "axios";
import React from "react";
import { useForm } from "react-hook-form";

const CreateShop = ({
  sellerId,
  setActiveStep,
}: {
  sellerId: string;
  setActiveStep: (step: number) => void;
}) => {
  // formState is an object provided by React Hook Form that keeps track of the status of your form.
  // formState contains: errors, isDirty, isValid, isSubmitting, isSubmitted, touchedFields, dirtyFields
  //   destructuring only { errors } from formState
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const shopCreateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/create-shop`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      setActiveStep(3);
    },
  });
  const onSubmit = async (data: any) => {
    const shopData = { ...data, sellerId };
    shopCreateMutation.mutate(shopData);
  };
  //trim() will Removes whitespace from both ends of the string.
  // /\s+/ means one or more whitespace characters (space, tab, newline, etc).
  const countWords = (text: string) => text.trim().split(/\s+/).length;
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h3 className="text-2xl font-semibold text-center mb-4">
          Setup new Shop
        </h3>
        <label className="block text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          placeholder="Shop name"
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{String(errors.name.message)}</p>
        )}
        <label className="block text-gray-700 mb-1">Bio (Max 100 words)*</label>
        {/* When you call register("bio", ...), react-hook-form automatically wires up this input to its internal state.
       That means RHF is now “watching” this <input> — it listens for user typing (onChange, onInput, etc.), and it knows what the current value is.
       Inside the validate function, RHF passes the current value of that field as the argument value.
       */}
        <input
          type="text"
          placeholder="Shop bio"
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register("bio", {
            required: "Bio is required",
            validate: (value) =>
              countWords(value) <= 100 || "Bio can't exceed 100 words",
          })}
        />
        {errors.bio && (
          <p className="text-red-500 text-sm">{String(errors.bio.message)}</p>
        )}

        <label className="block text-gray-700 mb-1">Address *</label>
        <input
          type="text"
          placeholder="Address"
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register("address", {
            required: "Shop address is required",
          })}
        />
        {errors.address && (
          <p className="text-red-500 text-sm">
            {String(errors.address.message)}
          </p>
        )}

        <label className="block text-gray-700 mb-1">Opening Hours *</label>
        <input
          type="text"
          placeholder="e.g., Mon-Fri 9AM-7PM"
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register("opening_hours", {
            required: "Opening hours is required",
          })}
        />
        {errors.opening_hours && (
          <p className="text-red-500 text-sm">
            {String(errors.opening_hours.message)}
          </p>
        )}

        <label className="block text-gray-700 mb-1">Website </label>
        <input
          type="url"
          placeholder="https://example.com"
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register("website", {
            pattern: {
              // ^ :start of the string,Means the string must begin with what comes next.
              // http → matches literal http. s? → s is optional, so it allows both http and https.
              // :\/\/ → matches :// (colon and double slashes).
              // The \/ escapes the / so regex doesn’t confuse it with regex delimiters.
              // this matches http:// and https://
              // [\w\d-]+ → a sequence of one or more:
              // \w → word characters (letters, digits, underscore).
              // \d → digits (redundant since \w already includes them).
              // - → dash.
              // \. → literal dot . (needs escaping because . means "any char").
              // (...)+ → this whole thing repeats one or more times.
              // So this matches domain names like:example.,sub.example.
              //  \w{2,}:\w → word character (letter, digit, underscore).
              // {2,} → at least 2 characters. matches tld like: com, org, in, uk
              // (\/.*)? : \/ → literal slash /. .* → zero or more of any character.
              // (...)? → whole thing is optional.
              // Matches optional path like: /abc , /shop/products?id=123
              value: /^(https?:\/\/)([\w\d-]+\.)+\w{2,}(\/.*)?$/,
              message: "Enter a valid URL",
            },
          })}
        />
        {errors.website && (
          <p className="text-red-500 text-sm">
            {String(errors.website.message)}
          </p>
        )}

        <label className="block text-gray-700 mb-1">Category *</label>
        <select
          className="w-full p-2 border border-gray-300 outline-0 rounded-[4px] mb-1"
          {...register("category", {
            required: "Category is required",
          })}
        >
          <option value="">Select a category</option>
          {shopCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-500 text-sm">
            {String(errors.category.message)}
          </p>
        )}
        <button
          type="submit"
          className="w-full text-lg bg-blue-600 text-white py-2 rounded-lg mt-4"
        >
          Create
        </button>
      </form>
    </div>
  );
};

export default CreateShop;
