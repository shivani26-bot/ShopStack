import axios from "axios";

//creates a custom axios instance with pre-configured defaults.
// Using an instance is useful because you can set things like base URLs, headers, timeouts, etc. once, instead of specifying them every time you make a request.
// axiosInstance.get("/user");
// actually makes request to:
// <process.env.NEXT_PUBLIC_SERVER_URI>/user

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URI, //default URL prefix for all requests made through this Axios instance.
  withCredentials: true, //tells Axios to send cookies and authentication headers along with requests, even for cross-origin requests.
});

// isRefreshing → ensures only one refresh token request is active at a time.
// refreshSubscribers → queues pending requests while waiting for a new token.
// Example scenario:
// User has 5 API calls sent almost at the same time.
// Access token has expired.
// Without this flag, all 5 requests would trigger 5 refresh token calls.
// With isRefreshing, only one refresh request is sent, and the other requests wait.
let isRefreshing = false; //tracks whether a refresh token request is currently in progress.
// array of callback functions.
// queue up API calls that failed due to an expired token, so they can retry automatically after a new access token is obtained.
// First request sees the token expired → triggers refresh token request.
// Other requests that also fail while refresh is ongoing → don’t call refresh again. Instead, they subscribe their retry logic to refreshSubscribers.
// When the refresh succeeds:All pending API calls are retried with the new access token.
let refreshSubscribers: (() => void)[] = [];

//handle logout and prevent infinite loops
const handleLogout = () => {
  // gives the current path of the page in the browser.
  //   If you’re on https://example.com/dashboard, window.location.pathname → "/dashboard"
  // If you’re on https://example.com/login, it → "/login"
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
    //     changes the browser’s URL to "/login".
    // This forces a page reload and navigates the user to the login page.
  }
};

// handle adding a new access token to queued requests
// callback is the name of the parameter.
// Its TypeScript type is () => void: () → the function takes no arguments.
// void → the function doesn’t return anything.
const subscribeTokenRefresh = (callback: () => void) => {
  //     Adds a callback function to the refreshSubscribers array.
  // This callback is basically a retry function for an API request that failed due to an expired access token.
  // Suppose multiple API requests happen at the same time, and the access token has expired:
  // The first request triggers a refresh token request.
  // The other requests don’t trigger another refresh; instead, they subscribe their retry logic here.
  // Once the refresh succeeds, all these queued callbacks will be executed to retry the pending requests.
  refreshSubscribers.push(callback);
};

//execute queued requests after refresh
const onRefreshSuccess = () => {
  //     Iterates over all the queued callbacks in refreshSubscribers and calls them.
  // These callbacks are usually API calls that were waiting for a new access token.
  // After executing, it clears the array (refreshSubscribers = []) to prevent duplicate executions.
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
};

//handle api requests
// Axios allows you to intercept requests before they are sent to the server.
// Interceptors let you modify the request, add headers, or handle errors globally.
// axios.interceptors.request.use(onSuccess, onError);
// onSuccess → function that runs before the request is sent.
// onError → function that runs if there’s an error in setting up the request.
// (config)=>config
// This is the success handler for the request.
// config is the Axios request configuration object. Example properties:
// url → /profile
// method → GET
// headers → { Authorization: "Bearer ..." }
// Returning config as-is means you’re not modifying the request.
// we can modify config if we want like this:
// (config) => {
//     const token = getAccessToken();
//     if (token) config.headers["Authorization"] = `Bearer ${token}`;
//     return config;
//   },
// (error)=>Promise.reject(error)
// error handler for the request.
// If something goes wrong before the request is sent, the error is propagated using Promise.reject(error) so that your .catch() handlers can handle it.

axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);
// handle expired tokens and refresh logic behind the scene
// This pattern ensures users don’t get logged out immediately when their access token expires — it refreshes in the background.
axiosInstance.interceptors.response.use(
  (response) => response, // pass through successful responses,First argument: success handler → just returns the response.
  async (error) => {
    //Second argument: error handler → intercepts failed requests (like 401 Unauthorized).
    //handles the failed response
    // Every Axios request has a config object. We save it so we can retry the request later after refreshing the token.
    const originalRequest = error.config;
    //prevent infinite retry loop
    // Only trigger refresh if:
    // Server responded 401 Unauthorized (token expired).
    // This request hasn’t already retried (_retry is a custom flag to prevent infinite loops).
    if (error.response?.status === 401 && !originalRequest._retry) {
      // isRefreshing → boolean that tracks if a token refresh request is already in progress.
      // If yes:
      // Don’t start a new refresh.
      // Subscribe this request to wait for the new token (subscribeTokenRefresh).
      // Once token refresh succeeds, retry the original request.
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => resolve(axiosInstance(originalRequest)));
        });
      }
      //  Marks this request so it won’t trigger another refresh loop.
      // Sets isRefreshing = true to block other requests from refreshing at the same time
      //       Without it:
      // Suppose token refresh fails or the retried request also gets 401 → the interceptor could trigger another refresh, then another retry… infinitely.
      // By setting _retry = true, you ensure each request only triggers refresh once.
      //       JavaScript objects are mutable.
      // Axios passes the same config object through interceptors.
      // So you can safely add _retry and check it later.
      originalRequest._retry = true; // now we know this request has been retried once,prevent infinite loops.
      isRefreshing = true;
      try {
        //         Makes a POST request to /refresh-token to get a new access token.
        // If it succeeds:
        // isRefreshing = false → refresh complete.
        // onRefreshSuccess() → notify any queued requests to retry.
        // Retry the original request: axiosInstance(originalRequest).
        await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_URI}/api/refresh-token`,
          {},
          { withCredentials: true }
        );
        isRefreshing = false;
        onRefreshSuccess();
        return axiosInstance(originalRequest);
      } catch (error) {
        //         If it fails:
        // Clear refreshSubscribers (queued requests).
        // Call handleLogout() → log user out (because refresh failed).
        // Reject the promise so the error propagates.
        isRefreshing = false;
        refreshSubscribers = [];
        handleLogout();
        return Promise.reject(error);
      }
    }
    // If the error is not 401 or already retried → just reject it normally.
    return Promise.reject(error);
  }
);

export default axiosInstance;
