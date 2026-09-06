
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '../../config/routes';
import { authService } from '../../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword({ Email: email });
      
      console.log('Sending payload:', { Email: email });
      setIsSubmitted(true);
    } catch (err) {
      setError('Failed to send reset email. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="text-gray-400 hover:text-gray-600 transition-colors mr-2"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Forgot Password</h2>
        </div>

        {!isSubmitted ? (
          <>
            <p className="text-gray-500 mb-6 text-sm">
              Enter your email address and we'll send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center shadow-md hover:shadow-lg"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Send Reset Instructions"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="flex justify-center text-green-500">
              <CheckCircle2 size={56} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Check your email</h3>
            <p className="text-gray-500 text-sm">
              We have sent password recovery instructions to <span className="font-semibold text-gray-700">{email}</span>.
            </p>
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-all"
            >
              Back to Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
}