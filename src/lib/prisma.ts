import { userProfileApi } from "./api";

// Client-side database operations using API calls
// This ensures Prisma is never imported in browser environment

export const createUserProfile = async (neonUser: any, formData?: { name?: string; company?: string; title?: string }) => {
  console.log("Creating profile for neon user via API:", neonUser, "with form data:", formData);

  try {
    // Add form data to the neonUser object before sending to API
    const userWithFormData = {
      ...neonUser,
      formData: formData || {}
    };
    return await userProfileApi.create(userWithFormData);
  } catch (error: any) {
    console.error("API error creating user profile:", error);
    throw error;
  }
};

export const getUserProfile = async (neonId: string) => {
  console.log("Getting user profile via API for neonId:", neonId);

  try {
    return await userProfileApi.get(neonId);
  } catch (error: any) {
    console.error("API error getting user profile:", error);
    // Return null if user not found (404) or other errors
    if (
      error.message?.includes("not found") ||
      error.message?.includes("404")
    ) {
      return null;
    }
    throw error;
  }
};

export const updateUserProfile = async (neonId: string, updates: any) => {
  console.log(
    "Updating user profile via API for neonId:",
    neonId,
    "with updates:",
    updates,
  );

  // For now, we don't have a general update API, but we could add it if needed
  console.warn("updateUserProfile not implemented via API yet");
  throw new Error("Profile updates not implemented via API yet");
};

export const updateLastLogin = async (neonId: string) => {
  console.log("Updating last login via API for neonId:", neonId);

  try {
    return await userProfileApi.updateLastLogin(neonId);
  } catch (error: any) {
    console.error("API error updating last login:", error);
    // Don't fail the entire operation if last login update fails
    console.warn("Failed to update last login (non-critical):", error);
    return null;
  }
};

export const confirmUserEmail = async (neonId: string) => {
  console.log("Confirming email via API for neonId:", neonId);

  try {
    return await userProfileApi.confirmEmail(neonId);
  } catch (error: any) {
    console.error("API error confirming email:", error);
    throw error;
  }
};
