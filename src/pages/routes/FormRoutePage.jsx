import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { PageHeading } from "@/components/ui/typography/Heading";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import MapRoutePicker from "@/components/routes/MapRoutePicker";
import { useAddRoute, useUpdateRoute, useRoute } from "@/hooks/use-routes";
import { parseFieldErrors, getErrorDetail } from "@/services/routes.service";

const VEHICLE_TYPE_OPTIONS = [
  { value: "LIVIANO", label: "Liviano" },
  { value: "PESADO", label: "Pesado" },
  { value: "CUALQUIERA", label: "Liviano o Pesado" },
];

export default function FormRoutePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determinar el modo: view, edit o create
  const isViewMode = location.pathname.includes("/routes/view/");
  const isEditMode = location.pathname.includes("/routes/edit/") && Boolean(id);
  const isCreateMode = !isViewMode && !isEditMode;
  
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [serverErrors, setServerErrors] = useState({});
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const hasResetForm = useRef(false);

  // Hooks para fetch/update
  const { data: routeData, isLoading: isLoadingRoute } = useRoute(id);
  const addMut = useAddRoute();
  const updateMut = useUpdateRoute(id);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setError,
    clearErrors,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      originName: "",
      originLat: null,
      originLng: null,
      destinationName: "",
      destinationLat: null,
      destinationLng: null,
      distanceKm: "",
      vehicleType: "",
    },
  });

  // Obtener hasTrips del routeData
  const hasTrips = routeData?.hasTrips ?? false;
  
  // Watch vehicleType para verificar su valor
  const vehicleTypeValue = watch("vehicleType");
  
  // Calcular qué campos están bloqueados
  const isReadOnly = isViewMode || isLoadingRoute;
  const canEditMap = !isLoadingRoute && (isCreateMode || (isEditMode && !hasTrips));
  const canEditCoordsAndDistance = !isLoadingRoute && (isCreateMode || (isEditMode && !hasTrips));
  const canEditVehicleType = !isLoadingRoute && (isCreateMode || (isEditMode && !hasTrips));
  
  // Asegurar que vehicleType se mantenga cuando routeData esté disponible
  useEffect(() => {
    if ((isEditMode || isViewMode) && routeData?.vehicleType && !vehicleTypeValue) {
      setValue("vehicleType", routeData.vehicleType, { shouldValidate: false, shouldDirty: false });
    }
  }, [isEditMode, isViewMode, routeData, vehicleTypeValue, setValue]);

  // Cargar datos existentes si estamos en modo edición o view
  useEffect(() => {
    if ((isEditMode || isViewMode) && routeData && !hasResetForm.current) {
      // Resetear el formulario con todos los datos de una vez
      reset({
        name: routeData.name || "",
        originName: routeData.originName || "",
        originLat: routeData.originLat || null,
        originLng: routeData.originLng || null,
        destinationName: routeData.destinationName || "",
        destinationLat: routeData.destinationLat || null,
        destinationLng: routeData.destinationLng || null,
        distanceKm: routeData.distanceKm || "",
        vehicleType: routeData.vehicleType || "",
      }, { keepDefaultValues: false });
      hasResetForm.current = true;
    }
    
    // Resetear el ref cuando cambie el id
    if (!routeData) {
      hasResetForm.current = false;
    }
  }, [isEditMode, isViewMode, routeData, reset, id]);
  
  // Cargar mapa cuando routeData cambie
  useEffect(() => {
    if ((isEditMode || isViewMode) && routeData) {
      if (routeData.originLat && routeData.originLng) {
        setOrigin({
          lat: routeData.originLat,
          lng: routeData.originLng,
          name: routeData.originName,
        });
      }
      
      if (routeData.destinationLat && routeData.destinationLng) {
        setDestination({
          lat: routeData.destinationLat,
          lng: routeData.destinationLng,
          name: routeData.destinationName,
        });
      }
    }
  }, [isEditMode, isViewMode, routeData]);

  // Mostrar loading overlay con delay mínimo de 2 segundos en view/edit
  useEffect(() => {
    if ((isViewMode || isEditMode) && id) {
      // Mostrar overlay cuando empieza a cargar
      setShowLoadingOverlay(true);
      
      // Ocultar después de 2 segundos o cuando los datos estén listos
      const timer = setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setShowLoadingOverlay(false);
    }
  }, [isViewMode, isEditMode, id]);

  // Sincronizar serverErrors con react-hook-form
  useEffect(() => {
    clearErrors();
    if (serverErrors && typeof serverErrors === "object") {
      Object.entries(serverErrors).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          setError(field, {
            type: "server",
            message: messages[0],
          });
        }
      });
    }
  }, [serverErrors, clearErrors, setError]);

  // Manejar cambios en el origen desde el mapa
  const handleOriginChange = (point) => {
    setOrigin(point);
    if (!point) {
      setValue("originLat", null);
      setValue("originLng", null);
      setValue("originName", "");
      return;
    }
    if (point.lat !== null && point.lng !== null) {
      setValue("originLat", point.lat);
      setValue("originLng", point.lng);
    }
    if (point.name) {
      setValue("originName", point.name);
    }
    if (point._distance !== undefined) {
      setValue("distanceKm", point._distance);
    }
  };

  // Manejar cambios en el destino desde el mapa
  const handleDestinationChange = (point) => {
    if (!point) {
      setDestination(null);
      setValue("destinationLat", null);
      setValue("destinationLng", null);
      setValue("destinationName", "");
      setValue("distanceKm", "");
      return;
    }
    
    // Si solo cambió la distancia (_distance), no actualizar el destino completo
    if (point._distance !== undefined && destination?.lat === point.lat && destination?.lng === point.lng) {
      setValue("distanceKm", point._distance);
      return;
    }
    
    setDestination(point);
    if (point.lat !== null && point.lng !== null) {
      setValue("destinationLat", point.lat);
      setValue("destinationLng", point.lng);
    }
    if (point.name) {
      setValue("destinationName", point.name);
    }
    if (point._distance !== undefined) {
      setValue("distanceKm", point._distance);
    }
  };

  const onSubmit = async (data) => {
    // No permitir submit en view mode
    if (isViewMode) return;
    
    // Si tiene viajes, solo enviar name, originName y destinationName
    if (isEditMode && hasTrips) {
      const payload = {
        id: parseInt(id),
        name: data.name,
        originName: data.originName || origin?.name || "",
        destinationName: data.destinationName || destination?.name || "",
      };

      try {
        setServerErrors({});
        await updateMut.mutateAsync(payload);
        toast.success("Ruta actualizada exitosamente", {
          description: data.name,
        });
        navigate("/routes");
      } catch (err) {
        const fieldErrors = parseFieldErrors(err);
        if (Object.keys(fieldErrors).length > 0) {
          setServerErrors(fieldErrors);
        } else {
          toast.error(getErrorDetail(err, "Error al guardar la ruta"));
        }
      }
      return;
    }

    // Preparar payload completo (create o edit sin viajes)
    const payload = {
      name: data.name,
      originName: data.originName || origin?.name || "",
      originLat: data.originLat || origin?.lat || 0,
      originLng: data.originLng || origin?.lng || 0,
      destinationName: data.destinationName || destination?.name || "",
      destinationLat: data.destinationLat || destination?.lat || 0,
      destinationLng: data.destinationLng || destination?.lng || 0,
      distanceKm: parseFloat(data.distanceKm) || 0,
      vehicleType: data.vehicleType,
    };

    // Si es edit, añadir el id
    if (isEditMode) {
      payload.id = parseInt(id);
    }

    // Validar que hay al menos origen y destino (solo en create o edit sin viajes)
    if (!origin || !destination) {
      toast.error("Debes seleccionar origen y destino en el mapa");
      return;
    }

    try {
      setServerErrors({});
      
      if (isEditMode) {
        await updateMut.mutateAsync(payload);
        toast.success("Ruta actualizada exitosamente", {
          description: data.name,
        });
      } else {
        await addMut.mutateAsync(payload);
        toast.success("Ruta creada exitosamente", {
          description: data.name,
        });
      }
      
      navigate("/routes");
    } catch (err) {
      const fieldErrors = parseFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(getErrorDetail(err, "Error al guardar la ruta"));
      }
    }
  };

  return (
    <div className="space-y-6 p-6 relative">
      {/* Modal de carga - solo en view/edit con delay mínimo */}
      {showLoadingOverlay && (isViewMode || isEditMode) && createPortal(
        <div className="fixed inset-0 z-[99999] bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-foreground">Cargando ruta...</p>
          </div>
        </div>,
        document.body
      )}
      <PageHeading
        title={
          isViewMode ? "Ver ruta" : isEditMode ? "Editar ruta" : "Nueva ruta"
        }
        subtitle={
          isViewMode
            ? "Visualiza los detalles de la ruta (solo lectura)."
            : isEditMode
            ? "Actualiza los detalles de la ruta."
            : "Crea una nueva ruta de distribución."
        }
        icon={MapPin}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Mapa interactivo */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Selecciona origen y destino</h3>
          <MapRoutePicker
            origin={origin}
            destination={destination}
            onOriginChange={canEditMap ? handleOriginChange : undefined}
            onDestinationChange={canEditMap ? handleDestinationChange : undefined}
            mode={isViewMode ? "view" : isEditMode ? "edit" : "create"}
            disabled={!canEditMap}
            hideDirectionsPanel={isViewMode || (isEditMode && hasTrips)}
          />
        </div>

        {/* Información general */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Información de la ruta</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2">
              <Label className="mb-1 block">Nombre de la ruta *</Label>
              <Input
                {...register("name", {
                  required: "El nombre es obligatorio",
                  minLength: {
                    value: 3,
                    message: "Mínimo 3 caracteres",
                  },
                })}
                disabled={isReadOnly}
                className={isReadOnly ? "bg-muted" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Origen */}
            <div>
              <Label className="mb-1 block">Origen *</Label>
              <Input
                {...register("originName", {
                  required: "El origen es obligatorio",
                })}
                placeholder="Selecciona en el mapa..."
                disabled={isReadOnly || (!origin && !isViewMode)}
                className={isReadOnly ? "bg-muted" : ""}
              />
              {errors.originName && (
                <p className="text-sm text-destructive">{errors.originName.message}</p>
              )}
            </div>

            {/* Destino */}
            <div>
              <Label className="mb-1 block">Destino *</Label>
              <Input
                {...register("destinationName", {
                  required: "El destino es obligatorio",
                })}
                placeholder="Selecciona en el mapa..."
                disabled={isReadOnly || (!destination && !isViewMode)}
                className={isReadOnly ? "bg-muted" : ""}
              />
              {errors.destinationName && (
                <p className="text-sm text-destructive">
                  {errors.destinationName.message}
                </p>
              )}
            </div>

            {/* Distancia */}
            <div>
              <Label className="mb-1 block">Distancia (km) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("distanceKm", {
                  required: "La distancia es obligatoria",
                  min: {
                    value: 0,
                    message: "Debe ser mayor o igual a 0",
                  },
                })}
                readOnly
                disabled={isReadOnly || !canEditCoordsAndDistance}
                className="bg-muted"
              />
              {errors.distanceKm && (
                <p className="text-sm text-destructive">{errors.distanceKm.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Calculado automáticamente
              </p>
            </div>

            {/* Tipo de vehículo */}
            <div>
              <Label className="mb-1 block">Tipo de vehículo *</Label>
              <Controller
                control={control}
                name="vehicleType"
                rules={{ required: "Selecciona un tipo de vehículo" }}
                render={({ field }) => {
                  // Usar el valor del field, si está vacío usar el de routeData como fallback
                  const currentValue = field.value || ((isEditMode || isViewMode) && routeData?.vehicleType) || "";
                  
                  return (
                    <Select 
                      value={currentValue} 
                      onValueChange={field.onChange}
                      disabled={isReadOnly || !canEditVehicleType}
                    >
                      <SelectTrigger className="w-full" disabled={isReadOnly || !canEditVehicleType}>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
              {errors.vehicleType && (
                <p className="text-sm text-destructive">
                  {errors.vehicleType.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        {!isViewMode && (
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/routes")}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditMode ? "Actualizar" : "Crear"} ruta
            </Button>
          </div>
        )}
        {isViewMode && (
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/routes")}
            >
              Volver
            </Button>
            <Button
              type="button"
              onClick={() => navigate(`/routes/edit/${id}`)}
            >
              Editar
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

