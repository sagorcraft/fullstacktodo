import { createContext, useContext, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_URL = "http://localhost:5000";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const user = localStorage.getItem("doable_user");
    return user ? JSON.parse(user) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("doable_token") || null;
  });

  // Registration
  const register = async ({ fullname, email, password, confirmPassword }) => {
    try {
      const response = await axios.post(`${API_URL}/registration`, {
        fullname,
        email,
        password,
        confirmPassword,
      });

      return {
        ok: true,
        data: response.data,
      };
    } catch (error) {
      return {
        ok: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  // Login
  const login = async ({ email, password }) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        return {
          ok: false,
          error: "Invalid server response",
        };
      }

      // Save login session
      localStorage.setItem("doable_token", token);
      localStorage.setItem("doable_user", JSON.stringify(user));

      setToken(token);
      setCurrentUser(user);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error:
          error.response?.data?.message || "Email or password is incorrect",
      };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("doable_token");
    localStorage.removeItem("doable_user");

    setToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        register,
        login,
        logout,
        isAuthenticated: !!token && !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
