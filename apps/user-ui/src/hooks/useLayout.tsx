import React from "react";
import axiosInstance from "../utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";

// for layout data fetching

// fetch layout data from api
const fetchLayout = async () => {
  const response = await axiosInstance.get("/api/get-layouts");
  return response.data.layout;
};
const useLayout = () => {
  const {
    data: layout,
    isPending: isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["layout"],
    queryFn: fetchLayout,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
  return {
    layout,
    isLoading,
    isError,
    refetch,
  };
};

export default useLayout;
