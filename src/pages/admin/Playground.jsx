import React from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Switch } from "@/components/ui/shadcn/switch";
import { Button } from "@/components/ui/shadcn/button";
import { Separator } from "@/components/ui/shadcn/separator";
import { Badge } from "@/components/ui/shadcn/badge";
import { Progress } from "@/components/ui/shadcn/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/shadcn/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/shadcn/dialog";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/shadcn/alert-dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/shadcn/sheet";
import { Combobox } from "@/components/ui/inputs/combobox";
import DataTable from "@/components/ui/table/data-table";
import {
    Eye,
    Pencil,
    Trash2,
    Plus,
    RefreshCcw,
    CheckCircle2,
    Building2,
    MapPin,
    CalendarClock,
} from "lucide-react";
import { PageHeading, SectionHeading, SubSectionHeading } from "@/components/ui/typography/Heading";

const cities = ["Ambato", "Quito", "Cuenca", "Guayaquil", "Loja", "Manta"];
const specialties = ["Cardiología", "Neurología", "Pediatría", "Trauma", "Oncología", "Dermatología"];

function makeMedicalCenters(n = 57) {
    const out = [];
    for (let i = 1; i <= n; i++) {
        const c = cities[i % cities.length];
        out.push({
            id: i,
            name: `Centro Médico ${i}`,
            city: c,
            address: `Calle ${i} y Av. ${((i * 7) % 25) + 1}`,
            createdAt: new Date(2025, i % 12, ((i * 3) % 28) + 1).toISOString(),
            updatedAt: new Date(2025, i % 12, ((i * 5) % 28) + 1).toISOString(),
        });
    }
    return out;
}

const MC_DATA = makeMedicalCenters();

const MC_COLUMNS = [
    { accessorKey: "id", header: "ID", size: 80, cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span> },
    { accessorKey: "name", header: "Nombre", cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: "city", header: "Ciudad", cell: ({ row }) => row.original.city },
    { accessorKey: "address", header: "Dirección", cell: ({ row }) => <span className="text-muted-foreground">{row.original.address}</span> },
    { accessorKey: "createdAt", header: "Creado", size: 120, cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() },
    { accessorKey: "updatedAt", header: "Actualizado", size: 120, cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString() },
];

function Playground() {
    const [enabled, setEnabled] = React.useState(true);
    const [query, setQuery] = React.useState("");
    const specialtyOptions = specialties.map((s) => ({ value: s.toLowerCase(), label: s }));
    const [selectedSpec, setSelectedSpec] = React.useState(specialtyOptions[0].value);

    const [rows, setRows] = React.useState(MC_DATA);
    const [selectedRows, setSelectedRows] = React.useState([]);

    const [viewOpen, setViewOpen] = React.useState(false);
    const [viewItem, setViewItem] = React.useState(null);

    const [editOpen, setEditOpen] = React.useState(false);
    const [editItem, setEditItem] = React.useState(null);
    const [editForm, setEditForm] = React.useState({ name: "", city: "", address: "" });

    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [confirmItem, setConfirmItem] = React.useState(null);

    const [bulkOpen, setBulkOpen] = React.useState(false);

    const handleCreate = () => {
        const nextId = Math.max(...rows.map((r) => r.id)) + 1;
        const newRow = {
            id: nextId,
            name: `Centro Médico ${nextId}`,
            city: cities[Math.floor(Math.random() * cities.length)],
            address: `Calle ${nextId} y Av. ${(nextId % 10) + 1}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setRows((prev) => [newRow, ...prev]);
        toast.success("Centro creado", { description: `ID ${nextId}` });
    };

    const handleReset = () => {
        setRows(MC_DATA);
        toast.success("Datos restablecidos");
    };

    const openView = (item) => {
        setViewItem(item);
        setViewOpen(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setEditForm({ name: item.name, city: item.city, address: item.address });
        setEditOpen(true);
    };

    const openDelete = (item) => {
        setConfirmItem(item);
        setConfirmOpen(true);
    };

    const submitEdit = () => {
        setRows((prev) =>
            prev.map((r) =>
                r.id === editItem.id ? { ...r, ...editForm, updatedAt: new Date().toISOString() } : r
            )
        );
        setEditOpen(false);
        toast.success("Centro actualizado", { description: editForm.name });
    };

    const submitDelete = () => {
        setRows((prev) => prev.filter((r) => r.id !== confirmItem.id));
        setConfirmOpen(false);
        toast.success("Eliminado", { description: `ID ${confirmItem.id}` });
    };

    const submitBulkDelete = () => {
        const ids = new Set(selectedRows.map((r) => r.original?.id ?? r.id));
        setRows((prev) => prev.filter((r) => !ids.has(r.id)));
        setBulkOpen(false);
        setSelectedRows([]);
        toast.success("Eliminación masiva completada");
    };

    const rowActions = (row) => {
        const item = row.original;
        return (
            <>
                <Button size="icon" variant="ghost" onClick={() => openView(item)} title="Ver">
                    <Eye className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openEdit(item)} title="Editar">
                    <Pencil className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openDelete(item)} title="Eliminar">
                    <Trash2 className="size-4 text-destructive" />
                </Button>
            </>
        );
    };

    const total = rows.length;
    const ciudadesCobertura = new Set(rows.map((r) => r.city)).size;
    const coberturaPct = Math.round((ciudadesCobertura / cities.length) * 100);

    return (
        <div className="space-y-6">
            <PageHeading
                title="Playground UI"
                subtitle="Componentes, patrones y estados útiles para desarrollar más rápido."
                actions={
                    <>
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 size-4" />
                            Nuevo centro
                        </Button>
                        <Button variant="outline" onClick={handleReset}>
                            <RefreshCcw className="mr-2 size-4" />
                            Reset mock
                        </Button>
                    </>
                }
            />

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Centros totales</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between">
                        <div className="text-3xl font-semibold tabular-nums">{total}</div>
                        <Badge className="gap-1">
                            <Building2 className="size-3" />
                            activos
                        </Badge>
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground">
                        Dataset de ejemplo
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Cobertura de ciudades</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span>{ciudadesCobertura} / {cities.length}</span>
                            <span className="tabular-nums">{coberturaPct}%</span>
                        </div>
                        <Progress value={coberturaPct} />
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground">
                        Muestra distribuida
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Última actualización</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2">
                        <CalendarClock className="size-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Cambios simulados al editar</span>
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground">
                        Mantén consistencia de timestamps
                    </CardFooter>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Formulario rápido</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="q">Buscar</Label>
                            <Input
                                id="q"
                                placeholder="Escribe algo…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="text-sm font-medium leading-none">Estado</div>
                                <div className="text-xs text-muted-foreground">Activa o desactiva la opción</div>
                            </div>
                            <Switch checked={enabled} onCheckedChange={setEnabled} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Especialidad</Label>
                            <Combobox options={specialtyOptions} value={selectedSpec} onChange={setSelectedSpec} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex items-center gap-2">
                        <Button
                            onClick={() =>
                                toast.success("Acción ejecutada", {
                                    description: `query="${query}" · enabled=${enabled} · spec=${selectedSpec}`,
                                })
                            }
                        >
                            Probar toast
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setQuery("");
                                setEnabled(true);
                                setSelectedSpec(specialtyOptions[0].value);
                            }}
                        >
                            Limpiar
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Estados y alertas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge>Default</Badge>
                            <Badge variant="secondary">Secondary</Badge>
                            <Badge variant="destructive">Danger</Badge>
                            <Badge variant="outline">Outline</Badge>
                            <Badge className="gap-1">
                                <CheckCircle2 className="size-3" />
                                Success
                            </Badge>
                        </div>

                        <Alert>
                            <AlertTitle>Información</AlertTitle>
                            <AlertDescription>Este es un ejemplo de alerta informativa.</AlertDescription>
                        </Alert>

                        <Alert variant="destructive">
                            <AlertTitle>Atención</AlertTitle>
                            <AlertDescription>Ejemplo de error o validación fallida.</AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                size="sm"
                                onClick={() => {
                                    if (selectedRows.length === 0) {
                                        toast("Nada seleccionado", { description: "Selecciona filas para continuar." });
                                    } else {
                                        setBulkOpen(true);
                                    }
                                }}
                            >
                                Eliminar seleccionados
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => toast.info("Acción secundaria")}>
                                Acción secundaria
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <CardHeader className="flex flex-col gap-1">
                    <CardTitle>Centros médicos</CardTitle>
                    <div className="text-sm text-muted-foreground">
                        Búsqueda global, orden, paginación, selección y acciones por fila.
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={MC_COLUMNS}
                        data={rows}
                        initialPageSize={10}
                        selectable
                        searchable
                        rowActions={rowActions}
                        onSelectionChange={setSelectedRows}
                        emptyMessage="No hay centros"
                        className="pt-2"
                    />
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                    Seleccionadas: {selectedRows.length}
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Vista compacta</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground mb-3">
                        Mismo dataset con densidad reducida.
                    </div>
                    <div className="text-xs">
                        <DataTable
                            columns={MC_COLUMNS}
                            data={rows.slice(0, 15)}
                            initialPageSize={5}
                            searchable={false}
                            selectable={false}
                            rowActions={rowActions}
                            emptyMessage="Sin datos"
                            className="[&_th]:py-2 [&_td]:py-2"
                        />
                    </div>
                </CardContent>
            </Card>

            <Sheet open={viewOpen} onOpenChange={setViewOpen}>
                <SheetContent className="w-[420px] sm:w-[520px]">
                    <SheetHeader>
                        <SheetTitle>Vista rápida</SheetTitle>
                        <SheetDescription>Detalle resumido del centro seleccionado.</SheetDescription>
                    </SheetHeader>
                    {viewItem ? (
                        <div className="mt-4 space-y-4">
                            <div className="text-lg font-medium">{viewItem.name}</div>
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="size-4 text-muted-foreground" />
                                <span>{viewItem.city}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">{viewItem.address}</div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-muted-foreground">Creado</div>
                                    <div className="font-medium">
                                        {new Date(viewItem.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Actualizado</div>
                                    <div className="font-medium">
                                        {new Date(viewItem.updatedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                    <SheetFooter className="mt-6">
                        <Button variant="secondary" onClick={() => setViewOpen(false)}>
                            Cerrar
                        </Button>
                        <Button onClick={() => { setViewOpen(false); openEdit(viewItem); }}>
                            Editar
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar centro</DialogTitle>
                        <DialogDescription>Actualiza los datos del centro seleccionado.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={editForm.name}
                                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="city">Ciudad</Label>
                            <Combobox
                                options={cities.map((c) => ({ value: c, label: c }))}
                                value={editForm.city}
                                onChange={(v) => setEditForm((f) => ({ ...f, city: v }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Input
                                id="address"
                                value={editForm.address}
                                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setEditOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={submitEdit}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar centro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={submitDelete}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={bulkOpen} onOpenChange={setBulkOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar seleccionados</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminarán {selectedRows.length} registros.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={submitBulkDelete}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default Playground;
