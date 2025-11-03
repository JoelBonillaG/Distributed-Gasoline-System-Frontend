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
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useFinishTrip } from "@/hooks/use-trips";
import { parseFieldErrors, getErrorDetail } from "@/services/trips.service";

export default function FinishTripModal({ trip, open, onOpenChange, onSuccess }) {
  const [serverErrors, setServerErrors] = useState({});
  const finishTripMut = useFinishTrip(trip?.id?.toString());

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
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
    try {
      setServerErrors({});
      
      const payload = {};
      if (data.currentLat) payload.currentLat = parseFloat(data.currentLat);
      if (data.currentLng) payload.currentLng = parseFloat(data.currentLng);

      await finishTripMut.mutateAsync(payload);
      
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
    }
  };

  return (
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
            <Label className="text-sm text-muted-foreground">
              Ubicación final (opcional)
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              Si tienes GPS disponible, puedes proporcionar tus coordenadas al finalizar.
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
                      if (!value) return true;
                      const num = parseFloat(value);
                      return (!isNaN(num) && num >= -90 && num <= 90) || "Latitud inválida";
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
                      if (!value) return true;
                      const num = parseFloat(value);
                      return (!isNaN(num) && num >= -180 && num <= 180) || "Longitud inválida";
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
  );
}

