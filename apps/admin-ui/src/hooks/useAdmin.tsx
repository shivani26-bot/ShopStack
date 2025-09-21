import React, { useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// fetch admin data from api
const fetchAdmin = async () => {
  const response = await axiosInstance.get("/api/logged-in-admin");
  return response.data.user;
};
const useAdmin = () => {
  // useQuery comes from React Query (or TanStack Query). It’s used to fetch and cache data.
  const {
    data: admin, //data → the actual fetched user. Renamed to user with data: user.
    isLoading, //isLoading → true while the fetch is in progress.
    isError, //isError → true if the fetch failed.
    refetch, //refetch → a function to manually re-fetch the data.
  } = useQuery({
    queryKey: ["admin"], //Unique key for this query. React Query uses it to cache and identify this data.Example: all components using ["user"] will share the same cached data.
    queryFn: fetchAdmin, //React Query calls this function automatically.Function that actually fetches the data (probably does an Axios GET request).
    staleTime: 1000 * 60 * 5, //5minutes. Data is considered fresh for 5 minutes; React Query won’t refetch during this time unless you call refetch.data is cached for 5 minutes
    retry: 1, //If the fetch fails, React Query will retry once before reporting an error.
  });

  //   const history = useRouter();
  // This uses Next.js’s useRouter hook.
  // It gives you access to the router object, which allows navigation (redirects, pushing new routes, getting route info, etc.).
  // Here history.push("/") means redirect to the homepage (/).
  const router = useRouter();
  useEffect(() => {
    //     It only redirects if:
    // isLoading is false → meaning the data fetching is done.
    // admin is falsy → meaning no admin user was found.
    if (!isLoading && !admin) router.push("/");
  }, [admin, isLoading, router]);
  return { admin, isLoading, isError, refetch };
};

export default useAdmin;
