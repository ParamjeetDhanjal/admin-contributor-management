/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Management from './pages/Management';
import Tasks from './pages/Tasks';
import WriterProfile from './pages/WriterProfile';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/*"
          element={
            <AuthGuard>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/management" element={<Management />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/writers/:id" element={<WriterProfile />} />
                </Routes>
              </Layout>
            </AuthGuard>
          }
        />
      </Routes>
      <Toaster position="top-right" />
    </Router>
  );
}

