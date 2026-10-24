
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ROUTES } from '../../config/routes';
import { authService } from '../../services/authService';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailFromUrl = searchParams.get('email') || '';
  const tokenFromUrl = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!emailFromUrl || !tokenFromUrl) {
      setError('Invalid or missing password reset link parameters.');
    }
  }, [emailFromUrl, tokenFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 2) {
      setError('Password must be at least 2 characters long.');
      return;
    }

    setLoading(true);

    const resetPasswordDto = {
      Email: emailFromUrl,
      Token: tokenFromUrl,
      NewPassword: newPassword,
    };

    try {
      await authService.resetPassword(resetPasswordDto);
      
      console.log('Reset Password Payload:', resetPasswordDto); 
      setSuccess(true);
      
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 3000);
    } catch (err) {
      setError('Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
          <p className="text-gray-500 text-sm mt-1">
            Please enter your new password below.
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                <AlertCircle size={20} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="New Password"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              disabled={loading || !emailFromUrl || !tokenFromUrl}
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center shadow-md hover:shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Reset Password"}
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="flex justify-center text-green-500">
              <CheckCircle2 size={56} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Password Reset Successful</h3>
            <p className="text-gray-500 text-sm">
              Your password has been successfully updated. You will be redirected to the login page shortly.
            </p>
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition-all"
            >
              Go to Login now
            </button>
          </div>
        )}

      </div>
    </div>
  );
}