"use client";
import BreadCrumbs from "apps/admin-ui/src/shared/components/breadcrumbs";
import axiosInstance from "apps/admin-ui/src/utils/axiosInstance";
import React, { useEffect, useState } from "react";

const tabs = ["Categories", "Logo", "Banner"];

const Customization = () => {
  const [activeTab, setActiveTab] = useState("Categories");
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<Record<string, string[]>>(
    {}
  );
  const [logo, setLogo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchCustomization = async () => {
      try {
        const res = await axiosInstance.get("/admin/api/get-all");
        const data = res.data;
        setCategories(data.categories || []);
        setSubCategories(data.subCategories || {});
        setLogo(data.logo || null);
        setBanner(data.banner || null);
      } catch (err) {
        console.error("Failed to fetch customization data", err);
      }
    };
  });
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      await axiosInstance.post("/admin/api/add-category", {
        category: newCategory,
      });
      setCategories((prev) => [...prev, newCategory]);
      setNewCategory("");
    } catch (error) {
      console.error("Error adding subcategory", error);
    }
  };
  const handleAddSubCategory = async () => {
    if (!newSubCategory.trim() || !selectedCategory) return;

    try {
      await axiosInstance.post("/admin/api/add-subcategory", {
        category: selectedCategory,
        subCategory: newSubCategory,
      });
      setSubCategories((prev) => ({
        ...prev,
        [selectedCategory]: [...(prev[selectedCategory] || []), newSubCategory],
      }));
      setNewSubCategory("");
    } catch (error) {
      console.error("Error adding subcategory", error);
    }
  };
  return (
    <div className="w-full min-h-screen p-6 text-white bg-black">
      <h2 className="text-2xl font-bold mb-2">Customization</h2>
      <BreadCrumbs title="Customization" />

      {/* Tabs */}
      <div className="flex items-center gap-6 mt-6 border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab
                ? "text-green-500 border-b-2 border-green-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Categories Section */}
      {activeTab === "Categories" && (
        <>
          <div className="mt-8 space-y-4">
            {categories.length === 0 ? (
              <p className="text-gray-400">No categories found.</p>
            ) : (
              categories.map((cat, idx) => (
                <div key={idx}>
                  <p className="font-semibold mb-1">{cat}</p>
                  {subCategories?.[cat]?.length > 0 ? (
                    <ul className="ml-4 text-sm text-gray-400 list-disc">
                      {subCategories[cat].map((sub, i) => (
                        <li key={i}>{sub}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="ml-4 text-xs italic text-gray-500">
                      No subcategories.
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add New Category */}
          <div className="pt-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="New category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-3 py-1 rounded-md outline-none text-sm bg-gray-800 text-white"
            />
            <button
              onClick={handleAddCategory}
              className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md"
            >
              Add Category
            </button>
          </div>

          {/* Add Subcategory */}
          <div className="pt-4 flex items-center gap-2 flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-800 outline-none text-white border border-gray-600 px-2 py-1 rounded-md"
            >
              <option value="">Select Category</option>
              {categories.map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="New subcategory"
              value={newSubCategory}
              onChange={(e) => setNewSubCategory(e.target.value)}
              className="px-3 py-1 rounded-md outline-none text-sm bg-gray-800 text-white"
            />
            <button
              onClick={handleAddSubCategory}
              className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md"
            >
              Add SubCategory
            </button>
          </div>
        </>
      )}

      {/* Logo Section */}
      {activeTab === "Logo" && (
        <div className="mt-8 space-y-4">
          {logo ? (
            <img
              src={logo}
              alt="Platform Logo"
              className="w-[120px] h-auto border border-gray-600 p-2 bg-white rounded-md"
            />
          ) : (
            <p className="text-gray-400">No logo uploaded.</p>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const formData = new FormData();
              formData.append("file", file);
              try {
                const res = await axiosInstance.post(
                  "/admin/api/upload-logo",
                  formData
                );
                setLogo(res.data.logo);
              } catch (err) {
                console.error("Logo upload failed", err);
              }
            }}
            className="text-sm text-white"
          />
        </div>
      )}

      {/* Banner Section */}
      {activeTab === "Banner" && (
        <div className="mt-8 space-y-4">
          {banner ? (
            <img
              src={banner}
              alt="Platform Banner"
              className="w-full max-w-[600px] h-auto border border-gray-600 rounded-md"
            />
          ) : (
            <p className="text-gray-400">No banner uploaded.</p>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const formData = new FormData();
              formData.append("file", file);
              try {
                const res = await axiosInstance.post(
                  "/admin/api/upload-banner",
                  formData
                );
                setBanner(res.data.banner);
              } catch (err) {
                console.error("Banner upload failed", err);
              }
            }}
            className="text-sm text-white"
          />
        </div>
      )}
    </div>
  );
};

export default Customization;
