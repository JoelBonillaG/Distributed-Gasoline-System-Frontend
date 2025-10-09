import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import Playground from "@/pages/admin/Playground";
import AppToaster from "@/inc/ui/Toaster.jsx";
import NotFound from "@/pages/NotFound.jsx";
import Login from "@/pages/auth/Login";
import ErrorBoundary from "@/utils/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/utils/ProtectedRoute";
import PasswordRecovery from "@/pages/auth/PasswordRecovery";
import ResetPassword from "@/pages/auth/ResetPassword";
import MedicalCentersPage from "@/pages/admin/MedicalCentersPage.jsx";
import SpecialtiesPage from "@/pages/admin/SpecialtiesPage.jsx";
import DoctorsPage from "@/pages/admin/DoctorPage.jsx";
import PatientsPage from "./pages/patients/PatientsPage";
import EmployeesPage from "@/pages/employees/EmployeePage";
import MedicalConsultationFormPage from "./pages/consultations/MedicalConsultationFormPage";
import MedicalConsultationsPage from "./pages/consultations/MedicalConsultationsPage";
import Forbidden from "@/pages/Forbidden.jsx"; // <-- tu página 403
import { useAuth } from "@/hooks/use-auth";
import AuthLayout from "@/layouts/AuthLayout.jsx";
import SpecialtiesOfferPage from "@/pages/specialty/SpecialtiesOfferPage.jsx";
import ProfilePage from "@/pages/profile/ProfilePage";
import ReportsDashboard from "@/components/admin/ReportsDashboard.jsx";
import ReportsExport from "@/pages/admin/ReportsExport.jsx";

function RoleBasedHome() {
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((r) => String(r).toUpperCase())
    : [];

  console.log("🧱 User roles:", roles);
  if (roles.includes("ADMIN"))
    return <Navigate to="/admin/playground" replace />;
  return <Navigate to="/forbidden" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          {/* Auth (público) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/password-recovery" element={<PasswordRecovery />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/playground" element={<Playground />} />
            </Route>
          </Route>

          {/* Bloque protegido: requiere login */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/profile" element={<ProfilePage />} />
              {/* Index home según rol */}
              <Route index element={<RoleBasedHome />} />

              {/* --- ADMIN ONLY --- */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/admin/" element={<Playground />} />
              </Route>
            </Route>
          </Route>

          {/* 403 y 404 (públicos) */}
          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <AppToaster />
      </AuthProvider>
    </ErrorBoundary>
  );
}
