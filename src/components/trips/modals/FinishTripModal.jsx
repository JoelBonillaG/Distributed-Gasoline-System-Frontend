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
import { Button } from "@/components/ui/shadcn/button";
import { Label } from "@/components/ui/shadcn/label";
import { Input } from "@/components/ui/shadcn/input";
import { Loader2, CheckCircle, AlertTriangle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useFinishTrip } from "@/hooks/use-trips";
import { parseFieldErrors, getErrorDetail } from "@/services/trips.service";
import { calculateRouteDistance } from "@/utils/routeDistance";

export default function FinishTripModal({ trip, open, onOpenChange, onSuccess }) {
  const [serverErrors, setServerErrors] = useState({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationWarning, setLocationWarning] = useState(null);
  const finishTripMut = useFinishTrip(trip?.id?.toString());

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      currentLat: "",
      currentLng: "",
    },
  });

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
    // Validar que ambas coordenadas estén presentes
    if (!data.currentLat || !data.currentLng) {
      toast.error("Ubicación requerida", {
        description: "Debes obtener tu ubicación GPS o ingresarla manualmente para finalizar el viaje",
      });
      return;
    }

    // Preparar payload
    const payload = {
      currentLat: parseFloat(data.currentLat),
      currentLng: parseFloat(data.currentLng),
    };

    console.log("=== DEBUG: Validación de ubicación ===");
    console.log("Trip data:", trip);
    console.log("Coordenadas actuales:", payload);
    console.log("Coordenadas destino:", {
      destinationLat: trip?.destinationLat,
      destinationLng: trip?.destinationLng,
      distanceKmPlanned: trip?.distanceKmPlanned
    });

    // Calcular si está dentro del margen del 3% usando distancia por carretera
    if (trip?.destinationLat && trip?.destinationLng && trip?.distanceKmPlanned) {
      try {
        // Usar la misma función que calcula las rutas reales (con carreteras)
        const distanceToDestKm = await calculateRouteDistance(
          payload.currentLat,
          payload.currentLng,
          trip.destinationLat,
          trip.destinationLng
        );
        
        const allowedMarginKm = trip.distanceKmPlanned * 0.03; // 3% de la distancia total
        const isWithinMargin = distanceToDestKm <= allowedMarginKm;
        const deviationPercentage = ((distanceToDestKm / trip.distanceKmPlanned) * 100).toFixed(2);

        console.log("Cálculo de distancia (por carretera):", {
          distanceToDestKm: distanceToDestKm.toFixed(2),
          allowedMarginKm: allowedMarginKm.toFixed(2),
          isWithinMargin,
          deviationPercentage: deviationPercentage + "%"
        });

        if (!isWithinMargin) {
          console.log("⚠️ ADVERTENCIA: Conductor fuera del margen permitido");
          setLocationWarning({
            distanceKm: distanceToDestKm.toFixed(2),
            allowedMarginKm: allowedMarginKm.toFixed(2),
            deviationPercentage,
          });
        } else {
          console.log("✅ Conductor dentro del margen permitido");
          setLocationWarning(null);
        }
      } catch (error) {
        console.error("Error calculando distancia por carretera:", error);
        // Si falla el cálculo de ruta, no mostrar advertencia
        setLocationWarning(null);
      }
    } else {
      console.warn("No se puede calcular distancia, faltan datos del trip");
    }

    // Guardar datos y mostrar modal de confirmación
    setPendingData(payload);
    setShowConfirmDialog(true);
  };

  const handleConfirmFinish = async () => {
    try {
      setServerErrors({});
      setShowConfirmDialog(false);
      
      await finishTripMut.mutateAsync(pendingData);
      
      toast.success("Viaje finalizado exitosamente", {
        description: "El viaje ahora está en revisión",
      });
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      const fieldErrors = parseFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(getErrorDetail(err, "Error al finalizar el viaje"));
      }
    } finally {
      setPendingData(null);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setValue("currentLat", lat);
        setValue("currentLng", lng);
        clearErrors(["currentLat", "currentLng"]);
        toast.success("Ubicación obtenida correctamente", {
          description: `Lat: ${lat}, Lng: ${lng}`,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        let message = "No se pudo obtener la ubicación";
        if (error.code === 1) {
          message = "Permiso de ubicación denegado. Por favor, activa el GPS y permite el acceso.";
        } else if (error.code === 2) {
          message = "Ubicación no disponible. Verifica tu señal GPS.";
        } else if (error.code === 3) {
          message = "Tiempo de espera agotado. Intenta nuevamente.";
        }
        toast.error(message);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-primary" />
              Finalizar viaje
            </DialogTitle>
            <DialogDescription>
              Finaliza el viaje {trip?.routeName ? `"${trip.routeName}"` : `#${trip?.id}`}. 
              El viaje pasará a estado "En Revisión" para que el supervisor lo revise.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Ubicación final <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation || isSubmitting}
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="mr-2 size-3 animate-spin" />
                      Obteniendo...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 size-3" />
                      Obtener ubicación
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Usa el GPS para obtener tu ubicación actual o ingrésala manualmente. Es obligatorio para finalizar el viaje.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentLat" className="text-xs">
                    Latitud <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="currentLat"
                    type="number"
                    step="any"
                    {...register("currentLat", {
                      required: "La latitud es requerida",
                      validate: (value) => {
                        if (!value) return "La latitud es requerida";
                        const num = parseFloat(value);
                        return (!isNaN(num) && num >= -90 && num <= 90) || "Latitud inválida (-90 a 90)";
                      },
                    })}
                    placeholder="-1.8312"
                    className={errors.currentLat ? "border-destructive" : ""}
                  />
                  {errors.currentLat && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.currentLat.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="currentLng" className="text-xs">
                    Longitud <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="currentLng"
                    type="number"
                    step="any"
                    {...register("currentLng", {
                      required: "La longitud es requerida",
                      validate: (value) => {
                        if (!value) return "La longitud es requerida";
                        const num = parseFloat(value);
                        return (!isNaN(num) && num >= -180 && num <= 180) || "Longitud inválida (-180 a 180)";
                      },
                    })}
                    placeholder="-78.1834"
                    className={errors.currentLng ? "border-destructive" : ""}
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
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                <CheckCircle className="mr-2 size-4" />
                Finalizar viaje
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className={`size-5 ${locationWarning ? 'text-orange-500' : 'text-orange-500'}`} />
              ¿Confirmar finalización del viaje?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Estás a punto de finalizar el viaje {trip?.routeName ? `"${trip.routeName}"` : `#${trip?.id}`}.
              </p>
              
              {locationWarning && (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3 space-y-1">
                  <p className="font-semibold text-orange-800 flex items-center gap-1">
                    <AlertTriangle className="size-4" />
                    Advertencia de ubicación
                  </p>
                  <p className="text-sm text-orange-700">
                    No te encuentras dentro del margen permitido del destino.
                  </p>
                  <div className="text-xs text-orange-600 space-y-0.5 mt-2">
                    <p>• Distancia al destino: <strong>{locationWarning.distanceKm} km</strong></p>
                    <p>• Margen permitido (3%): <strong>{locationWarning.allowedMarginKm} km</strong></p>
                    <p>• Desviación: <strong>{locationWarning.deviationPercentage}%</strong></p>
                  </div>
                  {trip?.destinationLat && trip?.destinationLng && (
                    <div className="text-xs text-orange-700 mt-2 pt-2 border-t border-orange-200">
                      <p className="font-medium mb-1">Coordenadas del destino esperado:</p>
                      <p className="font-mono">Lat: {trip.destinationLat.toFixed(6)}, Lng: {trip.destinationLng.toFixed(6)}</p>
                    </div>
                  )}
                  <p className="text-xs text-orange-600 mt-2 italic">
                    Puedes continuar, pero el supervisor deberá revisar y comentar sobre esta desviación.
                  </p>
                </div>
              )}
              
              <p className="font-medium">
                Una vez finalizado, el viaje pasará a estado "En Revisión" y no podrás realizar más cambios.
              </p>
              <p className="text-sm text-muted-foreground">
                El supervisor revisará los datos del viaje para su aprobación final.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={finishTripMut.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmFinish}
              disabled={finishTripMut.isPending}
              className={locationWarning ? 'bg-orange-600 hover:bg-orange-700' : 'bg-primary hover:bg-primary/90'}
            >
              {finishTripMut.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Sí, finalizar de todas formas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

