import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const isEditMode = Boolean(id);
  
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [serverErrors, setServerErrors] = useState({});

  // Hooks para fetch/update
  const { data: routeData, isLoading: isLoadingRoute } = useRoute(id);
  const addMut = useAddRoute();
  const updateMut = useUpdateRoute(id);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
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

  // Cargar datos existentes si estamos en modo edición
  useEffect(() => {
    if (isEditMode && routeData) {
      setValue("name", routeData.name || "");
      setValue("originName", routeData.originName || "");
      setValue("destinationName", routeData.destinationName || "");
      setValue("distanceKm", routeData.distanceKm || "");
      setValue("vehicleType", routeData.vehicleType || "");
      
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
  }, [isEditMode, routeData, setValue]);

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
    // Preparar payload
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

    // Validar que hay al menos origen y destino
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

  if (isLoadingRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title={isEditMode ? "Editar ruta" : "Nueva ruta"}
        subtitle={
          isEditMode
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
            onOriginChange={handleOriginChange}
            onDestinationChange={handleDestinationChange}
            mode={isEditMode ? "edit" : "create"}
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
                disabled={!origin}
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
                disabled={!destination}
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
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
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
                )}
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
      </form>
    </div>
  );
}

