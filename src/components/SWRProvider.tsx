import React from "react";
import { SWRConfig } from "swr";
import { swrConfig } from "../lib/swr-config";
import { useToast } from "../hooks/useToast";

interface SWRProviderProps {
  children: React.ReactNode;
}

export const SWRProvider: React.FC<SWRProviderProps> = ({ children }) => {
  const { showToast } = useToast();

  // Global error handler for SWR
  const handleError = (error: any, key: string) => {
    console.error("SWR Error:", error, "Key:", key);

    // Convert any error to a string message for display
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Show user-friendly error messages
    if (errorMessage.includes("Authentication expired")) {
      showToast("Your session has expired. Please log in again.", "error");
      // Handle logout/redirect to login
      window.location.href = "/login";
    } else if (
      errorMessage.includes("Network") ||
      errorMessage.includes("fetch")
    ) {
      showToast("Network error. Please check your connection.", "error");
    } else if (errorMessage.includes("403")) {
      showToast("You do not have permission to perform this action.", "error");
    } else if (errorMessage.includes("404")) {
      showToast("The requested resource was not found.", "error");
    } else if (errorMessage.includes("405")) {
      showToast("The requested method is not allowed for this endpoint.", "error");
    } else if (errorMessage.includes("500")) {
      showToast("Server error. Please try again later.", "error");
    } else if (errorMessage.includes("Method not allowed")) {
      showToast("The requested method is not allowed for this endpoint.", "error");
    } else {
      showToast(errorMessage || "An unexpected error occurred.", "error");
    }
  };

  // Enhanced SWR configuration with error handling
  const enhancedConfig = {
    ...swrConfig,
    onError: handleError,
    // Add loading indicator
    onLoadingSlow: (key: string) => {
      console.log("Loading slow for key:", key);
      showToast("Loading is taking longer than expected...", "warning");
    },
  };

  return <SWRConfig value={enhancedConfig}>{children}</SWRConfig>;
};
