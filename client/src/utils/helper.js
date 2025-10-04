import { BACKEND_BASE_URL } from "./constant";

export const handleSignOut = async (navigate) => {
  try {
    await fetch(`${BACKEND_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    navigate("/login");
    console.log("Logout");
  } catch (error) {
    console.log("Error: ", error.message);
  }
};