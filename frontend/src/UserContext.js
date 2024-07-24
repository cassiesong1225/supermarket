import React, { createContext, useState, useContext } from "react";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    userId: null,
    userName: "",
    detectedMood: "",
    isLoggedIn: false
  });

  const login = (userId, userName, detectedMood) => {
    setUser({ userId, userName, detectedMood, isLoggedIn: true });
  };

  const logout = () => {
    setUser({
      userId: null,
      userName: "",
      detectedMood: "",
      isLoggedIn: false,
    });
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};
