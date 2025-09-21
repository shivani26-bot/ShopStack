// : NavItemsTypes[] → Tells TypeScript that this variable (navItems) must be an array of objects, each matching the NavItemsTypes type
export const navItems: NavItemsTypes[] = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Products",
    href: "/products",
  },
  {
    title: "Shops",
    href: "/shops",
  },
  {
    title: "Offers",
    href: "/offers",
  },
  {
    title: "Become A Seller",
    href: `${process.env.NEXT_PUBLIC_SELLER_SERVER_URI}/signup`,
  },
];
