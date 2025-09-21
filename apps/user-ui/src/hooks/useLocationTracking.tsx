"use client";

import { useEffect, useState } from "react";

// use third party api to get the location of user
// we fetch the user location and store it in user local storage so that we don't refetch every time, refetch only when user location is updated

const LOCATION_STORAGE_KEY = "user_location";
const LOCATION_EXPIRY_DAYS = 20;

// ReferenceError: localStorage is not defined
// Why it happens
// localStorage only exists in the browser.
// In Next.js, server components and server-side rendering (SSR) run in Node.js, where localStorage does not exist.
// If you try to use localStorage directly in a hook or in a server component, you’ll get this error.
// Guard with typeof window !== "undefined" or call inside useEffect.
const getStoredLocation = () => {
  if (typeof window === "undefined") return null; // ⬅️ only run in browser

  const storedData = localStorage.getItem(LOCATION_STORAGE_KEY);
  if (!storedData) return null;
  const parsedData = JSON.parse(storedData);
  const expiryTime = LOCATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000; //max 20 days
  const isExpired = Date.now() - parsedData.timestamp > expiryTime;
  return isExpired ? null : parsedData;
};

const useLocationTracking = () => {
  const [location, setLocation] = useState<{
    country: string;
    city: string;
  } | null>(getStoredLocation());
  useEffect(() => {
    if (location) return; //location already stored in localstorage

    // fetch from third party
    fetch("http://ip-api.com/json/")
      .then((res) => res.json())
      .then((data) => {
        const newLocation = {
          country: data?.country,
          city: data.city,
          timestamp: Date.now(),
        };
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
        setLocation(newLocation);
      })
      .catch((error) => console.log("Failed to get location", error));
  }, []);
  return location;
};

export default useLocationTracking;

// JSON.stringify(value)
// Converts a JavaScript object/array into a JSON string.
// Useful when storing data in localStorage, sending in API requests, etc.
// const user = { name: "John", age: 25 };
// const str = JSON.stringify(user);
// console.log(str);
// // '{"name":"John","age":25}'  (string form)
// JSON.parse(string)
// Converts a JSON string back into a JavaScript object/array.
// const str = '{"name":"John","age":25}';
// const obj = JSON.parse(str);
// console.log(obj.name);
// // "John" (now it's a real JS object)
// .json() (Response method in fetch)
// When you call fetch, it returns a Response object.
// response.json() is an async method that reads the response body and parses it into a JavaScript object.
// fetch("https://jsonplaceholder.typicode.com/todos/1")
//   .then((res) => res.json())  // parses response body into JS object
//   .then((data) => console.log(data));
// .json() internally
// const text = await res.text();
// return JSON.parse(text);
