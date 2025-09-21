import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import { useAuthStore } from "../store/authStore";
import { isProtected } from "../utils/protected";

//fetch user data from api
const fetchUser = async (isLoggedIn: boolean) => {
  //we are telling useuser that this routed is protected if user is logged in
  const config = isLoggedIn ? isProtected : {};
  console.log("config", config);
  const response = await axiosInstance.get("/api/logged-in-user", config);
  return response.data.user;
};

//hook to get logged in user info , we can use this anywhere
// Custom hooks typically encapsulate logic like fetching data or managing state, so you can reuse it across components.
const useUser = () => {
  const { setLoggedIn, isLoggedIn } = useAuthStore();
  // useQuery comes from React Query (or TanStack Query). It’s used to fetch and cache data.
  const {
    data: user, //data → the actual fetched user. Renamed to user with data: user.
    isPending, //isLoading → true while the fetch is in progress.
    isError, //isError → true if the fetch failed.
    // refetch, //refetch → a function to manually re-fetch the data.
  } = useQuery({
    queryKey: ["user"], //Unique key for this query. React Query uses it to cache and identify this data.Example: all components using ["user"] will share the same cached data.
    queryFn: () => fetchUser(isLoggedIn), //React Query calls this function automatically.Function that actually fetches the data (probably does an Axios GET request).
    staleTime: 1000 * 60 * 5, //5minutes. Data is considered fresh for 5 minutes; React Query won’t refetch during this time unless you call refetch.
    // retry: 1, //If the fetch fails, React Query will retry once before reporting an error.
    retry: false,
    // enabled: isLoggedIn,
    //@ts-ignore
    onSuccess: () => {
      setLoggedIn(true);
    },
    onError: () => {
      setLoggedIn(false);
    },
  });
  return { user: user as any, isLoading: isPending, isError };
};

export default useUser;

// useQuery
// Purpose: Fetching (reading) data from the server.
// Returns: Cached data, loading state, error state, and refetch function.
// When to use: Anytime you want to get data, like GET requests.
// Characteristics:
// Automatically caches the data.
// Supports stale/fresh logic (staleTime, cacheTime).
// Can refetch automatically on window focus or interval.

// useMutation
// Purpose: Sending or changing data on the server (creating, updating, deleting).
// Returns: Mutation function (mutate), loading state, error state, success callback.
// When to use: Anytime you want to change data, like POST, PUT, PATCH, DELETE requests.
// Characteristics:
// Doesn’t cache results automatically.
// You usually invalidate queries manually after mutation to update cache.
// Provides onSuccess, onError callbacks for side effects (like toast messages or redirects).
