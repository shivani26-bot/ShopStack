import { useRouter } from "next/navigation";

import { useEffect } from "react";
import useSeller from "./useSeller";

// makes sure that only authenticated users can access a page.
// If the user is not logged in, it redirects them to /login.
// If the user is logged in, it allows the page to render
const useRequireAuth = () => {
  const router = useRouter();
  const { seller, isLoading } = useSeller();
  //   useUser → (your custom hook) probably fetches the current user info and login state.

  useEffect(() => {
    if (!isLoading && !seller) {
      router.replace("/login");
    }
  }, [seller, isLoading, router]);

  return { seller, isLoading };
};

export default useRequireAuth;
