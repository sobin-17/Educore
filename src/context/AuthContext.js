import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and set user
      // This would typically be an API call
      setUser({ id: 1, name: 'John Doe', role: 'student' });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // API call for login
    const user = { id: 1, name: 'John Doe', email, role: 'student' };
    setUser(user);
    localStorage.setItem('token', 'fake-token');
    return user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};