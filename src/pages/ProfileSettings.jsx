import React, { useState, useEffect } from 'react';
import { fetchUserProfile } from '../api'; 

const ProfileSettings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const profileData = await fetchUserProfile();
        setUser(profileData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    getUserProfile();
  }, []);

  // ---- FIX STARTS HERE ----
  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Check if user exists before rendering the main content
  if (!user) {
    return <div>No user data found.</div>;
  }

  return (
    <div>
      <h1>Hello, {user.name}</h1>
      {/* Your form fields */}
      <input type="text" value={user.name} />
      <input type="text" value={user.email} />
      {/* etc. */}
    </div>
  );
};

export default ProfileSettings;