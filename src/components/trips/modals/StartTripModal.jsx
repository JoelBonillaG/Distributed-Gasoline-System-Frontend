import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { Button } from "@/components/ui/shadcn/button";
import { Label } from "@/components/ui/shadcn/label";
import { Input } from "@/components/ui/shadcn/input";
import { Loader2, Play, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useStartTrip } from "@/hooks/use-trips";
import { parseFieldErrors, getErrorDetail } from "@/services/trips.service";

export default function StartTripModal({ trip, open, onOpenChange, onSuccess }) {
  const [serverErrors, setServerErrors] = useState({});
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const startTripMut = useStartTrip(trip?.id?.toString());

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      currentLat: "",
      currentLng: "",
    },
  });

  const currentLat = watch("currentLat");
  const currentLng = watch("currentLng");

  // Obtener ubicación automáticamente cuando se abre el modal
  useEffect(() => {
    if (open && navigator.geolocation) {
      setIsGettingLocation(true);
      setLocationError(null);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setValue("currentLat", lat.toFixed(6));
          setValue("currentLng", lng.toFixed(6));
          setIsGettingLocation(false);
          
          toast.success("Ubicación obtenida", {
            description: "Se utilizarán tus coordenadas actuales al iniciar el viaje",
          });
        },
        (error) => {
          setIsGettingLocation(false);
          let errorMessage = "No se pudo obtener la ubicación";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Permiso de ubicación denegado";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Información de ubicación no disponible";
              break;
            case error.TIMEOUT:
              errorMessage = "Tiempo de espera agotado";
              break;
          }
          setLocationError(errorMessage);
          toast.warning("Ubicación no disponible", {
            description: "Se iniciará el viaje sin coordenadas",
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else if (open && !navigator.geolocation) {
      setLocationError("Geolocalización no soportada por este navegador");
      toast.warning("Geolocalización no disponible", {
        description: "Se iniciará el viaje sin coordenadas",
      });
    }
  }, [open, setValue]);

  // Sincronizar errores del servidor
  React.useEffect(() => {
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

  const onSubmit = async (data) => {
    try {
      setServerErrors({});
      
      const payload = {};
      if (data.currentLat && data.currentLng) {
        payload.currentLat = parseFloat(data.currentLat);
        payload.currentLng = parseFloat(data.currentLng);
      }

      await startTripMut.mutateAsync(payload);
      
      toast.success("Viaje iniciado exitosamente", {
        description: "El viaje ahora está en ruta",
      });
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      const fieldErrors = parseFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(getErrorDetail(err, "Error al iniciar el viaje"));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="size-5 text-primary" />
            Iniciar viaje
          </DialogTitle>
          <DialogDescription>
            Inicia el viaje {trip?.routeName ? `"${trip.routeName}"` : `#${trip?.id}`}. 
            {isGettingLocation 
              ? " Obteniendo tu ubicación..." 
              : currentLat && currentLng
              ? " Se utilizarán tus coordenadas actuales. Puedes editarlas manualmente si lo necesitas."
              : " Puedes ingresar tus coordenadas manualmente o continuar sin ellas."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Estado de geolocalización */}
          <div className="space-y-3">
            {isGettingLocation && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Obteniendo tu ubicación...
                </span>
              </div>
            )}

            {!isGettingLocation && currentLat && currentLng && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <MapPin className="size-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Ubicación obtenida automáticamente
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Puedes editar las coordenadas manualmente si lo necesitas para testing.
                  </p>
                </div>
              </div>
            )}

            {!isGettingLocation && !currentLat && !currentLng && locationError && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    No se pudo obtener la ubicación
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {locationError}. Puedes ingresar las coordenadas manualmente.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Campos de entrada manual */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Coordenadas (opcional - para testing)
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              Puedes ingresar las coordenadas manualmente o usar las obtenidas automáticamente arriba.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentLat" className="text-xs">
                  Latitud
                </Label>
                <Input
                  id="currentLat"
                  type="number"
                  step="any"
                  {...register("currentLat", {
                    validate: (value) => {
                      if (!value) return true; // Opcional
                      const num = parseFloat(value);
                      return (!isNaN(num) && num >= -90 && num <= 90) || "Latitud inválida (-90 a 90)";
                    },
                  })}
                  placeholder="-1.8312"
                />
                {errors.currentLat && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.currentLat.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="currentLng" className="text-xs">
                  Longitud
                </Label>
                <Input
                  id="currentLng"
                  type="number"
                  step="any"
                  {...register("currentLng", {
                    validate: (value) => {
                      if (!value) return true; // Opcional
                      const num = parseFloat(value);
                      return (!isNaN(num) && num >= -180 && num <= 180) || "Longitud inválida (-180 a 180)";
                    },
                  })}
                  placeholder="-78.1834"
                />
                {errors.currentLng && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.currentLng.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isGettingLocation}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isGettingLocation}
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              <Play className="mr-2 size-4" />
              Iniciar viaje
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

