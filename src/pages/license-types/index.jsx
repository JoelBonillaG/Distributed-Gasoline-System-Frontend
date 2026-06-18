import { useState, useEffect, useMemo } from "react";
import { 
  Shield, 
  FileText, 
  Users,
  CheckCircle,
  Eye,
  Calendar,
  Award
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { PageHeading } from "@/components/ui/typography/Heading";
import { licenseTypesService } from "@/services/license-types.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";

/**
 * Página principal de gestión de tipos de licencias
 */
const LicenseTypesPage = () => {
  // ========== STATE ==========
  const [licenseTypes, setLicenseTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLicenseType, setSelectedLicenseType] = useState(null);
  
  // Modal states
  const [isViewOpen, setIsViewOpen] = useState(false);

  // ========== LOAD DATA ==========
  useEffect(() => {
    loadLicenseTypes();
  }, []);

  const loadLicenseTypes = async () => {
    setIsLoading(true);
    try {
      const data = await licenseTypesService.findAll();
      // La API devuelve { items: [...] } en lugar de un array directo
      const types = Array.isArray(data) ? data : (data.items || []);
      // Ordenar alfabéticamente por código (A, B, C, D, E...)
      const sortedTypes = types.sort((a, b) => {
        const codeA = (a.code || '').toUpperCase();
        const codeB = (b.code || '').toUpperCase();
        return codeA.localeCompare(codeB);
      });
      setLicenseTypes(sortedTypes);
    } catch (error) {
      console.error("Error loading license types:", error);
      toast.error("Error al cargar tipos de licencia");
    } finally {
      setIsLoading(false);
    }
  };

  // ========== STATS ==========
  const stats = useMemo(() => {
    // Asegurar que licenseTypes es un array
    const types = Array.isArray(licenseTypes) ? licenseTypes : [];
    
    const professional = types.filter(lt => lt.isProfessional).length;
    const ordinary = types.length - professional;
    const withInclusions = types.filter(lt => 
      (lt.parentIncludes?.length > 0) || (lt.childIncludes?.length > 0)
    ).length;
    
    return {
      total: types.length,
      professional,
      ordinary,
      withInclusions
    };
  }, [licenseTypes]);

  // ========== HANDLERS ==========
  const refreshLicenseTypeDetails = async (licenseTypeId) => {
    try {
      const detailed = await licenseTypesService.findOne(licenseTypeId);
      setSelectedLicenseType(detailed);
      setLicenseTypes((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((lt) =>
          lt.licenseTypeId === detailed.licenseTypeId ? detailed : lt
        );
      });
    } catch (error) {
      console.error("Error refreshing license type:", error);
      throw error;
    }
  };


  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeading
        title="Tipos de Licencia"
        subtitle="Consulta los tipos de licencia de conducir disponibles"
        icon={Shield}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Tipos</p>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Profesionales</p>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.professional}</p>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Ordinarias</p>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{stats.ordinary}</p>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Con Inclusiones</p>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.withInclusions}</p>
        </div>
      </div>

      {/* License Types Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Cargando tipos de licencia...</div>
        </div>
      ) : licenseTypes.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            No hay tipos de licencia registrados
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {licenseTypes.map((licenseType) => (
            <Card 
              key={licenseType.licenseTypeId}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
              onClick={() => {
                setSelectedLicenseType(licenseType);
                setIsViewOpen(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${
                      licenseType.isProfessional 
                        ? "bg-blue-100 dark:bg-blue-900/20" 
                        : "bg-emerald-100 dark:bg-emerald-900/20"
                    }`}>
                      <Shield className={`h-6 w-6 ${
                        licenseType.isProfessional 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-emerald-600 dark:text-emerald-400"
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-mono font-bold">
                        {licenseType.code}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {licenseType.description || "Sin descripción"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={licenseType.isProfessional ? "default" : "secondary"}
                    className="ml-auto"
                  >
                    {licenseType.isProfessional ? "Profesional" : "Ordinaria"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Licencias</p>
                      <p className="text-lg font-semibold">
                        {licenseType.driverLicenses?.length || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Inclusiones</p>
                      <p className="text-lg font-semibold">
                        {(licenseType.parentIncludes?.length || 0) + (licenseType.childIncludes?.length || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLicenseType(licenseType);
                      setIsViewOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Detalles del Tipo de Licencia
            </DialogTitle>
          </DialogHeader>
          {selectedLicenseType && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código</p>
                  <p className="font-mono font-bold text-2xl">{selectedLicenseType.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge variant={selectedLicenseType.isProfessional ? "default" : "secondary"}>
                    {selectedLicenseType.isProfessional ? "Profesional" : "Ordinaria"}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Descripción</p>
                <p className="text-base">{selectedLicenseType.description || "—"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Total Licencias</p>
                  <p className="text-2xl font-bold">
                    {selectedLicenseType.driverLicenses?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inclusiones</p>
                  <p className="text-2xl font-bold">
                    {(selectedLicenseType.parentIncludes?.length || 0) + (selectedLicenseType.childIncludes?.length || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default LicenseTypesPage;