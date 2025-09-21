"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import StatCard from "apps/user-ui/src/shared/components/cards/stat-card";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import {
  BadgeCheck,
  Bell,
  CheckCircle,
  Clock,
  Gift,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Pencil,
  PhoneCall,
  Receipt,
  Settings,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { act, useEffect, useState } from "react";
import userAvatar from "../../../assets/icons/avatardefault_92824.png";
import QuickActionCard from "apps/user-ui/src/shared/components/cards/quick-action.card";
import ShippingAddressSection from "apps/user-ui/src/shared/components/shippingAddress";
import OrdersTable from "apps/user-ui/src/shared/components/tables/orders-table";
import ChangePassword from "apps/user-ui/src/shared/components/change-password";
import useRequireAuth from "apps/user-ui/src/hooks/useRequiredAuth";
import Link from "next/link";

const Page = () => {
  //     If the URL is /settings?active=Security, then
  // searchParams.get("active") → "Security"
  const searchParams = useSearchParams(); //gives you access to the URL query string (everything after ? in the URL).
  const router = useRouter(); //lets you navigate programmatically (e.g., push a new URL, go back).
  const queryClient = useQueryClient(); //gives you access to the query client instance, so you can: invalidate queries, refetch data, set cache manually
  // const { user, isLoading } = useUser();
  const { user, isLoading } = useRequireAuth(); //this makes a protected route
  const queryTab = searchParams.get("active") || "Profile"; //This checks the current URL query param named active. If it exists → use its value. If not → default to "Profile".
  const [activeTab, setActiveTab] = useState(queryTab);
  useEffect(() => {
    if (activeTab !== queryTab) {
      const newParams = new URLSearchParams(searchParams); //creates a copy of searchParams
      //   console.log("newParams", newParams);//URLSearchParams {size: 1}
      newParams.set("active", activeTab); //Updates the active param to "Notifications".
      router.replace(`/profile?${newParams.toString()}`);
    }
  }, [activeTab]);

  const logoutHandler = async () => {
    await axiosInstance.get("/api/logout-user").then((res) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.push("/login");
    });
  };

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/api/get-user-notifications");
      return res.data.notifications;
    },
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/order/api/get-user-orders`);
      return res.data.orders;
    },
  });

  const markAsRead = async (notificationId: string) => {
    await axiosInstance.post("/seller/api/mark-notification-as-read", {
      notificationId,
    });
  };

  const totalOrders = orders.length;

  const processingOrders = orders.filter(
    (o: any) =>
      o?.deliveryStatus !== "Delivered" && o?.deliveryStatus !== "Cancelled"
  ).length;

  const completedOrders = orders.filter(
    (o: any) => o?.deliveryStatus === "Delivered"
  ).length;

  return (
    <div className="bg-gray-50 p-6 pb-14">
      <div className="md:max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back,{" "}
            <span className="text-blue-500">
              {isLoading ? (
                <Loader2 className="inline animate-spin w-5 h-5" />
              ) : (
                `${user?.name || "User"}`
              )}
            </span>
          </h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <StatCard title="Total Orders" count={totalOrders} Icon={Clock} />
          <StatCard
            title="Processing Orders"
            count={processingOrders}
            Icon={Truck}
          />
          <StatCard
            title="Completed  Orders"
            count={completedOrders}
            Icon={CheckCircle}
          />
        </div>

        {/* sidebar and content layout  */}
        <div className="mt-10 flex flex-col md:flex-row gap-6">
          {/* left navigation  */}
          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 w-full md:w-1/5">
            <nav className="space-y-2">
              <NavItem
                label="Profile"
                Icon={User}
                active={activeTab === "Profile"}
                onClick={() => setActiveTab("Profile")}
              />
              <NavItem
                label="My Orders"
                Icon={ShoppingBag}
                active={activeTab === "My Orders"}
                onClick={() => setActiveTab("My Orders")}
              />
              <NavItem
                label="Inbox"
                Icon={Inbox}
                active={activeTab === "Inbox"}
                onClick={() => router.push("/inbox")}
              />
              <NavItem
                label="Notifications"
                Icon={Bell}
                active={activeTab === "Notifications"}
                onClick={() => setActiveTab("Notifications")}
              />
              <NavItem
                label="Shipping Address"
                Icon={MapPin}
                active={activeTab === "Shipping Address"}
                onClick={() => setActiveTab("Shipping Address")}
              />
              <NavItem
                label="Change Password"
                Icon={Lock}
                active={activeTab === "Change Password"}
                onClick={() => setActiveTab("Change Password")}
              />
              <NavItem
                label="Logout"
                Icon={LogOut}
                danger
                active={activeTab === "Logout"}
                onClick={() => logoutHandler()}
              />
            </nav>
          </div>

          {/* main content  */}
          <div className="bg-white p-6 rounded-md shadow-sm border border-gray-100 w-full md:w-[55%]">
            <h2 className="text-x font-semibold text-gray-500 mb-4">
              {activeTab}{" "}
            </h2>
            {activeTab === "Profile" && !isLoading && user ? (
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-center gap-3">
                  <Image
                    src={user?.avatar || userAvatar}
                    alt=""
                    width={60}
                    height={60}
                    className="w-16 h-16 rounded-full border border-gray-200"
                  />
                  <button className="flex items-center gap-1 text-blue-500 text-xs font-medium">
                    <Pencil className="w-4 h-4" /> Change Photo{" "}
                  </button>
                </div>
                <p>
                  <span className="font-semibold">Name: </span>
                  {user.name}
                </p>
                <p>
                  <span className="font-semibold">Email: </span>
                  {user.email}
                </p>
                <p>
                  <span className="font-semibold">Joined: </span>
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
                {/* once user finishes the order they can earn points for the order and use those points for further gifts and discounts */}
                <p>
                  <span className="font-semibold">Earned Points: </span>
                  {user.points || 0}
                </p>
              </div>
            ) : activeTab === "Shipping Address" ? (
              <ShippingAddressSection />
            ) : activeTab == "My Orders" ? (
              <OrdersTable />
            ) : activeTab == "Change Password" ? (
              <ChangePassword />
            ) : activeTab === "Notifications" ? (
              <div className="space-y-4 text-sm text-gray-700">
                {!notificationsLoading && notifications?.length === 0 && (
                  <p>No Notifications available yet!</p>
                )}
                {!notificationsLoading && notifications?.length > 0 && (
                  <div className="md:w-[80%] my-6 rounded-lg divide-y divide-gray-800 bg-black/40 backdrop-blur-lg shadow-sm">
                    {notifications.map((d: any) => (
                      <Link
                        key={d.id}
                        href={`${d.redirect_link}`}
                        className={`block px-5 py-4 transition ${
                          d.status !== "Unread"
                            ? "hover:bg-gray-800/40"
                            : "bg-gray-800/50 hover:bg-gray-800/70"
                        }`}
                        onClick={() => markAsRead(d.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col">
                            <span className="text-white font-medium">
                              {d.title}
                            </span>
                            <span className="text-gray-300 text-sm">
                              {d.message}
                            </span>
                            <span className="text-gray-500 text-xs mt-1">
                              {new Date(d.createdAt).toLocaleString("en-UK", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p>Not Found</p>
            )}
          </div>
          {/* right quick panel  */}
          {/* these will be covered in mobile app part , these will be dynamic */}
          <div className="w-full md:w-1/4 space-y-4">
            <QuickActionCard
              Icon={Gift}
              title="Referral Program"
              description="Invite friends and earn rewards."
            />
            <QuickActionCard
              Icon={BadgeCheck}
              title="Your Badges"
              description="View your earned achievements."
            />
            <QuickActionCard
              Icon={Settings}
              title="Account Settings"
              description="Manage prefrences and security."
            />
            <QuickActionCard
              Icon={Receipt}
              title="Billing History"
              description="Check your recent payments."
            />
            <QuickActionCard
              Icon={PhoneCall}
              title="Support Center"
              description="Need help? Contact Support."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;

const NavItem = ({ label, Icon, active, danger, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
      active
        ? "bg-blue-100 text-blue-600"
        : danger
        ? "text-red-500 hover:bg-red-50"
        : "text-gray-700 hover:bg-gray-100"
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);
