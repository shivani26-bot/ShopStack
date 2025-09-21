import { X } from "lucide-react";
import React from "react";

const DeleteDiscountCodeModal = ({
  discount,
  onClose,
  onConfirm,
}: {
  discount: any;
  onClose: () => void;
  onConfirm?: any;
}) => {
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg w-[450px] shadow-lg">
        <div className="flex justify-between items-center border-b border-gray-700 pb-3">
          <h3 className="text-xl text-white">Delete Discount Code</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            {" "}
            <X size={22} />{" "}
          </button>
        </div>
        {/* warning message  */}
        <p className="text-gray-300 mt-4">
          {/* {" "} adds space  */}
          Are your sure you want to delete{" "}
          <span className="font-semibold text-white">
            {discount.public_name}
          </span>
          ?<br />
          This action ** canot be undone **
        </p>
        {/* actions buttons  */}

        {/* transition is a utility that tells the browser:
"When a property changes (like color, background, transform, opacity, etc.), don’t jump immediately — smoothly animate the change over time." 
<button className="bg-blue-500 hover:bg-red-500 p-2 rounded">
  Hover me
</button>
When you hover → background color switches immediately from blue to red (no animation).
<button className="bg-blue-500 hover:bg-red-500 p-2 rounded transition duration-300">
  Hover me
</button>
Now when you hover → background color fades smoothly from blue to red in 300ms.
*/}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-white font-semibold transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDiscountCodeModal;
