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

const AuthPage = lazy(() => import("./pages/AuthPage.lazy"));
const AdminHomePage = lazy(() => import("./pages/AdminHomePage.lazy"));
const CustomerHomePage = lazy(() => import("./pages/CustomerHomePage.lazy"));
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
          element={
            <Navigate
              to="/login"
              replace
            />
          }
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
            <ProtectedRoute allowedRoles={["SELLER"]}>
              <SellerHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerHomePage />
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