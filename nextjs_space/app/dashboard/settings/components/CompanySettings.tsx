/**
 * STEP 53: Company Settings Component
 * Form for editing company settings (logo, brand color, timezone, fiscal year)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CompanyData {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  brandColor: string | null;
  timezone: string | null;
  fiscalYearStartMonth: number | null;
  createdAt: string;
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'UTC',
];

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function CompanySettings() {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [brandColor, setBrandColor] = useState('#3B82F6');
  const [timezone, setTimezone] = useState('America/New_York');
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState<number | null>(null);

  // ========================================
  // Fetch Company Settings
  // ========================================
  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/settings/company');
      const data = await response.json();

      if (data.success && data.company) {
        const companyData = data.company;
        setCompany(companyData);
        setName(companyData.name || '');
        setDescription(companyData.description || '');
        setLogo(companyData.logo || '');
        setBrandColor(companyData.brandColor || '#3B82F6');
        setTimezone(companyData.timezone || 'America/New_York');
        setFiscalYearStartMonth(companyData.fiscalYearStartMonth);
      } else {
        toast.error(data.error || 'Failed to load company settings.');
      }
    } catch (error) {
      console.error('[CompanySettings] Fetch error:', error);
      toast.error('Failed to load company settings.');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // Save Company Settings
  // ========================================
  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/dashboard/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          logo,
          brandColor,
          timezone,
          fiscalYearStartMonth,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Company settings updated successfully!');
        setCompany(data.company);
      } else {
        toast.error(data.error || 'Failed to update company settings.');
      }
    } catch (error) {
      console.error('[CompanySettings] Save error:', error);
      toast.error('Failed to update company settings.');
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // Loading State
  // ========================================
  if (loading) {
    return (
      <div data-demo="settings-company" className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ========================================
  // Render
  // ========================================
  return (
    <div data-demo="settings-company" className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Manage your company's profile, branding, and operational settings.
        </p>
      </div>

      <div className="space-y-4">
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Acme Corporation"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="A brief description of your company..."
          />
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logo URL
          </label>
          <input
            type="text"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://i.pinimg.com/736x/db/87/75/db87753a7685b0758792da046372c959.jpg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter a URL to your company logo image.
          </p>
        </div>

        {/* Brand Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brand Color
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#3B82F6"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Choose a color for branding across the platform.
          </p>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Used for displaying dates and times across the system.
          </p>
        </div>

        {/* Fiscal Year Start Month */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fiscal Year Start Month
          </label>
          <select
            value={fiscalYearStartMonth || ''}
            onChange={(e) => setFiscalYearStartMonth(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Not Set</option>
            {MONTHS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Used for fiscal year reporting and budget planning.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
