import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Separator } from "@/components/ui/shadcn/separator";
import { Loader2, Plus, Truck, MapPin, Route, User, Users, Car, ChevronDown, Navigation } from "lucide-react";
import { toast } from "sonner";
import MapRoutePicker from "@/components/routes/MapRoutePicker";
import { useAddRoute } from "@/hooks/use-routes";
import { useAddTrip, useAssignableDrivers, useAssignableVehicles, useAssignableSupervisors } from "@/hooks/use-trips";
import { useAllRoutes } from "@/hooks/use-routes";
import { parseFieldErrors, getErrorDetail } from "@/services/trips.service";
import { reverseGeocode } from "@/services/geocoding.service";

const VEHICLE_TYPE_OPTIONS = [
  { value: "LIVIANO", label: "Liviano" },
  { value: "PESADO", label: "Pesado" },
  { value: "CUALQUIERA", label: "Liviano o Pesado" },
];

export default function FormCreateTripPage() {
  const navigate = useNavigate();
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [serverErrors, setServerErrors] = useState({});
  const [createdRouteId, setCreatedRouteId] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Hooks para datos asignables
  const { data: assignableDrivers = [], isLoading: isLoadingDrivers } = useAssignableDrivers();
  const { data: assignableVehicles = [], isLoading: isLoadingVehicles } = useAssignableVehicles();
  const { data: assignableSupervisors = [], isLoading: isLoadingSupervisors } = useAssignableSupervisors();
  const { data: routes = [], isLoading: isLoadingRoutes } = useAllRoutes();

  // Hooks para mutaciones
  const addRouteMut = useAddRoute();
  const addTripMut = useAddTrip();

  // Formulario de ruta
  const routeForm = useForm({
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

  // Formulario de viaje
  const tripForm = useForm({
    mode: "onChange",
    defaultValues: {
      routeId: "",
      supervisorId: "",
      driverId: "",
      vehicleId: "",
    },
  });

  // Obtener ubicación actual
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const address = await reverseGeocode(latitude, longitude);
          
          const point = {
            lat: latitude,
            lng: longitude,
            name: address,
          };
          
          handleOriginChange(point);
          toast.success("Ubicación actual establecida como origen");
        } catch (error) {
          console.error("Error al obtener la dirección:", error);
          toast.error("Error al obtener la dirección de la ubicación");
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "Error al obtener tu ubicación";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permiso de ubicación denegado. Por favor, permite el acceso a tu ubicación.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Ubicación no disponible.";
            break;
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado al obtener la ubicación.";
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

  // Manejar cambios en el origen desde el mapa
  const handleOriginChange = (point) => {
    setOrigin(point);
    if (!point) {
      routeForm.setValue("originLat", null);
      routeForm.setValue("originLng", null);
      routeForm.setValue("originName", "");
      return;
    }
    if (point.lat !== null && point.lng !== null) {
      routeForm.setValue("originLat", point.lat);
      routeForm.setValue("originLng", point.lng);
    }
    if (point.name) {
      routeForm.setValue("originName", point.name);
    }
    if (point._distance !== undefined) {
      routeForm.setValue("distanceKm", point._distance);
    }
  };

  // Manejar cambios en el destino desde el mapa
  const handleDestinationChange = (point) => {
    if (!point) {
      setDestination(null);
      routeForm.setValue("destinationLat", null);
      routeForm.setValue("destinationLng", null);
      routeForm.setValue("destinationName", "");
      routeForm.setValue("distanceKm", "");
      return;
    }
    
    // Si solo cambió la distancia (_distance), no actualizar el destino completo
    if (point._distance !== undefined && destination?.lat === point.lat && destination?.lng === point.lng) {
      routeForm.setValue("distanceKm", point._distance);
      return;
    }
    
    setDestination(point);
    if (point.lat !== null && point.lng !== null) {
      routeForm.setValue("destinationLat", point.lat);
      routeForm.setValue("destinationLng", point.lng);
    }
    if (point.name) {
      routeForm.setValue("destinationName", point.name);
    }
    if (point._distance !== undefined) {
      routeForm.setValue("distanceKm", point._distance);
    }
  };

  // Crear ruta
  const onCreateRoute = async (routeData) => {
    try {
      setServerErrors({});
      
      if (!origin || !destination) {
        toast.error("Debes seleccionar origen y destino en el mapa");
        return;
      }

      const payload = {
        name: routeData.name,
        originName: routeData.originName || origin?.name || "",
        originLat: routeData.originLat || origin?.lat || 0,
        originLng: routeData.originLng || origin?.lng || 0,
        destinationName: routeData.destinationName || destination?.name || "",
        destinationLat: routeData.destinationLat || destination?.lat || 0,
        destinationLng: routeData.destinationLng || destination?.lng || 0,
        distanceKm: parseFloat(routeData.distanceKm) || 0,
        vehicleType: routeData.vehicleType,
      };

      const newRoute = await addRouteMut.mutateAsync(payload);
      toast.success("Ruta creada exitosamente", {
        description: newRoute.name || routeData.name,
      });
      
      setCreatedRouteId(newRoute.id);
      tripForm.setValue("routeId", newRoute.id.toString());
      setShowCreateRoute(false);
      
      // Limpiar formulario de ruta
      routeForm.reset();
      setOrigin(null);
      setDestination(null);
    } catch (err) {
      const fieldErrors = parseFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(getErrorDetail(err, "Error al crear la ruta"));
      }
    }
  };

  // Crear viaje
  const onCreateTrip = async (tripData) => {
    try {
      setServerErrors({});
      
      const payload = {
        routeId: parseInt(tripData.routeId),
        supervisorId: parseInt(tripData.supervisorId),
        driverId: parseInt(tripData.driverId),
        vehicleId: parseInt(tripData.vehicleId),
      };

      const result = await addTripMut.mutateAsync(payload);
      toast.success("Viaje creado exitosamente", {
        description: `Combustible estimado: ${result.fuelEstimated?.toFixed(2) || 0} L`,
      });
      
      navigate("/trips");
    } catch (err) {
      const fieldErrors = parseFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setServerErrors(fieldErrors);
      } else {
        toast.error(getErrorDetail(err, "Error al crear el viaje"));
      }
    }
  };

  // Filtrar opciones asignables (soporta camelCase y snake_case)
  const availableDrivers = (assignableDrivers || []).filter((d) => d.isAssignable || d.is_assignable);
  const availableVehicles = (assignableVehicles || []).filter((v) => v.isAssignable || v.is_assignable);
  const availableSupervisors = (assignableSupervisors || []).filter((s) => s.isAssignable || s.is_assignable);

  // Sincronizar errores del servidor con react-hook-form
  React.useEffect(() => {
    routeForm.clearErrors();
    tripForm.clearErrors();
    if (serverErrors && typeof serverErrors === "object") {
      Object.entries(serverErrors).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          routeForm.setError(field, {
            type: "server",
            message: messages[0],
          });
          tripForm.setError(field, {
            type: "server",
            message: messages[0],
          });
        }
      });
    }
  }, [serverErrors, routeForm, tripForm]);

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Nuevo viaje"
        subtitle="Crea un nuevo viaje de distribución. Puedes usar una ruta existente o crear una nueva."
        icon={Truck}
      />

      {/* Botón para crear ruta */}
      {!showCreateRoute && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateRoute(true);
              setCreatedRouteId(null);
              tripForm.setValue("routeId", "");
            }}
          >
            <Plus className="mr-2 size-4" />
            Crear nueva ruta
          </Button>
        </div>
      )}

      {/* Formulario de ruta (condicional) */}
      {showCreateRoute && (
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="size-5" />
                Crear nueva ruta
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Completa los datos de la ruta. Una vez creada, se seleccionará automáticamente.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateRoute(false);
                routeForm.reset();
                setOrigin(null);
                setDestination(null);
              }}
            >
              Cancelar
            </Button>
          </div>

          <Separator />

          {/* Mapa */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold">Selecciona origen y destino</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Obteniendo ubicación...
                  </>
                ) : (
                  <>
                    <Navigation className="mr-2 size-4" />
                    Usar mi ubicación
                  </>
                )}
              </Button>
            </div>
            <MapRoutePicker
              origin={origin}
              destination={destination}
              onOriginChange={handleOriginChange}
              onDestinationChange={handleDestinationChange}
              mode="create"
              disabled={false}
              hideDirectionsPanel={false}
            />
          </div>

          {/* Información de la ruta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="mb-1 block">Nombre de la ruta *</Label>
              <Input
                {...routeForm.register("name", {
                  required: "El nombre es obligatorio",
                  minLength: {
                    value: 3,
                    message: "Mínimo 3 caracteres",
                  },
                })}
              />
              {routeForm.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {routeForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-1 block">Origen *</Label>
              <Input
                {...routeForm.register("originName", {
                  required: "El origen es obligatorio",
                })}
                placeholder="Selecciona en el mapa..."
                disabled={!origin}
              />
              {routeForm.formState.errors.originName && (
                <p className="text-sm text-destructive mt-1">
                  {routeForm.formState.errors.originName.message}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-1 block">Destino *</Label>
              <Input
                {...routeForm.register("destinationName", {
                  required: "El destino es obligatorio",
                })}
                placeholder="Selecciona en el mapa..."
                disabled={!destination}
              />
              {routeForm.formState.errors.destinationName && (
                <p className="text-sm text-destructive mt-1">
                  {routeForm.formState.errors.destinationName.message}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-1 block">Distancia (km) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...routeForm.register("distanceKm", {
                  required: "La distancia es obligatoria",
                  min: {
                    value: 0,
                    message: "Debe ser mayor o igual a 0",
                  },
                })}
                readOnly
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Calculado automáticamente
              </p>
            </div>

            <div className="md:col-span-2">
              <Label className="mb-1 block">Tipo de vehículo *</Label>
              <Controller
                control={routeForm.control}
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
              {routeForm.formState.errors.vehicleType && (
                <p className="text-sm text-destructive mt-1">
                  {routeForm.formState.errors.vehicleType.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateRoute(false);
                routeForm.reset();
                setOrigin(null);
                setDestination(null);
              }}
              disabled={addRouteMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={routeForm.handleSubmit(onCreateRoute)}
              disabled={addRouteMut.isPending}
            >
              {addRouteMut.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Crear ruta
            </Button>
          </div>
        </div>
      )}

      {/* Formulario de viaje */}
      <div className="rounded-xl border bg-card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Route className="size-5" />
            Datos del viaje
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Selecciona la ruta, supervisor, conductor y vehículo para el viaje.
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ruta */}
          <div className="md:col-span-2">
            <Label className="mb-1 block">Ruta *</Label>
            <Controller
              control={tripForm.control}
              name="routeId"
              rules={{ required: "La ruta es obligatoria" }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingRoutes}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingRoutes ? "Cargando rutas..." : "Selecciona una ruta"} />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id.toString()}>
                        {route.name} ({route.originName} → {route.destinationName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {tripForm.formState.errors.routeId && (
              <p className="text-sm text-destructive mt-1">
                {tripForm.formState.errors.routeId.message}
              </p>
            )}
            {createdRouteId && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✓ Ruta creada y seleccionada
              </p>
            )}
          </div>

          {/* Supervisor */}
          <div>
            <Label className="mb-1 block">Supervisor *</Label>
            <Controller
              control={tripForm.control}
              name="supervisorId"
              rules={{ required: "El supervisor es obligatorio" }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingSupervisors}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingSupervisors ? "Cargando..." : "Selecciona un supervisor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSupervisors.map((supervisor) => {
                      const firstName = supervisor.firstName || supervisor.first_name || '';
                      const lastName = supervisor.lastName || supervisor.last_name || '';
                      const activeTripsCount = supervisor.activeTripsCount ?? supervisor.active_trips_count ?? 0;
                      return (
                        <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                          {firstName} {lastName}
                          {activeTripsCount !== undefined && activeTripsCount > 0 && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({activeTripsCount} viajes activos)
                            </span>
                          )}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            {tripForm.formState.errors.supervisorId && (
              <p className="text-sm text-destructive mt-1">
                {tripForm.formState.errors.supervisorId.message}
              </p>
            )}
            {availableSupervisors.length === 0 && !isLoadingSupervisors && (
              <p className="text-xs text-muted-foreground mt-1">
                No hay supervisores disponibles
              </p>
            )}
          </div>

          {/* Conductor */}
          <div>
            <Label className="mb-1 block">Conductor *</Label>
            <Controller
              control={tripForm.control}
              name="driverId"
              rules={{ required: "El conductor es obligatorio" }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingDrivers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingDrivers ? "Cargando..." : "Selecciona un conductor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map((driver) => {
                      const firstName = driver.firstName || driver.first_name || '';
                      const lastName = driver.lastName || driver.last_name || '';
                      const isAssignable = driver.isAssignable || driver.is_assignable;
                      return (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          {firstName} {lastName}
                          {!isAssignable && (
                            <span className="text-xs text-destructive ml-2">(No disponible)</span>
                          )}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            {tripForm.formState.errors.driverId && (
              <p className="text-sm text-destructive mt-1">
                {tripForm.formState.errors.driverId.message}
              </p>
            )}
            {availableDrivers.length === 0 && !isLoadingDrivers && (
              <p className="text-xs text-muted-foreground mt-1">
                No hay conductores disponibles
              </p>
            )}
          </div>

          {/* Vehículo */}
          <div>
            <Label className="mb-1 block">Vehículo *</Label>
            <Controller
              control={tripForm.control}
              name="vehicleId"
              rules={{ required: "El vehículo es obligatorio" }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingVehicles}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingVehicles ? "Cargando..." : "Selecciona un vehículo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles.map((vehicle) => {
                      const plate = vehicle.plate || '';
                      const isAssignable = vehicle.isAssignable || vehicle.is_assignable;
                      return (
                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                          {plate}
                          {!isAssignable && (
                            <span className="text-xs text-destructive ml-2">(No disponible)</span>
                          )}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            {tripForm.formState.errors.vehicleId && (
              <p className="text-sm text-destructive mt-1">
                {tripForm.formState.errors.vehicleId.message}
              </p>
            )}
            {availableVehicles.length === 0 && !isLoadingVehicles && (
              <p className="text-xs text-muted-foreground mt-1">
                No hay vehículos disponibles
              </p>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/trips")}
            disabled={addTripMut.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={tripForm.handleSubmit(onCreateTrip)}
            disabled={addTripMut.isPending}
          >
            {addTripMut.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Crear viaje
          </Button>
        </div>
      </div>
    </div>
  );
}

