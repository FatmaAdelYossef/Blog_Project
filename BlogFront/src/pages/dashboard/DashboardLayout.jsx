import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, LogOut, Key, User, ChevronDown, FileText, LogIn, Menu, X } from 'lucide-react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { jwtService } from '../../services/jwtService';
import { ROUTES } from '../../config/routes';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const dropdownRef = useRef(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !jwtService.isTokenExpired(token)) setIsAuthenticated(true);
    }, []);

    const handleLogout = async () => {
        await authService.logout();
        navigate(ROUTES.LOGIN);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            
            {/* Sidebar - يتم إخفاؤه تماماً من الـ DOM عندما يكون مغلقاً */}
            {isSidebarOpen && (
                <aside className="w-64 h-screen bg-white shadow-md p-6 flex flex-col sticky top-0 z-40 shrink-0">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-2">
                            <LayoutDashboard className="text-indigo-600" />
                            <h1 className="text-xl font-bold text-gray-800 whitespace-nowrap">My Blog</h1>
                        </div>
                        {/* زر الـ X لإغلاق الـ Sidebar */}
                        <button 
                            onClick={() => setIsSidebarOpen(false)} 
                            className="text-gray-500 hover:text-red-500 p-1 rounded-lg transition-colors"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    <nav className="space-y-4">
                        <Link to={ROUTES.HOME} className="flex items-center gap-3 text-indigo-600 font-medium bg-indigo-50 p-3 rounded-xl transition-colors">
                            <User size={20} /> Overview
                        </Link>
                        <Link to={ROUTES.POSTS} className="flex items-center gap-3 text-gray-600 hover:text-indigo-600 font-medium p-3 rounded-xl transition-colors">
                            <FileText size={20} /> Posts
                        </Link>
                        <Link to={ROUTES.CATEGORIES} className="flex items-center gap-3 text-gray-600 hover:text-indigo-600 font-medium p-3 rounded-xl transition-colors">
                            <FileText size={20} /> Categories
                        </Link>
                    </nav>
                </aside>
            )}

            {/* Main Wrapper - يأخذ باقي المساحة أو الشاشة كاملة عندما يختفي الـ Sidebar */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navbar */}
                <header className="bg-white shadow-sm h-16 px-6 flex items-center justify-between sticky top-0 z-30 w-full">
                    <div className="flex items-center gap-3">
                        {/* زر الـ Menu يظهر فقط عندما يكون الـ Sidebar مغلقاً */}
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="text-gray-600 hover:text-indigo-600 p-2 rounded-xl bg-gray-50 border border-gray-100 transition-colors"
                            >
                                <Menu size={20} />
                            </button>
                        )}
                        <h2 className="text-lg font-semibold text-gray-800">My Blog</h2>
                    </div>

                    {/* Account Section */}
                    <div className="relative" ref={dropdownRef}>
                        {isAuthenticated ? (
                            <>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl border border-gray-100 focus:outline-none"
                                >
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                        <User size={20} />
                                    </div>
                                    <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                                        <button onClick={() => navigate(ROUTES.CHANGE_PASSWORD)} className="w-full px-4 py-2.5 text-sm text-gray-600 flex items-center gap-2 hover:bg-indigo-50"><Key size={16} /> Change Password</button>
                                        <button onClick={handleLogout} className="w-full px-4 py-2.5 text-sm text-red-600 flex items-center gap-2 hover:bg-red-50"><LogOut size={16} /> Logout</button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <button onClick={() => navigate(ROUTES.LOGIN)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"><LogIn size={18} /> Login</button>
                        )}
                    </div>
                </header>

                <main className="flex-1 p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}