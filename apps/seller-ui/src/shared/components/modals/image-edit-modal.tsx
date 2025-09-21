"use client";
import { useState } from "react";

const ImageEditModal = ({
  editType,
  onClose,
  onSave,
}: {
  editType: "cover" | "avatar";
  onClose: () => void;
  onSave: (imageUrl: string) => Promise<void>;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      // 1. Upload to ImageKit (or your /upload API)
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/seller/api/uploadimage", {
        // adjust if using /api/upload
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const imageUrl = data.url;

      // 2. Call parent onSave
      await onSave(imageUrl);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-md w-[400px]">
        <h2 className="text-lg font-semibold mb-4">
          Update {editType === "cover" ? "Cover" : "Avatar"}
        </h2>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Cancel
          </button>
          <button
            disabled={!file || loading}
            onClick={handleUpload}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Uploading..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditModal;
