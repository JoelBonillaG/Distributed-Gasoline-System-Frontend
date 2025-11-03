import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import AppToaster from "@/inc/ui/Toaster.jsx";
import Dashboard from "@/pages/admin/reports/Dashboard";
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
import VehiclesPage from "@/pages/vehicles/VehiclesPage.jsx";
import CreateVehicleModelPage from "@/pages/vehicles/CreateVehicleModelPage.jsx";
import EditVehicleModelPage from "@/pages/vehicles/EditVehicleModelPage.jsx";
import VehicleUnitsPage from "@/pages/vehicles/VehicleUnitsPage.jsx";
import LightVehiclesPage from "@/pages/vehicles/LightVehiclesPage.jsx";
import LightVehicleUnitsPage from "@/pages/vehicles/LightVehicleUnitsPage.jsx";
import HeavyVehiclesPage from "@/pages/vehicles/HeavyVehiclesPage.jsx";
import HeavyVehicleUnitsPage from "@/pages/vehicles/HeavyVehicleUnitsPage.jsx";
import UsersPage from "./pages/users/UsersPage";
import DriversPage from "./pages/drivers/DriversPage";
import LicenseTypesPage from "./pages/license-types";
import VehicleDetailsPage from "./pages/admin/reports/VehicleDetailsPage";

function RoleBasedHome() {
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((r) => String(r).toUpperCase())
    : [];

  console.log("🧱 User roles:", roles);
  if (roles.includes("ADMIN")) return <Navigate to="/dashboard" replace />;
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
          </Route>

          {/* Bloque protegido: requiere login */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              {/* Rutas de vehículos livianos */}
              <Route
                path="/vehicles/light/models"
                element={<LightVehiclesPage />}
              />
              <Route
                path="/vehicles/light/units"
                element={<LightVehicleUnitsPage />}
              />

              {/* Rutas de vehículos pesados */}
              <Route
                path="/vehicles/heavy/models"
                element={<HeavyVehiclesPage />}
              />
              <Route
                path="/vehicles/heavy/units"
                element={<HeavyVehicleUnitsPage />}
              />

              {/* Rutas antiguas de vehículos - mantenidas para compatibilidad */}
              <Route path="/vehicles/models" element={<VehiclesPage />} />
              <Route
                path="/vehicles/models/create"
                element={<CreateVehicleModelPage />}
              />
              <Route
                path="/vehicles/models/edit/:id"
                element={<EditVehicleModelPage />}
              />
              <Route path="/vehicles/units" element={<VehicleUnitsPage />} />

              {/* Redirección de /vehicles a vehículos livianos */}
              <Route
                path="/vehicles"
                element={<Navigate to="/vehicles/light/models" replace />}
              />

              <Route path="/profile" element={<ProfilePage />} />
              {/* Index home según rol */}
              <Route index element={<RoleBasedHome />} />

              {/* --- ADMIN ONLY --- */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/dashboard/vehicle-details"
                  element={<VehicleDetailsPage />}
                />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/drivers" element={<DriversPage />} />
                <Route path="/license-types" element={<LicenseTypesPage />} />
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
