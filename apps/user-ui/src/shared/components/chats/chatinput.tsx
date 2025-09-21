import { PickerProps } from "emoji-picker-react";
import { ImageIcon, Send, Smile } from "lucide-react";
import dynamic from "next/dynamic";
import React, { useState } from "react";

const EmojiPicker = dynamic(
  () =>
    import("emoji-picker-react").then(
      (mod) => mod.default as React.FC<PickerProps>
    ),
  {
    ssr: false,
  }
);

const ChatInput = ({
  onSendMessage,
  message,
  setMessage,
}: {
  onSendMessage: (e: any) => void;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Uploading image:", file.name);
    }
  };
  return (
    <form
      onSubmit={onSendMessage}
      className="border-t border-t-gray-200 bg-white px-4 py-3 flex items-center gap-2 relative"
    >
      {/* upload icon */}
      <label
        aria-label="Upload image"
        className="cursor-pointer p-2 hover:bg-gray-100 rounded-md"
      >
        <ImageIcon className="w-5 h-5 text-gray-600" />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          hidden
        />
      </label>

      {/* emoji picker toggle */}
      <div className="relative">
        <button
          type="button"
          aria-label="Open emoji picker"
          onClick={() => setShowEmoji((prev) => !prev)}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <Smile className="w-5 h-5 text-gray-600" />
        </button>
        {showEmoji && (
          <div className="absolute bottom-full mb-2 left-0 z-50">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>

      {/* input field */}
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
      />

      {/* send button */}
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 transition text-white p-2 rounded-md flex items-center justify-center"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};

export default ChatInput;
