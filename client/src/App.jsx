import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import SavingsPage from "./pages/SavingsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";


function ComingSoon({ page }) {
  return (
    <div className="flex items-center justify-center h-full min-h-96">
      <div className="text-center">
        <p className="text-4xl mb-4">🚧</p>
        <h1 className="text-xl font-semibold text-gray-800 mb-1">{page}</h1>
        <p className="text-sm text-gray-400">This page is coming soon</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute>
              <Layout>
                <TransactionsPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/savings" element={
            <ProtectedRoute>
              <Layout>
                <SavingsPage />
              </Layout>
           </ProtectedRoute>
          } />
          <Route path="/about" element={
            <ProtectedRoute>
              <Layout>
                <AboutPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/contact" element={
            <ProtectedRoute>
              <Layout>
                <ContactPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}