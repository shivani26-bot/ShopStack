"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const EditProfileForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    address: "",
    opening_hours: "",
    website: "",
    socialLinks: "",
  });

  // fetch existing profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/seller/api/get-seller"); // adjust API
        if (res.data?.seller) {
          setForm({
            name: res.data.seller.name || "",
            bio: res.data.seller.bio || "",
            address: res.data.seller.address || "",
            opening_hours: res.data.seller.opening_hours || "",
            website: res.data.seller.website || "",
            socialLinks: res.data.seller.socialLinks || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch seller profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put("/seller/api/edit-profile", form); // ✅ matches your backend route
      alert("Profile updated successfully!");
      router.push("/dashboard"); // redirect after success
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      alert(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-xl">
      <h1 className="text-2xl font-semibold mb-4">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Shop Name"
          className="w-full border rounded-lg p-2"
        />
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Bio"
          className="w-full border rounded-lg p-2"
        />
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Address"
          className="w-full border rounded-lg p-2"
        />
        <input
          name="opening_hours"
          value={form.opening_hours}
          onChange={handleChange}
          placeholder="Opening Hours"
          className="w-full border rounded-lg p-2"
        />
        <input
          name="website"
          value={form.website}
          onChange={handleChange}
          placeholder="Website"
          className="w-full border rounded-lg p-2"
        />
        <input
          name="socialLinks"
          value={form.socialLinks}
          onChange={handleChange}
          placeholder="Social Links (comma separated)"
          className="w-full border rounded-lg p-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          {loading ? "Updating..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default EditProfileForm;
