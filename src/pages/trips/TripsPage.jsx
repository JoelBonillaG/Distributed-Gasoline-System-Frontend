import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeading } from "@/components/ui/typography/Heading";
import { Button } from "@/components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/shadcn/dropdown-menu";
import TripCard from "@/components/trips/TripCard";
import { useAllTrips } from "@/hooks/use-trips";
import { Loader2, Plus, Truck, AlertCircle, ChevronDown, GripVertical } from "lucide-react";

// Configuración de columnas por estado
const TRIP_COLUMNS = [
  {
    status: 1,
    label: "Creados",
    color: "border-gray-300",
    bgColor: "bg-gray-50/50",
    dotColor: "bg-gray-500",
  },
  {
    status: 2,
    label: "En Ruta",
    color: "border-blue-300",
    bgColor: "bg-blue-50/30",
    dotColor: "bg-blue-500",
  },
  {
    status: 3,
    label: "En Revisión",
    color: "border-orange-300",
    bgColor: "bg-orange-50/30",
    dotColor: "bg-orange-500",
  },
  {
    status: 4,
    label: "Terminados",
    color: "border-green-300",
    bgColor: "bg-green-50/30",
    dotColor: "bg-green-500",
  },
];

// Mapear label a backend key
const getBackendKey = (label) => {
  const map = {
    "Creados": "CREADO",
    "En Ruta": "EN_RUTA",
    "En Revisión": "EN_REVISION",
    "Terminados": "TERMINADO",
  };
  return map[label] || "CREADO";
};

const INITIAL_CARDS_LIMIT = 3;

export default function TripsPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, isError } = useAllTrips();

  // Estado para columnas visibles
  const [visibleColumns, setVisibleColumns] = useState({
    Creados: true,
    "En Ruta": true,
    "En Revisión": true,
    Terminados: true,
  });

  // Estado para límite de cards por columna (lazy loading)
  const [cardsLimit, setCardsLimit] = useState({
    Creados: 3,
    "En Ruta": 3,
    "En Revisión": 3,
    Terminados: 3,
  });

  // Estado para orden de las cards por columna
  const [sortedTrips, setSortedTrips] = useState({});

  // Refs para drag and drop
  const draggedCardRef = useRef(null);
  const draggedFromColumnRef = useRef(null);

  // Manejar clic en "Ver detalles"
  const handleViewTrip = (trip) => {
    navigate(`/trips/view/${trip.id}`);
  };

  // Inicializar y actualizar sortedTrips cuando se cargan los datos
  useEffect(() => {
    if (data) {
      const initial = {};
      const initialLimits = {};
      TRIP_COLUMNS.forEach((col) => {
        const key = getBackendKey(col.label);
        // Los datos del backend ya vienen ordenados DESC por fecha de creación
        initial[col.label] = data.trips?.[key] || [];
        initialLimits[col.label] = INITIAL_CARDS_LIMIT;
      });
      setSortedTrips(initial);
      setCardsLimit(initialLimits);
    }
  }, [data]);

  // Función para mostrar más cards
  const handleShowMore = (columnLabel) => {
    setCardsLimit((prev) => ({
      ...prev,
      [columnLabel]: (prev[columnLabel] || INITIAL_CARDS_LIMIT) + INITIAL_CARDS_LIMIT,
    }));
  };

  // Manejar inicio del drag
  const handleDragStart = (trip, columnLabel) => {
    draggedCardRef.current = trip;
    draggedFromColumnRef.current = columnLabel;
  };

  // Manejar drop
  const handleDrop = (targetColumn, targetIndex) => {
    if (!draggedCardRef.current || !draggedFromColumnRef.current) return;

    const fromColumn = draggedFromColumnRef.current;
    if (fromColumn !== targetColumn) return; // Solo permitir mover dentro de la misma columna

    const currentTrips = [...sortedTrips[fromColumn]];
    const draggedIndex = currentTrips.findIndex(
      (t) => t.id === draggedCardRef.current.id
    );

    // Evitar operaciones innecesarias
    if (draggedIndex === -1) {
      draggedCardRef.current = null;
      draggedFromColumnRef.current = null;
      return;
    }

    // Reordenar
    const [draggedTrip] = currentTrips.splice(draggedIndex, 1);
    currentTrips.splice(targetIndex, 0, draggedTrip);

    setSortedTrips({
      ...sortedTrips,
      [fromColumn]: currentTrips,
    });

    draggedCardRef.current = null;
    draggedFromColumnRef.current = null;
  };

  // Contar columnas visibles
  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
  const isSingleColumn = visibleCount === 1;

  // Obtener columnas activas
  const activeColumns = TRIP_COLUMNS.filter(
    (col) => visibleColumns[col.label]
  );

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Viajes del sistema"
        subtitle="Administra y monitorea los viajes de distribución en tiempo real."
        icon={Truck}
        actions={
          <div className="flex items-center gap-2">
            {/* Dropdown para seleccionar columnas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Columnas
                  <ChevronDown className="ml-2 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
                {TRIP_COLUMNS.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.label}
                    checked={visibleColumns[col.label]}
                    onCheckedChange={(checked) => {
                      setVisibleColumns((prev) => ({
                        ...prev,
                        [col.label]: checked,
                      }));
                    }}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => navigate("/trips/create")}>
              <Plus className="mr-2 size-4" />
              Nuevo viaje
            </Button>
          </div>
        }
      />

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="size-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando viajes...</p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-destructive" />
            <div>
              <h3 className="font-semibold text-destructive">
                Error al cargar viajes
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {error?.message || "No se pudieron cargar los viajes"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid de columnas Kanban */}
      {!isLoading && !isError && data && Object.keys(sortedTrips).length > 0 && (
        <div
          className={`grid gap-4 ${
            isSingleColumn 
              ? `grid-cols-1` 
              : visibleCount === 2
              ? `grid-cols-1 md:grid-cols-2`
              : visibleCount === 3
              ? `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
              : `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
          }`}
        >
          {activeColumns.map((column) => {
            // Mapear el label a la clave del backend
            const backendKey = getBackendKey(column.label);
            
            // Obtener los viajes para esta columna (usar sortedTrips si existe)
            const trips = sortedTrips[column.label] || [];
            const visibleTrips = trips.slice(0, cardsLimit[column.label]);
            const remaining = trips.length - visibleTrips.length;
            
            return (
              <div
                key={column.status}
                className={`flex flex-col rounded-xl border-2 p-4 ${
                  isSingleColumn ? "min-h-[400px]" : "min-h-[600px]"
                }`}
              >
                {/* Header de columna */}
                <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-background/95 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${column.dotColor}`} />
                    <h3 className="font-semibold">{column.label}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {trips.length}
                    </span>
                  </div>
                </div>

                {/* Lista de cards */}
                <div
                  className={`flex-1 overflow-y-auto ${
                    isSingleColumn && trips.length > 1
                      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 auto-rows-max"
                      : visibleCount === 2 && trips.length > 3
                      ? "grid grid-cols-1 sm:grid-cols-2 gap-3 auto-rows-max"
                      : visibleCount === 3 && trips.length > 4
                      ? "grid grid-cols-1 sm:grid-cols-2 gap-3 auto-rows-max"
                      : "space-y-3"
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const index = parseInt(e.currentTarget.getAttribute('data-drop-index') || '0', 10);
                    handleDrop(column.label, index);
                  }}
                >
                  {visibleTrips.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center w-full">
                      <AlertCircle className="size-8 text-muted-foreground mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        No hay viajes {column.label.toLowerCase()}
                      </p>
                    </div>
                  ) : (
                    visibleTrips.map((trip, index) => {
                      const isGridLayout = (isSingleColumn && trips.length > 1) || 
                                          (visibleCount === 2 && trips.length > 3) || 
                                          (visibleCount === 3 && trips.length > 4);
                      
                      return (
                        <div
                          key={trip.id}
                          draggable
                          onDragStart={() => handleDragStart(trip, column.label)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDrop(column.label, index);
                          }}
                          data-drop-index={index}
                          className={isGridLayout ? "w-full" : "w-full"}
                        >
                          <div className="relative group h-full">
                            <TripCard
                              trip={trip}
                              onView={handleViewTrip}
                            />
                            <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 cursor-move transition-opacity pointer-events-none">
                              <GripVertical className="size-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Botón "Ver más" si hay más cards */}
                {remaining > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => handleShowMore(column.label)}
                    >
                      Ver {remaining} más
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
