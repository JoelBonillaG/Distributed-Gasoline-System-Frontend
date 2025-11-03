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
import VehiclesPage from "@/pages/vehicles/VehiclesPage.jsx";
import CreateVehicleModelPage from "@/pages/vehicles/CreateVehicleModelPage.jsx";
import EditVehicleModelPage from "@/pages/vehicles/EditVehicleModelPage.jsx";
import VehicleUnitsPage from "@/pages/vehicles/VehicleUnitsPage.jsx";
import UsersPage from "./pages/users/UsersPage";
import DriversPage from "./pages/drivers/DriversPage";
import LicenseTypesPage from "./pages/license-types";
import RoutesPage from "./pages/routes/RoutesPage";
import FormRoutePage from "./pages/routes/FormRoutePage";
import TripsPage from "./pages/trips/TripsPage";
import FormCreateTripPage from "./pages/trips/FormCreateTripPage";
import TripDetailPage from "./pages/trips/TripDetailPage";

function RoleBasedHome() {
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((r) => String(r).toUpperCase())
    : [];

  console.log("🧱 User roles:", roles);
  // Redirigir a trips para todos los roles (ADMIN, SUPERVISOR, DRIVER)
  return <Navigate to="/trips" replace />;
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
              {/* Rutas de vehículos - modelos */}
              <Route path="/vehicles/models" element={<VehiclesPage />} />
              <Route path="/vehicles/models/create" element={<CreateVehicleModelPage />} />
              <Route path="/vehicles/models/edit/:id" element={<EditVehicleModelPage />} />

              {/* Ruta para unidades de vehículos */}
              <Route path="/vehicles/units" element={<VehicleUnitsPage />} />

              {/* Redirección de /vehicles a /vehicles/models */}
              <Route path="/vehicles" element={<Navigate to="/vehicles/models" replace />} />

              <Route path="/profile" element={<ProfilePage />} />
              {/* Index home según rol */}
              <Route index element={<RoleBasedHome />} />

              {/* --- TRIPS: Available to all authenticated users --- */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "DRIVER"]} />}>
                <Route path="/trips" element={<TripsPage />} />
                <Route path="/trips/create" element={<FormCreateTripPage />} />
                <Route path="/trips/view/:id" element={<TripDetailPage />} />
                <Route path="/trips/:id" element={<TripDetailPage />} />
              </Route>

              {/* --- ADMIN ONLY --- */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/admin/" element={<Playground />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/drivers" element={<DriversPage />} />
                <Route path="/license-types" element={<LicenseTypesPage />} />
                <Route path="/routes" element={<RoutesPage />} />
                <Route path="/routes/create" element={<FormRoutePage />} />
                <Route path="/routes/edit/:id" element={<FormRoutePage />} />
                <Route path="/routes/view/:id" element={<FormRoutePage />} />
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
