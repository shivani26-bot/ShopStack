import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sendKafkaEvent } from "../actions/track-user";

//single product that can go into a cart or wishlist:
type Product = {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity?: number;
  shopId: string; //ID of the shop or seller that owns this product.
};

// Store type defines the shape of the store
// Store defines a state manager that holds cart and wishlist arrays and provides methods to manipulate them.
type Store = {
  cart: Product[]; //array of products currently in the cart.
  wishlist: Product[]; //array of products currently in the wishlist.
  addToCart: (
    //the product to add.
    //Adds a product to the cart.
    product: Product,
    user: any, //the current logged-in user (could be an object with user ID, name, etc.).
    location: any, //optional metadata about the user’s location (e.g., for regional offers or shipping).
    deviceInfo: any //optional metadata about the device (mobile, browser info, etc.).
  ) => void;
  removeFromCart: (
    //Removes a product from the cart using its id.
    id: string,
    user: any,
    location: any,
    deviceInfo: any
  ) => void;
  addToWishList: (
    product: Product,
    user: any,
    location: any,
    deviceInfo: any
  ) => void;
  removeFromWishList: (
    id: string,
    user: any,
    location: any,
    deviceInfo: any
  ) => void;
};

// Zustand store (useStore) for managing cart and wishlist functionality in your e-commerce app, with persistent storage (localStorage or sessionStorage).
// create<Store> takes a single argument, which can be persist(...).
// persist now takes two arguments internally: the state creator (set, get) => {...} and the options { name: "store-storage" }
//must define all the functions in type Store
// useStore is now a hook that can be used in React components to access state (cart, wishlist) and actions (addToCart, removeFromCart etc.).
export const useStore = create<Store>()(
  // persist :
  //   Wraps the store in Zustand’s persist middleware.
  // This means the cart/wishlist will be saved in localStorage with the key "store-storage".
  // So when the page reloads, the data is not lost.
  persist(
    (set, get) => ({
      // initially both cart and wishlist are empty arrays
      cart: [],
      wishlist: [],
      // add to cart
      addToCart: (product, user, location, deviceInfo) => {
        //         If the product already exists in the cart → increase quantity by 1.
        // If not → add it with quantity = 1.
        // set updates the state.
        //         ??((Nullish Coalescing Operator)) means “if the left-hand side is null or undefined, use the right-hand side.”
        // It does not treat 0, false, or "" as “empty” like || does
        set((state) => {
          const existing = state.cart?.find((item) => item.id === product.id);
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: (item.quantity ?? 1) + 1 }
                  : item
              ),
            };
          }
          return {
            cart: [...state.cart, { ...product, quantity: product?.quantity }],
          };
        });

        //send kafka event
        if (user?.id && location && deviceInfo) {
          sendKafkaEvent({
            userId: user?.id,
            productId: product?.id,
            shopId: product?.shopId,
            action: "add_to_cart",
            country: location?.country || "Unknown",
            city: location?.city || "Unknown",
            device: deviceInfo || "Unknown Device",
          });
        }
      },
      // remove from cart
      // when someone is adding an item inside wishlist , we want to send that to our kafka server and from there we will store that inside our database as logged in user activity
      // action what the user is doing like add to cart remove etc
      removeFromCart: (id, user, location, deviceInfo) => {
        //find the product before calling set (you can log or send it to Kafka before removing).
        const removedProduct = get().cart.find((item) => item.id === id);
        console.log("removePr", removedProduct);
        set((state) => ({
          cart: state.cart?.filter((item) => item.id !== id),
        }));

        //send kafka event
        if (user?.id && location && deviceInfo && removedProduct) {
          sendKafkaEvent({
            userId: user?.id,
            productId: removedProduct?.id,
            shopId: removedProduct?.shopId,
            action: "remove_from_cart",
            country: location?.country || "Unknown",
            city: location?.city || "Unknown",
            device: deviceInfo || "Unknown Device",
          });
        }
      },
      //add to wishlist
      addToWishList: async (product, user, location, deviceInfo) => {
        console.log(deviceInfo);
        set((state) => {
          if (state.wishlist?.find((item) => item.id === product.id))
            return state;
          return { wishlist: [...state.wishlist, product] };
        });

        //send kafka event

        if (user?.id && location && deviceInfo) {
          console.log("inside add to wishlist");
          sendKafkaEvent({
            userId: user?.id,
            productId: product?.id,
            shopId: product?.shopId,
            action: "add_to_wishlist",
            country: location?.country || "Unknown",
            city: location?.city || "Unknown",
            device: deviceInfo || "Unknown Device",
          });
        }
      },

      removeFromWishList: async (id, user, location, deviceInfo) => {
        console.log(deviceInfo);
        //find the product before calling set
        const removedProduct = get().wishlist.find((item) => item.id === id);

        set((state) => ({
          wishlist: state.wishlist?.filter((item) => item.id !== id),
        }));
        //send kafka event
        if (user?.id && location && deviceInfo && removedProduct) {
          sendKafkaEvent({
            userId: user?.id,
            productId: removedProduct?.id,
            shopId: removedProduct?.shopId,
            action: "remove_from_wishlist",
            country: location?.country || "Unknown",
            city: location?.city || "Unknown",
            device: deviceInfo || "Unknown Device",
          });
        }
      },
    }),
    {
      name: "store-storage", // persist key
    }
  )
);

// find():
// find() is an array method in JavaScript.
// It returns the first element in the array that satisfies a given condition (callback function).
// If no element is found, it returns undefined.

// array.find(callback(element, index, array), thisArg);
// callback → function that runs for each element. It should return true for the element you want.
// element → current element being processed.
// index → (optional) index of current element.
// array → (optional) the full array.
// thisArg → (optional) value to use as this inside callback.

// const numbers = [5, 12, 8, 130, 44];
// const found = numbers.find(num => num > 10);
// console.log(found); // 12 (first number > 10)

// let a = null;
// let b = a ?? 5;
// console.log(b); // 5 (since a is null)

// let x = 0;
// let y = x ?? 10;
// console.log(y); // 0 (because 0 is NOT null/undefined)
