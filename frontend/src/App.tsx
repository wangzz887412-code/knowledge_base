import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import DesktopPet from "./components/DesktopPet";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const AIChatPage = lazy(() => import("./pages/AIChatPage"));

function App() {
  return (
    <div className="min-h-screen bg-paper">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#10A37F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 font-serif">加载中...</p>
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookmarks"
            element={
              <ProtectedRoute>
                <BookmarksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-chat"
            element={
              <ProtectedRoute>
                <AIChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <HelpPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      <DesktopPet />
    </div>
  );
}

export default App;
