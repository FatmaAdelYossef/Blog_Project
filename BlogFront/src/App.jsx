import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/AuthGuard';
import { ROUTES } from './config/routes';
import Login from './pages/login/Login';
import Dashboard from './pages/dashboard/Dashboard';
import NotFound from './pages/NotFound';
import ChangePassword from './pages/changePassword/ChangePassword';
import ForgotPassword from './pages/forgetPassword/ForgotPassword';
import ResetPassword from './pages/resetPassword/ResetPassword';
import PostsPage from './pages/posts/PostsPage';
import PostDetailsPage from './pages/posts/PostDetailsPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import CategoriesPage from './pages/category/CategoriesPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public Auth Routes */}
        <Route element={<AuthGuard isPublicOnly={true} />}>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
        </Route>

        {/* 2. All Main Routes are now Publicly Accessible inside DashboardLayout */}
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.HOME} element={<Dashboard />} />
          <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePassword />} />
          <Route path={ROUTES.POSTS} element={<PostsPage />} />
          <Route path="/posts/:id" element={<PostDetailsPage />} />
          <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
        </Route>

        {/* 3. Wildcard Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;