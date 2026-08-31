import {
  Suspense,
  lazy,
} from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { ProtectedRoute } from "./routes/ProtectedRoute";

const WelcomePage = lazy(() => import("./pages/WelcomePage.lazy"));
const AuthPage = lazy(() => import("./pages/AuthPage.lazy"));
const AdminHomePage = lazy(() => import("./pages/AdminHomePage.lazy"));
const SellerHomePage = lazy(() => import("./pages/SellerHomePage.lazy"));

export default function App() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-app-canvas p-6">
        <p className="font-inter text-sm text-text-mineral">
          Carregando...
        </p>
      </main>
    }>
      <Routes>
        <Route
          path="/"
          element={<WelcomePage />}
        />

        <Route
          path="/login"
          element={<AuthPage />}
        />

        <Route
          path="/register"
          element={<AuthPage />}
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller"
          element={
            <ProtectedRoute allowedRoles={["SELLER", "CUSTOMER"]}>
              <SellerHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    </Suspense>
  );
}