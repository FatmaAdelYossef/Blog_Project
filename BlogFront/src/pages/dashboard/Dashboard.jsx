import React from 'react';

export default function Dashboard() {
    return (
        <div>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Welcome Back!</h2>
                <p className="text-gray-500">Here is an overview of your account activity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 mb-2">Total Activity</h3>
                    <p className="text-3xl font-bold text-indigo-600">12</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 mb-2">Pending Tasks</h3>
                    <p className="text-3xl font-bold text-orange-500">3</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 mb-2">Completed</h3>
                    <p className="text-3xl font-bold text-green-500">9</p>
                </div>
            </div>
        </div>
    );
}