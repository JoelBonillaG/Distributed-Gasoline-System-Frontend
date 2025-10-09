import React from "react";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/shadcn/input";
import { Button } from "@/components/ui/shadcn/button";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/shadcn/table";

/**
 * DataTable - Wrapper de TanStack Table con shadcn/ui
 *
 * Props:
 * - columns: ColumnDef[] (TanStack)  -> [{ accessorKey, header, cell, ... }]
 * - data: any[]                      -> filas
 * - initialPageSize?: number         -> tamaño de página inicial (10)
 * - searchable?: boolean             -> muestra input de búsqueda global (true)
 * - globalFilterFn?: (row, columnId, filterValue) => boolean  -> filtro global custom
 * - selectable?: boolean             -> agrega columna de selección (false)
 * - onSelectionChange?: (rows) => void -> callback cuando cambia selección
 * - rowActions?: (row) => ReactNode  -> renderiza acciones por fila al final
 * - emptyMessage?: string            -> mensaje cuando no hay filas
 * - className?: string               -> clases extra del contenedor
 *
 * Uso mínimo:
 *  <DataTable columns={columns} data={data} />
 */
export default function DataTable({
                                      columns,
                                      data,
                                      initialPageSize = 10,
                                      searchable = true,
                                      globalFilterFn,
                                      selectable = false,
                                      onSelectionChange,
                                      rowActions,
                                      emptyMessage = "Sin datos",
                                      className,
                                      onRowClick,
                                  }) {
    const [sorting, setSorting] = React.useState([]);
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [rowSelection, setRowSelection] = React.useState({});

    // Columna de selección opcional
    const selectionColumn = React.useMemo(
        () =>
            selectable
                ? [
                    {
                        id: "__select__",
                        header: ({ table }) => (
                            <Checkbox
                                checked={
                                    table.getIsAllPageRowsSelected() ||
                                    (table.getIsSomePageRowsSelected() && "indeterminate")
                                }
                                onCheckedChange={(value) =>
                                    table.toggleAllPageRowsSelected(!!value)
                                }
                                aria-label="Seleccionar página"
                            />
                        ),
                        cell: ({ row }) => (
                            <Checkbox
                                checked={row.getIsSelected()}
                                onCheckedChange={(value) => row.toggleSelected(!!value)}
                                aria-label="Seleccionar fila"
                            />
                        ),
                        enableSorting: false,
                        enableHiding: false,
                        size: 48,
                    },
                ]
                : [],
        [selectable]
    );

    // Columna de acciones opcional (al final)
    const actionsColumn = React.useMemo(
        () =>
            rowActions
                ? [
                    {
                        id: "__actions__",
                        header: () => <span className="sr-only">Acciones</span>,
                        cell: ({ row }) => (
                            <div className="flex items-center justify-end gap-2">
                                {rowActions(row)}
                            </div>
                        ),
                        enableSorting: false,
                        enableHiding: false,
                        size: 120,
                    },
                ]
                : [],
        [rowActions]
    );

    const allColumns = React.useMemo(
        () => [...selectionColumn, ...columns, ...actionsColumn],
        [selectionColumn, columns, actionsColumn]
    );

    const table = useReactTable({
        data,
        columns: allColumns,
        state: {
            sorting,
            globalFilter,
            rowSelection,
        },
        onSortingChange: setSorting,
        onRowSelectionChange: (updater) => {
            setRowSelection((prev) => {
                const next =
                    typeof updater === "function" ? updater(prev) : updater ?? {};
                if (onSelectionChange) {
                    const selected = table
                        .getRowModel()
                        .rows.filter((r) => next[r.id])
                        .map((r) => r.original);
                    onSelectionChange(selected);
                }
                return next;
            });
        },
        globalFilterFn:
            globalFilterFn ||
            ((row, _columnId, value) => {
                // Búsqueda simple: intenta matchear en string de toda la fila
                const haystack = JSON.stringify(row.original).toLowerCase();
                return haystack.includes(String(value).toLowerCase());
            }),
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: { pageSize: initialPageSize },
        },
    });

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {/* Toolbar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {searchable ? (
                    <div className="w-full sm:w-80">
                        <Input
                            placeholder="Buscar…"
                            value={globalFilter ?? ""}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                        />
                    </div>
                ) : (
                    <div />
                )}

                {/* Controles rápidos */}
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-centxer gap-2">
                        <span className="text-sm text-muted-foreground">Filas</span>
                        <select
                            className="h-9 rounded-md border bg-background px-2 text-sm"
                            value={table.getState().pagination.pageSize}
                            onChange={(e) => table.setPageSize(Number(e.target.value))}
                        >
                            {[5, 10, 20, 50, 100].map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.resetSorting()}
                        >
                           Restablecer orden
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setGlobalFilter("");
                                table.resetColumnFilters();
                            }}
                        >
                            Limpiar filtros
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="rounded-xl border bg-card">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => {
                                    const canSort = header.column.getCanSort();
                                    const metaSize = header.column.columnDef.size;
                                    return (
                                        <TableHead
                                            key={header.id}
                                            style={metaSize ? { width: metaSize } : undefined}
                                        >
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={cn(
                                                        "flex items-center gap-1",
                                                        canSort && "cursor-pointer select-none"
                                                    )}
                                                    onClick={
                                                        canSort
                                                            ? header.column.getToggleSortingHandler()
                                                            : undefined
                                                    }
                                                    title={
                                                        canSort
                                                            ? "Clic para ordenar. Shift + clic para multi-sort."
                                                            : undefined
                                                    }
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {canSort && (
                                                        <SortIndicator
                                                            dir={header.column.getIsSorted()}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() ? "selected" : undefined}
                                    onClick={() => onRowClick?.(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={allColumns.length} className="h-24 text-center">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Paginación */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                    Página {table.getState().pagination.pageIndex + 1} de{" "}
                    {table.getPageCount() || 1} ·{" "}
                    {table.getFilteredRowModel().rows.length} fila(s)
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        « Primera
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        ‹ Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Siguiente ›
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        Última »
                    </Button>
                </div>
            </div>
        </div>
    );
}

function SortIndicator({ dir }) {
    if (!dir) return <span className="text-muted-foreground">↕</span>;
    if (dir === "asc") return <span>↑</span>;
    if (dir === "desc") return <span>↓</span>;
    return null;
}
