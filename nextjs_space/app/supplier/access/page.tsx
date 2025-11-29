'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SupplierAccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');
  const [message, setMessage] = useState('Validating your access link...');

  useEffect(() => {
    const validateAndLogin = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid access link - no token provided');
        return;
      }

      try {
        // Call API to validate token and create/get supplier user
        const response = await fetch('/api/supplier/validate-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus('error');
          setMessage(data.error || 'Failed to validate access link');
          return;
        }

        // Token is valid, now sign in the user
        setMessage('Access validated! Logging you in...');

        const signInResult = await signIn('credentials', {
          email: data.email,
          password: data.temporaryPassword,
          redirect: false,
        });

        if (signInResult?.error) {
          setStatus('error');
          setMessage('Failed to authenticate. Please try again.');
          return;
        }

        // Success! Redirect to supplier portal
        setStatus('success');
        setMessage('Successfully authenticated! Redirecting to RFP...');
        
        setTimeout(() => {
          router.push(`/supplier/rfps/${data.rfpId}`);
        }, 1500);

      } catch (error) {
        console.error('Error validating token:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    validateAndLogin();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">Fyndr</h1>
          <p className="text-gray-600">Supplier Portal Access</p>
        </div>

        {/* Status Content */}
        <div className="text-center">
          {status === 'validating' && (
            <>
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Validating Access
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Access Granted!
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <h3 className="text-sm font-semibold text-red-900 mb-2">
                  Common Issues:
                </h3>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• The link may have expired (valid for 7 days)</li>
                  <li>• The link may have been used already</li>
                  <li>• The invitation may have been revoked</li>
                </ul>
                <p className="text-sm text-red-800 mt-3">
                  Please contact the buyer organization for a new invitation.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
