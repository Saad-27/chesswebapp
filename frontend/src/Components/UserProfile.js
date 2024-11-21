import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from './config';
import { useNavigate } from 'react-router-dom';
import { Mail, Award, LogOut, PenLine, User } from 'lucide-react';
import './css/UserProfile.css';

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          setIsLoggedIn(true);
          const userDocRef = doc(db, 'users', currentUser.email);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <PenLine className="header-icon" />
          <h1>User Profile</h1>
        </div>
        {isLoggedIn ? (
          <>
            <div className="profile-section">
              <div className="section-header">
                <User className="section-icon" />
                <h2>Username</h2>
              </div>
              <p className="section-content">{userData?.username || 'No username set'}</p>
            </div>
            <div className="profile-section">
              <div className="section-header">
                <Mail className="section-icon" />
                <h2>Email</h2>
              </div>
              <p className="section-content">{userData?.email}</p>
            </div>
            <div className="profile-section">
              <div className="section-header">
                <Award className="section-icon" />
                <h2>Points</h2>
              </div>
              <p className="section-content points">{userData?.points || 0}</p>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              <LogOut className="logout-icon" />
              Logout
            </button>
          </>
        ) : (
          <p className="not-logged-in">You are not logged in.</p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;