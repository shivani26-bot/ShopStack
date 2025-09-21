import { Pencil, WandSparkles, X } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

const ImagePlaceholder = ({
  size,
  small,
  onImageChange,
  onRemove,
  defaultImage = null,
  index = null,
  setOpenImageModal,
  setSelectedImage,
  images,
  pictureUploadingLoader,
}: {
  size: string;
  small?: boolean;
  onImageChange: (file: File | null, index: number) => void;
  onRemove?: (index: number) => void;
  defaultImage?: string | null;
  index?: any;
  setOpenImageModal: (openImageModal: boolean) => void;
  setSelectedImage: (e: string) => void; //receive something of type string
  images: any; //it can be of type Uploaded||null
  pictureUploadingLoader: boolean;
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(defaultImage); //Local state just for showing a preview, start with null,
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file)); // preview the image locally,generates a temporary local preview URL (without uploading).
      onImageChange(file, index!); // tell parent "this file belongs to slot [index]", notify parent (images[index] = file). index is not null here
    }
  };
  return (
    <div
      className={`relative ${
        small ? "h-[180px]" : "h-[450px]"
      } w-full cursor-pointer bg-[#1e1e1e] border border-gray-600 rounded-lg flex flex-col justify-center items-center`}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden" //file input is hidden, usually you’ll trigger it with a label or button.
        id={`image-upload-${index}`} //unique id for each placeholder slot.
        onChange={handleFileChange}
      />
      {/* Only shows delete/edit buttons if an image is actually selected/previewed. */}
      {imagePreview ? (
        <>
          <button
            disabled={pictureUploadingLoader}
            type="button"
            onClick={() => onRemove?.(index!)} //Uses optional chaining (onRemove?.) → safe, won’t throw if onRemove isn’t passed.Calls the onRemove function (if it exists) with the current index.
            className="absolute top-3 right-3 p-2 !rounded bg-red-600 shadow-lg"
          >
            <X size={16} />
          </button>
          {/* Inside a form, if you use a <button> without type, the default type is "submit". */}
          <button
            disabled={pictureUploadingLoader} //while uploading the picture this button should be disabled
            type="button" //prevents form submission
            className="absolute top-3 right-12 p-2 !rounded bg-blue-500 shadow-lg cursor-pointer"
            onClick={() => {
              setOpenImageModal(true);
              setSelectedImage(images[index].file_url);
            }} //Updates parent state openImageModal = true.
          >
            <WandSparkles size={16} />
          </button>
        </>
      ) : (
        <label
          htmlFor={`image-upload-${index}`}
          className="absolute top-3 right-3 p-2 !rounded bg-slate-700 shadow-lg cursor-pointer"
        >
          <Pencil size={16} />
        </label>
      )}
      {/* if image is there then set the image width and height 400, 300  else  */}
      {imagePreview ? (
        <Image
          width={400}
          height={300}
          src={imagePreview}
          alt="uploaded"
          className="w-full h-full object-cover rounded-lg"
        />
      ) : (
        <>
          {" "}
          <p
            className={`text-gray-400 ${
              small ? "text-xl" : "text-4xl"
            } font-semibold`}
          >
            {size}
          </p>
          <p
            className={`text-gray-500 ${
              small ? "text-sm" : "text-lg"
            } pt-2 text-center `}
          >
            Please choose an image <br /> according to the expected ratio{" "}
          </p>
        </>
      )}
    </div>
  );
};

export default ImagePlaceholder;
