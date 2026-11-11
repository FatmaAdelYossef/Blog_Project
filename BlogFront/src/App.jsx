import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { LanguageProvider } from './i18n';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { AuthGuard } from './components/AuthGuard';
import { Spinner } from './components/ui';
import { ROUTES } from './config/routes';
import Login from './pages/login/Login';
import HomePage from './pages/home/HomePage';
import NotFound from './pages/NotFound';
import ChangePassword from './pages/changePassword/ChangePassword';
import ForgotPassword from './pages/forgetPassword/ForgotPassword';
import ResetPassword from './pages/resetPassword/ResetPassword';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import CustomizePage from './pages/dashboard/CustomizePage';
import PublicLayout from './components/layout/PublicLayout';
import CategoriesPage from './pages/category/CategoriesPage';

// The post routes pull in the Quill editor; load them on demand so the shell
// and the read-only overview stay light.
const PostsPage = lazy(() => import('./pages/posts/PostsPage'));
const PostDetailsPage = lazy(() => import('./pages/posts/PostDetailsPage'));

function PageFallback() {
  return (
    <div aria-busy="true" className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" label="Loading page…" />
    </div>
  );
}

function LazyPage({ children }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

// Guests read the blog through the public top-nav shell; signed-in members
// get the workspace sidebar. Both layouts render <Outlet/>, so the route
// tree below stays identical either way.
function SiteShell() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <DashboardLayout /> : <PublicLayout />;
}

function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider does not use router hooks; it sits inside BrowserRouter so
          every route shares one auth state and future router-aware auth code
          can be added without moving the provider. */}
      <ThemeProvider>
        <LanguageProvider>
        <AuthProvider>
          <SiteSettingsProvider>
          <ScrollToTop />
          <Routes>
            {/* 1. Public Auth Routes */}
            <Route element={<AuthGuard isPublicOnly={true} />}>
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
              <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
            </Route>

            {/* 2. Main routes sit inside SiteShell, which picks the public or
                workspace layout from auth state. Change password is nested
                under AuthGuard because it needs a session. */}
            <Route element={<SiteShell />}>
              <Route path={ROUTES.HOME} element={<HomePage />} />
              <Route element={<AuthGuard />}>
                <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePassword />} />
                <Route path={ROUTES.CUSTOMIZE} element={<CustomizePage />} />
              </Route>
              <Route
                path={ROUTES.POSTS}
                element={
                  <LazyPage>
                    <PostsPage />
                  </LazyPage>
                }
              />
              <Route
                path="/posts/:id"
                element={
                  <LazyPage>
                    <PostDetailsPage />
                  </LazyPage>
                }
              />
              <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
            </Route>

            {/* 3. Wildcard Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SiteSettingsProvider>
        </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
