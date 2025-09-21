import type { AxiosRequestConfig } from "axios";

//AxiosRequestConfig is the default config type used by Axios when making requests.
// It includes things like:
// url?: string
// method?: "get" | "post" | ...
// headers?: Record<string, string>
// data?: any
// timeout?: number
// … and so on.
// By extending it, CustomAxiosRequestConfig keeps all those standard Axios options.

// requireauth?: boolean
// A custom property you added.
// It’s optional (? means optional).
// You can use it in your request interceptor to check:
// If requireauth: true → add an Authorization header with your access token.
// If not present → skip authentication.

// _retry?: boolean
// Another custom property you added.
// Typically used in Axios interceptors when handling token refresh logic:
// If a request fails with 401 Unauthorized, you refresh the token and retry the request.
// _retry flag prevents infinite loops by marking that the request has already been retried once.
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  requireAuth?: boolean;
  _retry?: boolean;
}
