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
import { Textarea } from "@/components/ui/shadcn/textarea";
import { Loader2, FileCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useReviewTrip, useCalculateTripMetrics } from "@/hooks/use-trips";
import { parseFieldErrors, getErrorDetail } from "@/services/trips.service";

export default function ReviewTripModal({ trip, open, onOpenChange, onSuccess }) {
  const [serverErrors, setServerErrors] = useState({});
  const [previewMetrics, setPreviewMetrics] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const reviewTripMut = useReviewTrip(trip?.id?.toString());
  const calculateMetricsMut = useCalculateTripMetrics(trip?.id?.toString());

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      odometerEnd: trip?.odometerEnd?.toString() || trip?.odometerStart?.toString() || "",
      reviewComment: trip?.reviewComment || "",
    },
  });

  const odometerEndValue = watch("odometerEnd");

  // Calcular métricas cuando cambie el odómetro final
  React.useEffect(() => {
    if (!odometerEndValue || !trip?.id) return;
    
    const numValue = parseFloat(odometerEndValue);
    if (isNaN(numValue) || numValue <= (trip.odometerStart || 0)) {
      setPreviewMetrics(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCalculating(true);
      try {
        const metrics = await calculateMetricsMut.mutateAsync({
          odometerEnd: numValue,
        });
        setPreviewMetrics(metrics);
      } catch (err) {
        console.error("Error calculando métricas:", err);
        setPreviewMetrics(null);
      } finally {
        setIsCalculating(false);
      }
    }, 800); // Debounce

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [odometerEndValue, trip?.id, trip?.odometerStart]);

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
        odometerEnd: parseFloat(data.odometerEnd),
        reviewComment: data.reviewComment || "",
      };

      await reviewTripMut.mutateAsync(payload);
      
      toast.success("Viaje revisado exitosamente", {
        description: "El viaje ha sido completado y aprobado",
      });
      
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      const fieldErrors = parseFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(getErrorDetail(err, "Error al revisar el viaje"));
      }
    }
  };

  // Calcular desviación si hay métricas
  const deviation = previewMetrics && trip?.fuelEstimated
    ? ((previewMetrics.fuelActual - trip.fuelEstimated) / trip.fuelEstimated * 100)
    : null;
  const requiresComment = deviation !== null && Math.abs(deviation) > 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="size-5 text-primary" />
            Revisar viaje
          </DialogTitle>
          <DialogDescription>
            Revisa el viaje {trip?.routeName ? `"${trip.routeName}"` : `#${trip?.id}`} y confirma el odómetro final. 
            Si la desviación de combustible supera el 3%, se requiere un comentario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="odometerEnd" className="text-sm">
              Odómetro final (km) *
            </Label>
            <Input
              id="odometerEnd"
              type="number"
              step="0.1"
              min={trip?.odometerStart || 0}
              max="10000000"
              {...register("odometerEnd", {
                required: "El odómetro final es obligatorio",
                validate: (value) => {
                  const num = parseFloat(value);
                  const start = trip?.odometerStart || 0;
                  if (isNaN(num) || num <= start) {
                    return `Debe ser mayor al odómetro inicial (${start} km)`;
                  }
                  if (num > 10000000) {
                    return "El odómetro no puede superar 10,000,000 km";
                  }
                  return true;
                },
              })}
              placeholder={trip?.odometerStart?.toString() || "0"}
            />
            {errors.odometerEnd && (
              <p className="text-xs text-destructive mt-1">
                {errors.odometerEnd.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Odómetro inicial: {trip?.odometerStart || 0} km
            </p>
          </div>

          {/* Previsualización de métricas */}
          {previewMetrics && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Previsualización de métricas</span>
                {isCalculating && <Loader2 className="size-4 animate-spin" />}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Distancia real: </span>
                  <span className="font-medium">
                    {previewMetrics.distanceKmReal?.toFixed(2) || 0} km
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Combustible real: </span>
                  <span className="font-medium">
                    {previewMetrics.fuelActual?.toFixed(2) || 0} L
                  </span>
                </div>
              </div>

              {trip?.fuelEstimated && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Desviación:</span>
                    <span
                      className={`font-semibold ${
                        deviation !== null && Math.abs(deviation) > 3
                          ? "text-destructive"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {deviation !== null ? `${deviation > 0 ? "+" : ""}${deviation.toFixed(2)}%` : "N/A"}
                    </span>
                  </div>
                  {requiresComment && (
                    <div className="mt-2 flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                      <AlertCircle className="size-4 text-destructive mt-0.5 shrink-0" />
                      <p className="text-xs text-destructive">
                        La desviación supera el 3%. Se requiere un comentario de revisión obligatorio.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reviewComment" className="text-sm">
              Comentario de revisión {requiresComment && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="reviewComment"
              rows={4}
              maxLength={1000}
              {...register("reviewComment", {
                required: requiresComment ? "El comentario es obligatorio cuando la desviación supera el 3%" : false,
                minLength: requiresComment ? {
                  value: 10,
                  message: "El comentario debe tener al menos 10 caracteres",
                } : undefined,
                maxLength: {
                  value: 1000,
                  message: "El comentario no puede superar 1,000 caracteres",
                },
              })}
              placeholder="Explica cualquier observación sobre el viaje..."
            />
            {errors.reviewComment && (
              <p className="text-xs text-destructive mt-1">
                {errors.reviewComment.message}
              </p>
            )}
            {!requiresComment && (
              <p className="text-xs text-muted-foreground">
                Opcional, pero requerido si la desviación de combustible supera el 3%
              </p>
            )}
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
              <FileCheck className="mr-2 size-4" />
              Aprobar viaje
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

