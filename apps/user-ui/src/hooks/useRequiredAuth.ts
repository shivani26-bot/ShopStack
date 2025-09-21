import { useRouter } from "next/navigation";
import useUser from "./useUser";
import { useEffect } from "react";

// makes sure that only authenticated users can access a page.
// If the user is not logged in, it redirects them to /login.
// If the user is logged in, it allows the page to render
const useRequireAuth = () => {
  const router = useRouter();
  const { user, isLoading } = useUser();
  //   useUser → (your custom hook) probably fetches the current user info and login state.

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  return { user, isLoading };
};

export default useRequireAuth;
