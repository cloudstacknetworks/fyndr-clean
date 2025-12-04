/**
 * STEP 53: User Management Component
 * Manage company users: invite, change role, deactivate
 */

'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);

  // ========================================
  // Fetch Users
  // ========================================
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/settings/users');
      const data = await response.json();

      if (data.success && data.users) {
        setUsers(data.users);
      } else {
        toast.error(data.error || 'Failed to load users.');
      }
    } catch (error) {
      console.error('[UserManagement] Fetch error:', error);
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // Invite User
  // ========================================
  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !inviteName.trim()) {
      toast.error('Please provide both email and name.');
      return;
    }

    try {
      setInviting(true);

      const response = await fetch('/api/dashboard/settings/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          role: 'buyer',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`User ${inviteName} invited successfully!`);
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteName('');
        fetchUsers(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to invite user.');
      }
    } catch (error) {
      console.error('[UserManagement] Invite error:', error);
      toast.error('Failed to invite user.');
    } finally {
      setInviting(false);
    }
  };

  // ========================================
  // Change User Role
  // ========================================
  const handleChangeRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'buyer' ? 'supplier' : 'buyer';

    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/settings/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`User role changed to ${newRole}.`);
        fetchUsers(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to change user role.');
      }
    } catch (error) {
      console.error('[UserManagement] Change role error:', error);
      toast.error('Failed to change user role.');
    }
  };

  // ========================================
  // Deactivate/Reactivate User
  // ========================================
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'reactivate';

    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/settings/users/${userId}/deactivate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`User ${action}d successfully.`);
        fetchUsers(); // Refresh the list
      } else {
        toast.error(data.error || `Failed to ${action} user.`);
      }
    } catch (error) {
      console.error('[UserManagement] Toggle status error:', error);
      toast.error(`Failed to ${action} user.`);
    }
  };

  // ========================================
  // Loading State
  // ========================================
  if (loading) {
    return (
      <div data-demo="settings-users" className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ========================================
  // Render
  // ========================================
  return (
    <div data-demo="settings-users" className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage team members, roles, and access.
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            + Invite User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No users found. Invite your first team member!
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.lastLoginAt
                      ? format(new Date(user.lastLoginAt), 'MMM dd, yyyy')
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleChangeRole(user.id, user.role)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Change Role
                    </button>
                    <button
                      onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                      className={`${
                        user.isActive
                          ? 'text-red-600 hover:text-red-900'
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {user.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Invite User</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john.doe@example.com"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteName('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteUser}
                disabled={inviting || !inviteEmail.trim() || !inviteName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {inviting ? 'Inviting...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
