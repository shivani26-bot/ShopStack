"use client";
import { useQuery } from "@tanstack/react-query";
import ImagePlaceholder from "apps/seller-ui/src/shared/components/image-placeholder";
import { enhancements } from "apps/seller-ui/src/utils/AI.enhancements";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import { AlertCircle, ChevronRight, Loader2, Wand, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import ColorSelector from "packages/components/color-selector";
import CustomProperties from "packages/components/custom-properties";
import CustomSpecifications from "packages/components/custom-specifications";
import Input from "packages/components/input";
import RichTextEditor from "packages/components/rich-text-editor";
import SizeSelector from "packages/components/size-selector";
import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface UploadedImage {
  fileId: string;
  file_url: string;
}
const Page = () => {
  //   // watch a single field
  //   const email = watch("email");
  //   // watch multiple fields
  //   const [firstName, lastName] = watch(["firstName", "lastName"]);
  //   // watch everything
  //   const allValues = watch();
  //   When to use:
  // ✅ If you want real-time UI changes based on input.
  // ✅ Example: disable a button until a checkbox is ticked, or show live preview of entered text.
  const {
    register,
    control, //control is an object that React Hook Form uses internally to manage the state of your inputs.It is especially required when you use Controller or custom components (like CustomProperties) instead of plain <input>.
    watch, //watch lets you observe the current value(s) of input(s) inside your form.It updates live whenever the user types, selects, or changes something.
    setValue, //used to programmatically set a field’s value inside the form state.
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [openImageModal, setOpenImageModal] = useState(false);
  const [isChanged, setIsChanged] = useState(true);
  // const [images, setImages] = useState<(File | null)[]>([null]); //array of files, initialized to null,The first slot (index=0) is always the main image (large box). The rest of the slots (index >= 1) are smaller images.
  const [images, setImages] = useState<(UploadedImage | null)[]>([null]); //an array of UploadedImage | null.array where each element is either UploadedImage or null ✅
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const [processing, setProcessing] = useState(false);
  const [imageLoadingError, setImageloadingError] = useState<string | null>(
    null
  ); //in ai enhancement
  const [pictureUploadingLoader, setPictureUploadingLoader] = useState(false);
  const [activeEffect, setActiveEffect] = useState<string | null>(null); //the effect selected by seller for enchancement
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/product/api/get-categories");
        console.log("res", res);
        return res.data;
      } catch (error) {
        console.log(error);
      }
    },
    staleTime: 1000 * 60 * 5, //don't refetch for 5 minutes, cache the data for 5 minutes
    retry: 2, //retry 2 times if request to api call fails
  });

  //fetching discounts
  const { data: discountCodes = [], isLoading: discountLoading } = useQuery({
    queryKey: ["shop-discounts"],
    // queryFn is the function React Query runs to fetch data.
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-discount-codes");

      return res?.data?.discount_codes || [];
    },
  });
  console.log("dis_data", discountCodes);
  // If data exists, take its categories and subCategories
  const categories = data?.categories || [];
  const subCategoriesData = data?.subCategories || {};

  // instantly gives the currently selected category without needing useState.
  const selectedCategory = watch("category"); //we get our value instantly without using usestate
  const regularPrice = watch("regular_price");

  //useMemo = only recompute when dependencies change (here: selectedCategory or subCategoriesData).
  // useMemo ensures we don’t recompute subcategories unnecessarily on every render.
  const subcategories = useMemo(() => {
    //     If selectedCategory is truthy:
    // Look up its subcategories in subCategoriesData.
    // If not found, fallback to [].
    return selectedCategory ? subCategoriesData[selectedCategory] || [] : [];
  }, [selectedCategory, subCategoriesData]);

  console.log("category and subcategory", categories, subCategoriesData);
  const onSubmit = async (data: any) => {
    console.log("formdata", data);
    try {
      setLoading(true);
      await axiosInstance.post("/product/api/create-product", data);
      router.push("/dashboard/all-products");
    } catch (error: any) {
      toast.error(error?.data?.message);
    } finally {
      setLoading(false);
    }
    console.log(data);
  };

  //   Base64 is a way to represent binary data (like images, PDFs, audio, etc.) using only text characters (A–Z, a–z, 0–9, +, /).
  // The output is always plain text, but it encodes the binary file data.
  //   To embed files in text formats
  // Some systems (e.g., JSON, HTML, XML) don’t handle raw binary well.
  // Base64 makes it safe to embed inside strings.
  //   Image uploads in web apps
  // When a user selects an image in the browser, you often convert it to Base64 and send it in the request body (JSON) instead of as a file upload.
  //   Downsides of Base64
  // Increases size by ~33%.
  // (A 1 MB image becomes ~1.33 MB in Base64).
  // Slower to process compared to just sending the raw binary.
  // That’s why in production APIs, it’s often better to upload files as multipart/form-data instead of Base64.
  // Base64 is handy mainly for quick previews, small images, or when you need inline embedding.
  const convertFileToBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      //file reading is asynchronous, wrapping it in a promise makes it easier to use with async/await.
      const reader = new FileReader(); //FileReader API:JavaScript’s built-in class to read file contents (e.g. from <input type="file">).It can read files as text, binary string, or Base64 encoded string.
      reader.readAsDataURL(file); //Converts the file into a Base64 encoded string with a prefix (data:<mime-type>;base64,...).
      reader.onload = () => resolve(reader.result); //Triggered when reading is successful.reader.result contains the Base64 string.You call resolve(reader.result) to return it.
      reader.onerror = (error) => reject(error); //Triggered if reading fails.You call reject(error) so the promise throws.
    });
  };

  //one seller can add maximum 8 pictures for one product, one product must have atleast 1 picture
  const handleImageChange = async (file: File | null, index: number) => {
    if (!file) return;
    setPictureUploadingLoader(true);
    try {
      const fileName = await convertFileToBase64(file); //file converted to base64
      console.log(fileName);
      //send to backend,upload in imagekit.io, this returns fileId, and fileUrl
      const response = await axiosInstance.post(
        "/product/api/upload-product-image",
        { fileName }
      );

      const uploadedImage: UploadedImage = {
        fileId: response.data.fileId,
        file_url: response.data.file_url,
      };
      const updatedImages = [...images]; //copy the current state of images
      updatedImages[index] = uploadedImage; //Replaces the image at the given index with the new uploaded file.
      if (index === images.length - 1 && updatedImages.length < 8) {
        updatedImages.push(null); //add a new empty slot (null) at the end, so the user always sees an “extra” empty upload box until 8 uploads are reached.
      }
      setImages(updatedImages); //Updates local React state (images) so the component re-renders with the new list of images.
      setValue("images", updatedImages); //adding new field with name: images, comes from react hook form
      //     Updates React Hook Form’s state for the field named "images".
      // This way, when you submit the form, all selected images are available in the form data.
    } catch (error) {
      console.log(error);
    } finally {
      //Always executes
      setPictureUploadingLoader(false);
    }
  };

  // .includes() method is used to check if a value exists inside an array or a string. returns true or false,  it is case sensitive
  // splice() method in JavaScript lets you add, remove, or replace elements in an array in place (it modifies the original array).
  // array.splice(start, deleteCount, item1, item2, ...)
  // start → Index at which to start changing the array.
  // deleteCount → How many items to remove (from start).
  // item1, item2, ... → Items to insert (optional).
  // splice() returns an array of removed items.
  //   let arr = ["a", "b", "c", "d"];
  //   arr.splice(1, 2);
  //   console.log(arr); // ["a", "d"]
  //   let arr = [1, 2, 5];
  //   arr.splice(2, 0, 3, 4);
  //   console.log(arr); // [1, 2, 3, 4, 5]
  // let arr = ["apple", "banana", "mango"];
  // arr.splice(1, 1, "grape");
  // console.log(arr); // ["apple", "grape", "mango"]
  // let arr = [10, 20, 30, 40, 50];
  // arr.splice(2);
  // console.log(arr); // [10, 20]

  const handleRemoveImage = async (index: number) => {
    try {
      const updatedImages = [...images];
      const imageToDelete = updatedImages[index];
      if (imageToDelete && typeof imageToDelete === "object") {
        // delete picture
        //         According to the HTTP spec, a DELETE request usually doesn't have a body.
        // Some servers do allow it, but axios.delete does not let you pass a body as the second argument.
        // Instead, the second argument to axios.delete is the config object, not the body.
        // That’s why you must wrap your body in data inside the config:
        //         data → becomes the request body (if the backend supports it).
        // Other config options like headers, params, timeout, etc., also go here.
        await axiosInstance.delete("/product/api/delete-product-image", {
          data: {
            fileId: imageToDelete.fileId!,
          },
        });
      }
      //Removes the image at the clicked index.
      updatedImages.splice(index, 1);
      //add null placeholder, when deleting a picture there must be a another placeholder to upload a new one
      //       Makes sure there’s always one null at the end (so UI can show an "Add Image" box).
      // Prevents more than 8 images.
      if (!updatedImages.includes(null) && updatedImages.length < 8) {
        updatedImages.push(null);
      }
      setImages(updatedImages);
      setValue("images", updatedImages);
    } catch (error) {
      console.log(error);
    }
  };

  //for ai enhancement
  const applyTransformation = async (transformation: string) => {
    console.log("transform", transformation); //i get effect name
    if (!selectedImage || processing) return;
    setProcessing(true);
    setImageloadingError(null);
    setActiveEffect(transformation);
    try {
      console.log("seleimg", selectedImage); //if i apply one effect for first time , next time it gives seleimg https://ik.imagekit.io/11iwzzqkk/products/product-1756105104728_6psTTEc35.jpg?tr=e-bgremove
      // now i apply another effect like upscale i get transformed as which is wrong url fomat
      // https://ik.imagekit.io/11iwzzqkk/products/product-1756105104728_6psTTEc35.jpg?tr=e-bgremove?tr=e-upscale
      // const transformedUrl = `${selectedImage}?tr=${transformation}`;
      // console.log("transformed", transformedUrl);
      const baseUrl = selectedImage.split("?tr=")[0];
      const transformedUrl = `${baseUrl}?tr=${transformation}`;
      console.log("transformed", transformedUrl);
      // Preload the URL before setting it in state
      // Fetch the transformed image manually → only set it once available
      //       Why it works in browser tab but not modal
      // In the tab, you wait until the image finally loads.
      // In <img> / <Image>, if the CDN hasn’t cached it yet, the browser times out before ImageKit finishes.
      // and we see 504 gateway timeout error
      //       ImageKit includes a response header like x-ik-error (or similar) when a transformation fails. The browser’s <Image /> component won’t surface that header directly — it only triggers onError if the image fails completely.
      // ✅ To catch the actual ImageKit error message, you’ll need to make a HEAD or fetch request to the transformed URL before updating selectedImage. That way you can read the response headers and display the exact error from ImageKit.
      const res = await fetch(transformedUrl, { method: "HEAD" }); //this is important
      if (res.ok) setSelectedImage(transformedUrl);
      else {
        //         ImageKit does send headers like x-ik-error.
        // But when you fetch() from the browser, unless the server explicitly allows those headers in CORS preflight (Access-Control-Expose-Headers), the browser will hide them.
        // That’s why res.headers.get("x-ik-error") is always null — the browser is blocking access.
        // 2nd solution : go to the end of the page
        console.log("reshead", res.headers.get("x-ik-error")); //get as null
        const errorMessage =
          res.headers.get("x-ik-error") ||
          `Transformation failed (status:${res.status})`;
        setImageloadingError(errorMessage);
      }
    } catch (error: any) {
      console.log(error);
      setImageloadingError("Failed to apply effect");
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveDraft = () => {};
  return (
    <form
      className="w-full mx-auto p-8 shadow-md rounded-lg"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* headings and breadcrumbs  */}
      <h2 className="text-2xl py-2 font-semibold font-Poppins text-white">
        Create Product
      </h2>

      <div className="flex items-center text-white">
        <Link href={"/dashboard"} className="text-[#80deea] cursor-pointer">
          Dashboard
        </Link>

        <ChevronRight size={20} className="opacity-[.8] " />
        <span>Create Product</span>
      </div>

      {/* content layout  */}
      {/* divide in 2 section  */}
      <div className="py-4 w-full flex gap-6">
        <div className="md:w-[35%]">
          {/* If the images array has at least 1 element, it renders the first image placeholder (index=0). */}
          {images?.length > 0 && (
            <ImagePlaceholder
              setOpenImageModal={setOpenImageModal}
              size="765 X 850"
              small={false} //means the first image is large (main image)
              index={0}
              onImageChange={handleImageChange}
              onRemove={handleRemoveImage}
              setSelectedImage={setSelectedImage}
              images={images} //images array
              pictureUploadingLoader={pictureUploadingLoader}
            />
          )}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Creates a new array with all images except the first one. */}
            {/* These are the secondary images. */}
            {images.slice(1).map((_, index) => (
              <ImagePlaceholder
                setOpenImageModal={setOpenImageModal} //function to open a modal (maybe for preview or crop).
                size="765 X 850" //displays expected image dimensions.
                key={index}
                small //true
                index={index + 1} //Because we sliced starting from 1, we add +1 so the actual index matches the original images array.This ensures when you call handleImageChange or handleRemoveImage, it updates the correct image slot in the original array.
                onImageChange={handleImageChange}
                onRemove={handleRemoveImage}
                setSelectedImage={setSelectedImage}
                images={images}
                pictureUploadingLoader={pictureUploadingLoader}
              />
            ))}
          </div>
        </div>
        {/* right side  - form inputs */}
        <div className="md:w-[65%]">
          {" "}
          <div className="w-full flex gap-6">
            <div className="w-2/4">
              <Input
                label="Product Title *"
                placeholder="Enter product title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.title.message as string}
                </p>
              )}

              {/* text area  */}
              <div className="mt-2">
                <Input
                  type="textarea"
                  rows={7}
                  cols={10}
                  label="Short Description * (Max 150 words)"
                  placeholder="Enter product description for quick view"
                  {...register("short_description", {
                    required: "Description is required",
                    validate: (value) => {
                      const wordCount = value.trim().split(/\s+/).length;
                      return (
                        wordCount <= 150 ||
                        `Description cannot exeed 150 words (current:${wordCount})`
                      );
                    },
                  })}
                />
                {errors.short_description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.short_description.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Tags * "
                  placeholder="apple,flagship"
                  {...register("tags", {
                    required: "Separate related products tags with a coma,",
                  })}
                />
                {errors.tags && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.tags.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Warranty * "
                  placeholder="1 year/ No warranty"
                  {...register("warranty", {
                    required: "Warranty is required!",
                  })}
                />
                {errors.warranty && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.warranty.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                {/* slug is the user-friendly, URL-safe text that identifies a specific page/resource in a website. slug would be a simplified version of the title, usually all lowercase and spaces/punctuation replaced with -:, slug: 10-best-places-to-visit-in-india
                 https://example.com/blog/10-best-places-to-visit-in-india
                 */}
                <Input
                  label="Slug * "
                  placeholder="product-slug"
                  {...register("slug", {
                    required: "Slug is required!",
                    pattern: {
                      //start from letters or digits, one or more occurences,
                      // (?: ... ):This is a non-capturing group. It groups things together but doesn’t create a capturing group (saves memory, cleaner).
                      //-(?:[a-z0-9]+): - → a literal hyphen.
                      // [a-z0-9]+ → one or more letters/digits.
                      // 👉 So this matches a hyphen followed by one or more alphanumeric characters.
                      // * → zero or more occurrences of the preceding group.
                      value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                      message:
                        "Inalid slug format! Use only lowercase letters, numbers, and hyphen ",
                    },
                    minLength: {
                      value: 3,
                      message: "Slug must be at least 3 characters long.",
                    },
                    maxLength: {
                      value: 50,
                      message: "Slug cannot be longer than 50 characters.",
                    },
                  })}
                />
                {errors.slug && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.slug.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Brand"
                  placeholder="Apple"
                  {...register("brand")}
                />
                {errors.brand && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.brand.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <ColorSelector control={control} errors={errors} />
              </div>

              <div className="mt-2">
                {/* extra input , if extra field is needed by seller */}
                <CustomSpecifications control={control} errors={errors} />
              </div>

              <div className="mt-2">
                {/* for select options  */}
                {/* when we click add button it adds new custom properties array  with label, label will be 1 but value will be an array, seller can add multiple values*/}
                {/* control → connects custom inputs/Controllers to the form state.
errors → holds validation error messages to show to the user. 
<Controller
  name="email"
  control={control}
  render={({ field }) => (
    <input {...field} placeholder="Enter email" />
  )}
/>
control tells React Hook Form:
➡️ “This input is part of the form, keep track of its value, validation, and updates.”

So when you pass control into <CustomProperties control={control} />, you’re giving that child component access to RHF’s form state manager.
*/}
                <CustomProperties control={control} errors={errors} />
              </div>

              <div className="mt-2 text-white">
                <label className="block font-semibold text-gray-300 mb-1">
                  Cash On Delivery *
                </label>
                <select
                  {...register("cash_on_delivery", {
                    required: "Cash on Delivery is required",
                  })}
                  defaultValue="yes"
                  className="w-full border outline-none border-gray-700 bg-transparent"
                >
                  {" "}
                  <option value="yes" className="bg-black">
                    Yes
                  </option>
                  <option value="no" className="bg-black">
                    No
                  </option>
                </select>
                {errors.cash_on_delivery && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.cash_on_delivery.message as string}
                  </p>
                )}
              </div>
            </div>

            {/* 3rd column section  */}
            <div className="w-2/4 ">
              {/* we can't use static data for category, adin can upload the category from the admin dashboard . this field will be dynamic. 
              we will fetch this from database model. make changes in api gateway/libs add initializesiteconfig.ts*/}
              {/* when we load the website for the first time it will automatically add this category from the backend if not available */}
              <label className="block font-semibold text-gray-300 mb-1">
                {" "}
                Category *
              </label>
              {isLoading ? (
                <p className="text-gray-400">Loading Categories...</p>
              ) : isError ? (
                <p className="text-red-500"> Failed to load categories</p>
              ) : (
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: "Category is required" }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full border outline-none text-white border-gray-700 bg-transparent"
                    >
                      <option value="" className="bg-black">
                        Select Category
                      </option>
                      {categories?.map((category: string) => (
                        <option
                          value={category}
                          key={category}
                          className="bg-black"
                        >
                          {" "}
                          {category}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
              {errors.category && (
                <p className="text-red-500 text-s mt-1">
                  {errors.category.message as string}
                </p>
              )}
              {/* you will only see the subcategories of selected category */}
              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  {" "}
                  Subcategory *
                </label>
                <Controller
                  name="subCategory"
                  control={control}
                  rules={{ required: "Subcategory is required" }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full text-white borderoutline-none border-gray-700 bg-transparent"
                    >
                      <option value="" className="bg-black">
                        Select Subcategory
                      </option>
                      {subcategories?.map((subcategory: string) => (
                        <option
                          value={subcategory}
                          key={subcategory}
                          className="bg-black"
                        >
                          {" "}
                          {subcategory}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.subCategory && (
                  <p className="text-red-500 text-s mt-1">
                    {errors.subCategory.message as string}
                  </p>
                )}
              </div>
              {/* product detail description with rich text editor  */}
              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  {" "}
                  Detailed Description * (Min 100 words)
                </label>
                <Controller
                  name="detailed_description"
                  control={control}
                  rules={{
                    required: "Detailed Description is required",
                    validate: (value) => {
                      const wordCount = value
                        ?.split(/\s+/) // split by whitespace (space, tabs, newlines) \s → matches any whitespace character, + one or more whitespace characters in a row
                        .filter((word: string) => word).length;
                      return (
                        wordCount >= 100 ||
                        "Description must be at least 100 words!"
                      );
                    },
                  }}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.detailed_description && (
                  <p className="text-red-500 text-s mt-1">
                    {errors.detailed_description.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Video URL"
                  placeholder="https://www.youtube.com/embed/xyz123"
                  {...register("video_url", {
                    pattern: {
                      value:
                        /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})$/,
                      message:
                        "Invalid Youtube embed URL! Use format: https://www.youtube.com",
                    },
                  })}
                />
                {errors.video_url && (
                  <p className="text-red-500 text-s mt-1">
                    {errors.video_url.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Regular Price"
                  placeholder="20$"
                  {...register("regular_price", {
                    valueAsNumber: true,
                    min: { value: 1, message: "Price must be at least 1" },
                    validate: (value) =>
                      !isNaN(value) || "Only numbers are allowed",
                  })}
                />
                {errors.regular_price && (
                  <p className="text-red-500 text-s mt-1">
                    {errors.regular_price.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Sale Price *"
                  placeholder="15$"
                  {...register("sale_price", {
                    required: "Sale price is required",
                    valueAsNumber: true,
                    min: { value: 1, message: "Sale price must be at least 1" },
                    validate: (value) => {
                      if (isNaN(value)) return "Only numbers are allowed";
                      if (regularPrice && value >= regularPrice) {
                        return "Sale price must be less than Regular Price";
                      }
                      return true;
                    },
                  })}
                />
                {errors.sale_price && (
                  <p className="text-red-500 text-s mt-1">
                    {errors.sale_price.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <Input
                  label="Stock *"
                  placeholder="15"
                  {...register("stock", {
                    required: "Stock is required",
                    valueAsNumber: true,
                    min: { value: 1, message: "Stock must be at least 1" },
                    max: {
                      value: 1000,
                      message: "Stock cannot exceed 1,000",
                    },
                    validate: (value) => {
                      if (isNaN(value)) return "Only numbers are allowed";
                      if (!Number.isInteger(value))
                        return "Stock must be a whole number!";
                      return true;
                    },
                  })}
                />
                {errors.stock && (
                  <p className="text-red-500 text-s mt-1">
                    {errors.stock.message as string}
                  </p>
                )}
              </div>

              <div className="mt-2">
                <SizeSelector control={control} errors={errors} />
              </div>

              <div className="mt-3">
                <label className="block font-semibold text-gray-300 mb-1">
                  Select Discount Codes (optional)
                </label>
                {discountLoading ? (
                  <p className="text-gary-400"> Loading discount codes ...</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {discountCodes?.map((code: any) => {
                      console.log("discountval", code.discountValue);
                      return (
                        <button
                          key={code.id}
                          type="button"
                          className={`px-3 py-1 rounded-md text-sm font-semibold border ${
                            watch("discountCodes")?.includes(code.id) //observe changes in discountCodes []
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700" //initally this will be bg color
                          }`}
                          onClick={() => {
                            const currentSelection =
                              watch("discountCodes") || []; //returns the current value of that field,If the field is an array of selected IDs, you can safely do .includes(code.id).
                            console.log("currselec", currentSelection);
                            const updatedSelection = currentSelection?.includes(
                              code.id
                            )
                              ? currentSelection.filter(
                                  //if there is present then remove that
                                  (id: string) => id !== code.id
                                )
                              : [...currentSelection, code.id]; //otherwise add that
                            setValue("discountCodes", updatedSelection);
                          }}
                        >
                          {code?.public_name} ({code.discountValue}{" "}
                          {code.discountType === "percentage" ? "%" : "$"})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* ai enhancement feature for image */}
          {openImageModal && (
            <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-60 z-50">
              <div className="bg-gray-800 p-6 rounded-lg w-[450px] text-white">
                <div className="flex justify-between items-center pb-3 mb-4">
                  <h2 className="text-lg font-semibold">
                    Enhance Product Image
                  </h2>
                  <X
                    size={20}
                    className="cursor-pointer"
                    onClick={() => setOpenImageModal(!openImageModal)}
                  />
                </div>
                {/* comes from next/image  */}
                <div className="relative w-full h-[250px] rounded-md overflow-hidden border border-gray-600">
                  <Image
                    src={selectedImage}
                    alt="product-image" //alternative text for accessibility & SEO
                    layout="fill" //Makes the image expand to fill the parent container(absolutely positioned).Parent element must have a fixed width/height or position: relative
                    // objectFit="contain" //Works only with layout="fill".how the image should scale inside its box
                  />
                  {/* loader overlay  */}
                  {processing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                  {!processing && imageLoadingError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-600/80 text-white text-sm font-medium p-2">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      {imageLoadingError}
                    </div>
                  )}
                </div>
                {selectedImage && (
                  <div className="mt-4 space-y-2">
                    <h3 className="text-white text-sm font-semibold">
                      AI Enhancements
                    </h3>
                    {/* Adds a vertical scrollbar only when needed.
If content fits → no scrollbar.
If content overflows → scrollbar appears. */}
                    <div className="grid grid-cols-2 gap-3 mx-h-[250px] overflow-y-auto">
                      {enhancements?.map(({ label, effect }) => (
                        <button
                          key={effect}
                          type="button"
                          className={`p-2 rounded-md flex items-center gap-2 ${
                            activeEffect === effect
                              ? "bg-blue-600 text-white"
                              : "bg-gray-700 hover:bg-gray-600"
                          }`}
                          onClick={() => applyTransformation(effect)}
                          disabled={processing}
                        >
                          <Wand size={18} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3">
            {isChanged && (
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-gray-700 text-white rounded-md"
              >
                Save Draft
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Page;

// isNaN(value)
// Purpose: Checks if the given value is Not a Number (NaN).
// NaN stands for "Not-a-Number".
// If the value cannot be converted to a number, isNaN returns true.

// isNaN("abc");  // true
// isNaN("123");  // false (because "123" can be converted to number 123)
// isNaN(45);     // false
// isNaN(undefined); // true

// Number.isInteger(value)
// Purpose: Checks if a number is an integer (whole number, no decimals).
// Returns true only for whole numbers.
// Number.isInteger(10);    // true
// Number.isInteger(10.5);  // false
// Number.isInteger(-3);    // true
// Number.isInteger("5");   // false, because it's a string, not a number

// in upload picture we will add ai feature, seller can upscale the image or remove the background color or
// like add some more filter in the image , so without uploading the image on image kit its not possible
// so thats why when seller is uploading one picture, we have to instantly upload that in image kit . if seller is removing
// the picture we can remove it from the image kit, hence not storing the pictures which seller are not using

// Flexbox (1D layout system)
// Designed for one-dimensional layouts (either row OR column).
// Distributes space along a single axis.
// Best for aligning items or creating responsive rows/columns.
// Great when:
// You want to align items in a row or column.
// You don’t know how many items there will be.
// Example: navbar, buttons in a row, sidebar + content layout.

// Grid (2D layout system)
// Designed for two-dimensional layouts (rows AND columns).
// You define an explicit grid with rows & columns.
// Best for structured page layouts where both axes matter.
// use for: (dashboards, galleries, full layouts)

// Proxy the request via your backend 🚀 (recommended)
// If you need the real ImageKit error message (x-ik-error), you’ll need to fetch the image from your backend (Node/Next.js API route), because:
// Node fetch can read all headers (no CORS restrictions).
// Your backend then returns the headers to your frontend.
// pages/api/check-image.ts
// backend:
//  import type { NextApiRequest, NextApiResponse } from "next";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   const { url } = req.query;

//   try {
//     const response = await fetch(url as string, { method: "HEAD" });

//     const errorHeader = response.headers.get("x-ik-error");

//     res.status(200).json({
//       ok: response.ok,
//       status: response.status,
//       error: errorHeader,
//     });
//   } catch (err) {
//     res.status(500).json({ ok: false, error: "Proxy request failed" });
//   }
// }

// frontend:
// const checkImage = async (url: string) => {
//   const res = await fetch(`/api/check-image?url=${encodeURIComponent(url)}`);
//   return res.json();
// };

// const applyTransformation = async (transformation: string) => {
//   if (!selectedImage || processing) return;
//   setProcessing(true);
//   setImageloadingError(null);
//   setActiveEffect(transformation);

//   const baseUrl = selectedImage.split("?tr=")[0];
//   const transformedUrl = `${baseUrl}?tr=${transformation}`;

//   try {
//     const { ok, error } = await checkImage(transformedUrl);

//     if (!ok) setImageloadingError(error || "Transformation failed");
//     else setSelectedImage(transformedUrl);
//   } catch {
//     setImageloadingError("Failed to apply effect");
//   } finally {
//     setProcessing(false);
//   }
// };
