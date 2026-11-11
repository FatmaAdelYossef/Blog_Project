import { useAuth } from '../../context/AuthContext';
import Dashboard from '../dashboard/Dashboard';
import PublicHome from './PublicHome';

/**
 * `/` shows the workspace overview to signed-in members and the public
 * landing page to guests. The surrounding shell (SiteShell in App.jsx)
 * switches layouts on the same auth state, so both stay in sync.
 */
export default function HomePage() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <PublicHome />;
}
