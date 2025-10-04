import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BACKEND_BASE_URL } from "../utils/constant";
import { setUser, clearUser } from "../utils/userSlice";

export const useAuth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_BASE_URL}/user/me`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            dispatch(setUser(data.data));
          } else {
            dispatch(clearUser());
          }
        } else {
          dispatch(clearUser());
        }
      } catch (error) {
        console.log("Auth check failed:", error.message);
        dispatch(clearUser());
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [dispatch]);

  const handleSignOut = async () => {
    try {
      await fetch(`${BACKEND_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
      dispatch(clearUser());
      navigate("/login");
      console.log("Logout");
    } catch (error) {
      console.log("Error: ", error.message);
    }
  };

  return { 
    user, 
    isLoading, 
    handleSignOut, 
    isAuthenticated: !!user 
  };
};