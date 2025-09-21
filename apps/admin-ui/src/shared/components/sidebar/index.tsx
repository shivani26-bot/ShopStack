"use client";
import useAdmin from "apps/admin-ui/src/hooks/useAdmin";
import useSidebar from "apps/admin-ui/src/hooks/useSidebar";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import Box from "../box";
import { Sidebar } from "./sidebar.styles";
import Link from "next/link";
import Logo from "apps/admin-ui/src/app/assets/svgs/logo";
import SidebarItem from "./sidebar.item";
import SidebarMenu from "./sidebar.menu";
import {
  BellPlus,
  BellRing,
  CalendarPlus,
  Home,
  ListOrdered,
  LogOut,
  Mail,
  PackageSearch,
  PencilRuler,
  Settings,
  SquarePlus,
  Store,
  TicketPercent,
  Users,
} from "lucide-react";
import { HomeIcon } from "apps/admin-ui/src/app/assets/svgs/home.icon";
import { PaymentIcon } from "apps/admin-ui/src/app/assets/svgs/payment.icon";

const SideBarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = useSidebar(); //by default on /dashbaorad
  const pathName = usePathname();
  const { admin } = useAdmin();
  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

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
        <Link href={"/"} className="flex justify-center text-center gap-2">
          <Logo />
          <Box>
            <h3 className="text-xl font-medium text-[#ecedee]">
              {admin?.name}
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
              {admin?.email}
            </h5>
          </Box>
        </Link>
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
              <SidebarItem
                isActive={activeSidebar === "/dashboard/users"}
                title="Users"
                href="/dashboard/users"
                icon={
                  <Users size={24} color={getIconColor("/dashboard/users")} />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/sellers"}
                title="Sellers"
                href="/dashboard/sellers"
                icon={
                  <Store size={24} color={getIconColor("/dashboard/sellers")} />
                }
              />
            </SidebarMenu>{" "}
            {/* controllers  */}
            <SidebarMenu title="Controllers">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/loggers"}
                title="Loggers"
                href="/dashboard/loggers"
                icon={
                  <Mail size={20} color={getIconColor("/dashboard/loggers")} />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/management"}
                title="Management"
                href="/dashboard/management"
                icon={
                  <Settings
                    size={22}
                    color={getIconColor("/dashboard/management")}
                  />
                }
              />
              <SidebarItem
                isActive={activeSidebar === "/dashboard/notifications"}
                title="Notifications"
                href="/dashboard/notifications"
                icon={
                  <BellRing
                    size={24}
                    color={getIconColor("/dashboard/notifications")}
                  />
                }
              />
            </SidebarMenu>
            {/* for customizing the website , like branding and logo */}
            <SidebarMenu title="Customization">
              <SidebarItem
                isActive={activeSidebar === "/dashboard/customization"}
                title="All Customization"
                href="/dashboard/customization"
                icon={
                  <PencilRuler
                    size={24}
                    color={getIconColor("/dashboard/customization")}
                  />
                }
              />
            </SidebarMenu>
            <SidebarMenu title="Extras">
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
