import React, { useState } from "react";
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
import { Loader2, MapPin, Navigation, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useUpdateTripLocation } from "@/hooks/use-trips";
import { useRoute } from "@/hooks/use-routes";
import { parseFieldErrors, getErrorDetail } from "@/services/trips.service";
import { calculateRouteDistance } from "@/utils/routeDistance";

export default function UpdateLocationModal({ trip, open, onOpenChange, onSuccess }) {
  const [serverErrors, setServerErrors] = useState({});
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const updateLocationMut = useUpdateTripLocation(trip?.id?.toString());
  
  // Obtener información de la ruta para el origen
  const { data: routeData } = useRoute(trip?.routeId?.toString());

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
      currentLat: trip?.currentLat?.toString() || "",
      currentLng: trip?.currentLng?.toString() || "",
      currentDistance: trip?.currentDistance?.toString() || "",
    },
  });

  const currentLat = watch("currentLat");
  const currentLng = watch("currentLng");

  // Obtener ubicación actual usando geolocalización del navegador
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setValue("currentLat", lat.toString());
          setValue("currentLng", lng.toString());
          
          // Si tenemos la ruta, calcular la distancia automáticamente
          if (routeData?.originLat && routeData?.originLng) {
            setIsCalculatingDistance(true);
            try {
              const distance = await calculateRouteDistance(
                routeData.originLat,
                routeData.originLng,
                lat,
                lng
              );
              setValue("currentDistance", distance.toFixed(2));
              toast.success("Ubicación y distancia calculadas", {
                description: `Distancia desde origen: ${distance.toFixed(2)} km`,
              });
            } catch (error) {
              console.error("Error calculando distancia:", error);
              toast.warning("Ubicación obtenida, pero no se pudo calcular la distancia automáticamente", {
                description: "Puedes ingresarla manualmente",
              });
            } finally {
              setIsCalculatingDistance(false);
            }
          } else {
            toast.success("Ubicación obtenida", {
              description: "Coordenadas actualizadas",
            });
          }
        } catch (error) {
          console.error("Error al obtener ubicación:", error);
          toast.error("Error al procesar la ubicación");
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "No se pudo obtener tu ubicación";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permiso de geolocalización denegado. Por favor, permite el acceso a tu ubicación.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Ubicación no disponible. Verifica tu conexión o GPS.";
            break;
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado. Intenta de nuevo.";
            break;
        }
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Calcular distancia cuando cambien las coordenadas manualmente
  React.useEffect(() => {
    if (!currentLat || !currentLng || !routeData?.originLat || !routeData?.originLng) {
      return;
    }

    const lat = parseFloat(currentLat);
    const lng = parseFloat(currentLng);

    if (isNaN(lat) || isNaN(lng)) {
      return;
    }

    // Solo calcular si las coordenadas son válidas
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const timeoutId = setTimeout(async () => {
        setIsCalculatingDistance(true);
        try {
          const distance = await calculateRouteDistance(
            routeData.originLat,
            routeData.originLng,
            lat,
            lng
          );
          setValue("currentDistance", distance.toFixed(2), { shouldValidate: false });
        } catch (error) {
          console.error("Error calculando distancia:", error);
        } finally {
          setIsCalculatingDistance(false);
        }
      }, 1000); // Debounce de 1 segundo

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLat, currentLng, routeData?.originLat, routeData?.originLng]);

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
      
      const payload = {
        currentLat: parseFloat(data.currentLat),
        currentLng: parseFloat(data.currentLng),
      };
      
      if (data.currentDistance) {
        payload.currentDistance = parseFloat(data.currentDistance);
      }

      await updateLocationMut.mutateAsync(payload);
      
      toast.success("Ubicación actualizada", {
        description: "La ubicación del viaje ha sido actualizada",
      });
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      const fieldErrors = parseFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(getErrorDetail(err, "Error al actualizar la ubicación"));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="size-5 text-primary" />
            Actualizar ubicación
          </DialogTitle>
          <DialogDescription>
            Actualiza la ubicación actual del viaje {trip?.routeName ? `"${trip.routeName}"` : `#${trip?.id}`} en ruta.
            Usa el botón para obtener tu ubicación automáticamente o ingresa las coordenadas manualmente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Botón para obtener ubicación actual */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation || isCalculatingDistance || isSubmitting}
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Obteniendo ubicación...
                </>
              ) : (
                <>
                  <Navigation className="mr-2 size-4" />
                  Obtener mi ubicación
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentLat" className="text-xs">
                Latitud *
              </Label>
              <Input
                id="currentLat"
                type="number"
                step="any"
                {...register("currentLat", {
                  required: "La latitud es obligatoria",
                  validate: (value) => {
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
                Longitud *
              </Label>
              <Input
                id="currentLng"
                type="number"
                step="any"
                {...register("currentLng", {
                  required: "La longitud es obligatoria",
                  validate: (value) => {
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="currentDistance" className="text-xs">
                Distancia recorrida (km)
              </Label>
              {isCalculatingDistance && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" />
                  Calculando...
                </span>
              )}
            </div>
            <Input
              id="currentDistance"
              type="number"
              step="0.01"
              min="0"
              readOnly={isCalculatingDistance}
              className={isCalculatingDistance ? "bg-muted" : ""}
              {...register("currentDistance", {
                validate: (value) => {
                  if (!value) return true;
                  const num = parseFloat(value);
                  return (!isNaN(num) && num >= 0) || "La distancia debe ser mayor o igual a 0";
                },
              })}
              placeholder="Se calculará automáticamente"
            />
            {errors.currentDistance && (
              <p className="text-xs text-destructive mt-1">
                {errors.currentDistance.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {routeData?.originLat && routeData?.originLng
                ? "Se calcula automáticamente desde el origen de la ruta"
                : "Ingresa la distancia manualmente o usa 'Obtener mi ubicación'"}
            </p>
          </div>

          {!routeData?.originLat || !routeData?.originLng ? (
            <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="size-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-800 dark:text-yellow-300">
                No se pudo cargar la información del origen de la ruta. La distancia se calculará manualmente o no se enviará.
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isCalculatingDistance}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              <MapPin className="mr-2 size-4" />
              Actualizar ubicación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
