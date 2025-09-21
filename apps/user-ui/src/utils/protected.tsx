// when we use useUser it must need to be protected

import { CustomAxiosRequestConfig } from "./axiosInstance.types";

export const isProtected: CustomAxiosRequestConfig = {
  requireAuth: true,
};
