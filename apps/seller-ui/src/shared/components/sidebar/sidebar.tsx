"use client";

import useSeller from "apps/seller-ui/src/hooks/useSeller";
import useSidebar from "apps/seller-ui/src/hooks/useSidebar";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import Box from "../box";
import { Sidebar } from "./sidebar.styles";
import Logo from "apps/seller-ui/src/assets/svgs/logo";
import Link from "next/link";
import SidebarItem from "./sidebar.item";
import { HomeIcon } from "apps/seller-ui/src/assets/icons/home-icon";
import SidebarMenu from "./sidebar.menu";
import {
  BellPlus,
  BellRing,
  CalendarPlus,
  ListOrdered,
  LogOut,
  Mail,
  PackageSearch,
  Settings,
  SquarePlus,
  TicketPercent,
} from "lucide-react";
import { PaymentIcon } from "apps/seller-ui/src/assets/icons/payment-icon";

const SideBarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = useSidebar(); //by default on /dashbaorad
  const pathName = usePathname(); //get the current path or url
  const { seller } = useSeller(); //fetches logged  in seller
  console.log(seller);
  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  //if route is equal to activesidebar then this #0085ff colour other wise other color
  const getIconColor = (route: string) =>
    activeSidebar === route ? "#0085ff" : "#969696";
  return (
    <Box
      css={{
        height: "100vh",
        zIndex: 202,
        position: "sticky",
        padding: "8px",
        top: "0",
        overflowY: "scroll",
        scrollbarWidth: "none",
      }}
    >
      <Sidebar.Header>
        <Box>
          <Link href={"/"} className="flex justify-center text-center gap-2">
            <Logo />
            <Box>
              <h3 className="text-xl font-medium text-[#ecedee]">
                {seller?.shop?.name}
              </h3>
              {/* font-medium means font-weight: 500;whitespace-nowrap:Prevents text
              from wrapping to the next line overflow-hidden:Hides any
              text/content that overflows its container.
              text-ellipsis:Adds … (ellipsis) when text is too long. 
              The text is medium-weight, small-sized, and light gray.
It will never wrap to the next line.
If it’s too long, it gets cut off with … inside a box of max 170px width.
              */}
              <h5 className="font-medium text-xs text-[#ecedeecf] whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px] ">
                {seller?.shop?.address}
              </h5>
            </Box>
          </Link>
        </Box>
      </Sidebar.Header>
      <div className="block my-3 h-full">
        <Sidebar.Body className="body sidebar">
          <SidebarItem
            title="Dashboard"
            icon={<HomeIcon fill={getIconColor("/dashboard")} />}
            isActive={activeSidebar === "/dashboard"}
            href="/dashboard"
          />
          {/* menu  */}
          <div className="mt-2 block">
            <SidebarMenu title="Main Menu">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/orders"}
                title="Orders"
                href="/dashboard/orders"
                icon={
                  <ListOrdered
                    size={26}
                    color={getIconColor("/dashboard/orders")}
                  />
                }
              />
              <SidebarItem
                title="Payments"
                icon={
                  <PaymentIcon fill={getIconColor("/dashboard/payments")} />
                }
                isActive={activeSidebar === "/dashboard/payments"}
                href="/dashboard/payments"
              />
            </SidebarMenu>{" "}
            {/* products  */}
            <SidebarMenu title="Products">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/create-product"}
                title="Create Product"
                href="/dashboard/create-product"
                icon={
                  <SquarePlus
                    size={24}
                    color={getIconColor("/dashboard/create-product")}
                  />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/all-products"}
                title="All Products"
                href="/dashboard/all-products"
                icon={
                  <PackageSearch
                    size={22}
                    color={getIconColor("/dashboard/all-products")}
                  />
                }
              />
            </SidebarMenu>
            {/* events  */}
            <SidebarMenu title="Events">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/create-event"}
                title="Create Event"
                href="/dashboard/create-event"
                icon={
                  <CalendarPlus
                    size={24}
                    color={getIconColor("/dashboard/create-event")}
                  />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/all-events"}
                title="All Events"
                href="/dashboard/all-events"
                icon={
                  <BellPlus
                    size={22}
                    color={getIconColor("/dashboard/all-events")}
                  />
                }
              />
            </SidebarMenu>
            {/* controllers  */}
            <SidebarMenu title="Controllers">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/inbox"}
                title="Inbox"
                href="/dashboard/inbox"
                icon={
                  <Mail size={20} color={getIconColor("/dashboard/inbox")} />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/settings"}
                title="Settings"
                href="/dashboard/settings"
                icon={
                  <Settings
                    size={22}
                    color={getIconColor("/dashboard/settings")}
                  />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/notificationss"}
                title="Notifications"
                href="/dashboard/notifications"
                icon={
                  <BellRing
                    size={24}
                    color={getIconColor("/dashboard/notificationss")}
                  />
                }
              />
            </SidebarMenu>
            <SidebarMenu title="Extras">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/discount-codes"}
                title="Discount Codes"
                href="/dashboard/discount-codes"
                icon={
                  <TicketPercent
                    size={22}
                    color={getIconColor("/dashboard/discount-codes")}
                  />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/logout"}
                title="Logout"
                href="/dashboard/logout"
                icon={
                  <LogOut size={20} color={getIconColor("/dashboard/logout")} />
                }
              />
            </SidebarMenu>
          </div>
        </Sidebar.Body>
      </div>
    </Box>
  );
};

export default SideBarWrapper;
