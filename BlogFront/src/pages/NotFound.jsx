
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { ROUTES } from '../config/routes';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-50 p-4 rounded-full text-red-500">
            <AlertCircle size={48} />
          </div>
        </div>

        <h1 className="text-6xl font-extrabold text-gray-800 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-gray-700 mb-3">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <Link
          to={ROUTES.HOME}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Home size={20} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}