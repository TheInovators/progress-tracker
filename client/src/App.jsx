import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Directory from './pages/Directory.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Contests from './pages/Contests.jsx';
import Workspace from './pages/Workspace.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <Spinner label="Restoring your session" />;
  if (!user) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Directory />} />
        <Route path="/students/:id" element={<Dashboard />} />
        <Route path="/me" element={<Navigate to={`/students/${user._id}`} replace />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/contests" element={<Contests />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
