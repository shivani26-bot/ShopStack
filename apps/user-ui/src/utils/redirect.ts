let redirectToLogin = () => {
  // window.location.href → The full URL of the current page. https://shopstack.com/products?category=shoes
  window.location.href = "/login";
};

// This lets you replace the default behavior with a custom function.
// Example: instead of window.location.href = "/login", maybe in Next.js you want router.push("/login") (client-side navigation, faster, no full reload).
export const setRedirectHandler = (handler: () => void) => {
  redirectToLogin = handler;
};

export const runRedirectToLogin = () => {
  redirectToLogin();
};

// window.location.origin → The base URL (protocol + domain + port if any).https://shopstack.com
// window.location.pathname → The path part. /products
// window.location.search → The query string. ?category=shoes
// window.location.hash → The hash fragment (after #). #section1

// redirectToLogin is just a function that sends the user to /login.
// If you call redirectToLogin(), it performs a hard redirect (page reloads and moves to /login).

// It gives you a default behavior (window.location.href = "/login") that works everywhere.
// But also allows flexibility — in apps using React/Next.js Router, you can override it with router.push().
// This way, the rest of your code doesn’t care how the redirect happens — it just calls runRedirectToLogin().
