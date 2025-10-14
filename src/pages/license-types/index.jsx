import { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  FileText, 
  Users,
  CheckCircle,
  Eye 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/shadcn/alert-dialog";
import DataTable from "@/components/ui/table/data-table";
import { PageHeading } from "@/components/ui/typography/Heading";
import { licenseTypesService } from "@/services/license-types.service";
import LicenseTypeForm from "@/components/license-types/license-type-form";
import LicenseInclusionEditor from "@/components/license-types/license-inclusion-editor";
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
  const [isAddingInclude, setIsAddingInclude] = useState(false);
  const [removingIncludeId, setRemovingIncludeId] = useState(null);
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    licenseType: null,
    isDeleting: false
  });

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
      setLicenseTypes(types);
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
  const handleCreate = async (data) => {
    try {
      await licenseTypesService.create(data);
      toast.success("Tipo de licencia creado exitosamente");
      setIsCreateOpen(false);
      loadLicenseTypes();
    } catch (error) {
      console.error("Error creating license type:", error);
      toast.error(error.response?.data?.message || "Error al crear tipo de licencia");
    }
  };

  const handleEdit = async (data) => {
    if (!selectedLicenseType) return;
    try {
      await licenseTypesService.update(selectedLicenseType.licenseTypeId, data);
      toast.success("Tipo de licencia actualizado");
      setIsEditOpen(false);
      setSelectedLicenseType(null);
      loadLicenseTypes();
    } catch (error) {
      console.error("Error updating license type:", error);
      toast.error(error.response?.data?.message || "Error al actualizar");
    }
  };

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

  const handleAddInclusion = async (childId) => {
    if (!selectedLicenseType) return false;
    let success = false;
    setIsAddingInclude(true);
    try {
      await licenseTypesService.addInclusion(
        selectedLicenseType.licenseTypeId,
        childId
      );
      await refreshLicenseTypeDetails(selectedLicenseType.licenseTypeId);
      toast.success("Inclusión agregada correctamente");
      success = true;
    } catch (error) {
      console.error("Error adding inclusion:", error);
      toast.error(
        error.response?.data?.message || "No se pudo agregar la inclusión"
      );
    } finally {
      setIsAddingInclude(false);
    }
    return success;
  };

  const handleRemoveInclusion = async (childId) => {
    if (!selectedLicenseType) return false;
    let success = false;
    setRemovingIncludeId(childId);
    try {
      await licenseTypesService.removeInclusion(
        selectedLicenseType.licenseTypeId,
        childId
      );
      await refreshLicenseTypeDetails(selectedLicenseType.licenseTypeId);
      toast.success("Inclusión eliminada");
      success = true;
    } catch (error) {
      console.error("Error removing inclusion:", error);
      toast.error(
        error.response?.data?.message || "No se pudo eliminar la inclusión"
      );
    } finally {
      setRemovingIncludeId(null);
    }
    return success;
  };

  useEffect(() => {
    if (!isEditOpen || !selectedLicenseType?.licenseTypeId) return;

    const ensureDetails = async () => {
      try {
        await refreshLicenseTypeDetails(selectedLicenseType.licenseTypeId);
      } catch {
        toast.error("No se pudo obtener las inclusiones actuales");
      }
    };

    ensureDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditOpen, selectedLicenseType?.licenseTypeId]);

  const handleDeleteConfirm = async () => {
    const { licenseType } = deleteDialog;
    if (!licenseType) return;

    setDeleteDialog(prev => ({ ...prev, isDeleting: true }));

    try {
      await licenseTypesService.remove(licenseType.licenseTypeId);
      toast.success(`Tipo de licencia "${licenseType.code}" eliminado`);
      setDeleteDialog({ open: false, licenseType: null, isDeleting: false });
      loadLicenseTypes();
    } catch (error) {
      console.error("Error deleting license type:", error);
      toast.error(error.response?.data?.message || "Error al eliminar");
      setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // ========== COLUMNS ==========
  const columns = [
    {
      accessorKey: "licenseTypeId",
      header: "#",
      size: 60,
    },
    {
      accessorKey: "code",
      header: "Código",
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-base sm:text-lg">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      accessorKey: "isProfessional",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge 
          variant={row.original.isProfessional ? "default" : "secondary"}
          className="text-xs sm:text-sm"
        >
          {row.original.isProfessional ? "Profesional" : "Ordinaria"}
        </Badge>
      ),
    },
    {
      accessorKey: "driverLicenses",
      header: "Licencias",
      cell: ({ row }) => {
        const driverLicenses = row.original.driverLicenses || [];
        return (
          <div className="text-center font-semibold">
            {driverLicenses.length}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Creado",
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.createdAt).toLocaleDateString("es-ES")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-1 sm:gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSelectedLicenseType(row.original);
              setIsViewOpen(true);
            }}
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSelectedLicenseType(row.original);
              setIsEditOpen(true);
            }}
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setDeleteDialog({
              open: true,
              licenseType: row.original,
              isDeleting: false
            })}
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeading
        title="Tipos de Licencia"
        subtitle="Gestiona los tipos de licencia de conducir y sus relaciones"
        icon={Shield}
        actions={
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Tipo
          </Button>
        }
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

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={Array.isArray(licenseTypes) ? licenseTypes : []}
            isLoading={isLoading}
            emptyMessage="No hay tipos de licencia registrados"
          />
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crear Tipo de Licencia
            </DialogTitle>
            <DialogDescription>
              Registra un nuevo tipo de licencia de conducir
            </DialogDescription>
          </DialogHeader>
          <LicenseTypeForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedLicenseType(null);
            setIsAddingInclude(false);
            setRemovingIncludeId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Tipo de Licencia
            </DialogTitle>
            <DialogDescription>
              Modifica la información del tipo de licencia
            </DialogDescription>
          </DialogHeader>
          <LicenseTypeForm
            licenseType={selectedLicenseType}
            onSubmit={handleEdit}
            onCancel={() => {
              setIsEditOpen(false);
              setSelectedLicenseType(null);
            }}
          />
          {selectedLicenseType && (
            <div className="mt-6 border-t pt-6">
              <LicenseInclusionEditor
                parent={selectedLicenseType}
                allLicenseTypes={Array.isArray(licenseTypes) ? licenseTypes : []}
                onAdd={handleAddInclusion}
                onRemove={handleRemoveInclusion}
                isAdding={isAddingInclude}
                removingId={removingIncludeId}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog (Simple for now) */}
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

      {/* Delete Confirmation */}
      <AlertDialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => !deleteDialog.isDeleting && setDeleteDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de licencia?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.licenseType && (
                <>
                  Estás por eliminar el tipo de licencia <strong className="font-mono">{deleteDialog.licenseType.code}</strong>.
                  Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDialog.isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteDialog.isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteDialog.isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LicenseTypesPage;