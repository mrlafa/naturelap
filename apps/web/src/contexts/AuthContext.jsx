import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(pb.authStore.model);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize state from authStore on mount
    setCurrentUser(pb.authStore.model);
    setLoading(false);

    // Listen for authStore changes (e.g., from other tabs or automatic token refresh)
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
    setCurrentUser(authData.record);
    return authData;
  };

  const loginWithGoogle = async () => {
    const authData = await pb.collection('users').authWithOAuth2({
      provider: 'google',
      createData: {
        role: 'user',
        email_notifications: true,
        push_notifications: false,
      },
    });
    setCurrentUser(authData.record);
    return authData;
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
  };

  const signup = async (data) => {
    const record = await pb.collection('users').create({
      ...data,
      role: 'user',
      email_notifications: true,
      push_notifications: false,
    }, { $autoCancel: false });
    
    await login(data.email, data.password);
    return record;
  };

  const refreshUser = async () => {
    if (!pb.authStore.isValid) return null;
    const authData = await pb.collection('users').authRefresh({ $autoCancel: false });
    setCurrentUser(authData.record);
    return authData.record;
  };

  const updateProfile = async (data) => {
    if (!currentUser?.id) throw new Error('You must be logged in to update your profile');
    const record = await pb.collection('users').update(currentUser.id, data, { $autoCancel: false });
    pb.authStore.save(pb.authStore.token, record);
    setCurrentUser(record);
    return record;
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    isStaff: currentUser?.role === 'staff' || currentUser?.role === 'admin',
    login,
    loginWithGoogle,
    logout,
    signup,
    refreshUser,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
