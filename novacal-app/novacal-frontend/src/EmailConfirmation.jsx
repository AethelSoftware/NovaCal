import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';

export default function EmailConfirmation() {
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already confirmed
    const checkConfirmation = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        navigate('/dashboard');
      }
    };
    checkConfirmation();

    // Listen for auth state changes (for email confirmation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setIsVerifying(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleResendEmail = async () => {
    const email = localStorage.getItem('pending_email');
    if (email) {
      await supabase.auth.resend({
        type: 'signup',
        email: email
      });
      alert('Confirmation email resent! Please check your inbox.');
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black bg-gradient-to-br from-sky-900/50 via-slate-900/50 to-indigo-900/50">
        <div className="max-w-md w-full p-8 rounded-2xl shadow-lg bg-black border border-white/20 text-center">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-500 mx-auto"></div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
          <p className="text-gray-400">Redirecting you to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-gradient-to-br from-sky-900/50 via-slate-900/50 to-indigo-900/50">
      <div className="max-w-md w-full p-8 rounded-2xl shadow-lg bg-black border border-white/20">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-sky-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Check your email</h1>
          <p className="text-sm text-gray-400">
            We've sent a confirmation link to your email address.
          </p>
        </div>

        <div className="bg-sky-900/20 border border-sky-500/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300 mb-2">
            <strong>Next steps:</strong>
          </p>
          <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
            <li>Open your email inbox</li>
            <li>Click the confirmation link we sent you</li>
            <li>You'll be automatically redirected to your dashboard</li>
          </ol>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleResendEmail}
            className="w-full py-2 rounded-lg font-semibold text-white transition-all bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700"
          >
            Resend confirmation email
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-2 rounded-lg font-semibold text-gray-400 hover:text-white transition-all border border-white/10 hover:border-white/30"
          >
            Back to login
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Didn't receive the email? Check your spam folder or click resend.
        </p>
      </div>
    </div>
  );
}
