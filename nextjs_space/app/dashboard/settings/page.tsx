/**
 * STEP 53: Admin Settings Page (Buyer & Company Settings Panel)
 * Main page with tabbed navigation for settings sections
 */

'use client';

import React, { useState } from 'react';
import CompanySettings from './components/CompanySettings';
import UserManagement from './components/UserManagement';
import PreferencesSettings from './components/PreferencesSettings';
import { Building2, Users, Settings } from 'lucide-react';

type TabType = 'company' | 'users' | 'preferences';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('company');

  const tabs = [
    {
      id: 'company' as TabType,
      label: 'Company Settings',
      icon: Building2,
      description: 'Company profile and branding',
    },
    {
      id: 'users' as TabType,
      label: 'User Management',
      icon: Users,
      description: 'Team members and access',
    },
    {
      id: 'preferences' as TabType,
      label: 'Preferences & Defaults',
      icon: Settings,
      description: 'Your personal settings',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your company, team, and personal preferences.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors
                      ${
                        isActive
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    <div className="text-left">
                      <div>{tab.label}</div>
                      <div className="text-xs text-gray-500 font-normal">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-opacity duration-200">
          {activeTab === 'company' && <CompanySettings />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'preferences' && <PreferencesSettings />}
        </div>
      </div>
    </div>
  );
}
