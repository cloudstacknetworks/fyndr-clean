'use client';

import { useState } from 'react';
import { User, Lock, Mail } from 'lucide-react';

type UserData = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
};

type Props = {
  user: UserData;
};

export default function SettingsClient({ user }: Props) {
  // Profile Update State
  const [profileData, setProfileData] = useState({
    name: user.name || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Profile Update Handler
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!profileData.name || profileData.name.trim() === '') {
      setProfileMessage({
        type: 'error',
        text: 'Name is required',
      });
      return;
    }

    setProfileLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: profileData.name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setProfileMessage({
          type: 'error',
          text: data.error || 'Failed to update profile',
        });
      } else {
        setProfileMessage({
          type: 'success',
          text: 'Profile updated successfully!',
        });
      }
    } catch (error) {
      setProfileMessage({
        type: 'error',
        text: 'An error occurred while updating profile',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Password Change Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    // Client-side validation
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordMessage({
        type: 'error',
        text: 'All fields are required',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: 'New password must be at least 6 characters',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'New password and confirm password do not match',
      });
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordMessage({
          type: 'error',
          text: data.error || 'Failed to update password',
        });
      } else {
        setPasswordMessage({
          type: 'success',
          text: 'Password updated successfully!',
        });
        // Clear password fields after successful update
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: 'An error occurred while updating password',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Account Information Section */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Account Information</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
            />
            <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              User ID
            </label>
            <input
              type="text"
              value={user.id}
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Update Profile Section */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Update Profile</h2>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1 block">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={profileData.name}
              onChange={(e) => setProfileData({ name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your name"
              disabled={profileLoading}
            />
          </div>

          {profileMessage && (
            <div
              className={`p-4 rounded-lg ${
                profileMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {profileMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={profileLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-blue-700 focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {profileLoading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="text-sm font-medium text-gray-700 mb-1 block"
            >
              Current Password *
            </label>
            <input
              type="password"
              id="currentPassword"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter current password"
              disabled={passwordLoading}
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="text-sm font-medium text-gray-700 mb-1 block"
            >
              New Password * (minimum 6 characters)
            </label>
            <input
              type="password"
              id="newPassword"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter new password"
              disabled={passwordLoading}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700 mb-1 block"
            >
              Confirm New Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Confirm new password"
              disabled={passwordLoading}
            />
          </div>

          {passwordMessage && (
            <div
              className={`p-4 rounded-lg ${
                passwordMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {passwordMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {passwordLoading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
