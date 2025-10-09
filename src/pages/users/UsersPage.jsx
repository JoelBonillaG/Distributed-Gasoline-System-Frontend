import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/shadcn/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/shadcn/dialog";
import DataTable from "@/components/ui/table/data-table";
import UserForm from "@/components/users/UserForm";
import { PageHeading } from "@/components/ui/typography/Heading";
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
import {
    Eye,
    Pencil,
    Plus,
    Trash2,
    Undo2,
    UserRound,
    UserX2,
} from "lucide-react";
import { toast } from "sonner";
import {
    useAddUser,
    useAllUsers,
    useInactiveUsers,
    useRestoreUser,
    useDeleteUser,
    useUpdateUser,
} from "@/hooks/use-users";
import {
    getErrorDetail,
    parseFieldErrors,
} from "@/services/users.service";
import { getUserEmail } from "@/utils/auth";

const ALLOWED_ROLE_NAMES = new Set(["ADMIN", "SUPERVISOR"]);
const ALLOWED_ROLE_IDS = new Set([1, 2]);

export default function UsersPage() {
    const [formOpen, setFormOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [serverErrors, setServerErrors] = useState({});
    const [editingUser, setEditingUser] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showDeleted, setShowDeleted] = useState(false);

    const currentUserEmail = useMemo(() => {
        const email = getUserEmail();
        return typeof email === "string" ? email.toLowerCase() : null;
    }, []);

    const shouldIncludeUser = useCallback(
        (user) => {
            if (!user) return false;

            if (currentUserEmail) {
                const email = String(user.email ?? "").toLowerCase();
                if (email === currentUserEmail) {
                    return false;
                }
            }

            const byId = (() => {
                if (user.roleId != null && ALLOWED_ROLE_IDS.has(Number(user.roleId))) {
                    return true;
                }
                if (Array.isArray(user.roleIds)) {
                    return user.roleIds.some((id) => ALLOWED_ROLE_IDS.has(Number(id)));
                }
                return false;
            })();

            const normalizeName = (value) => String(value ?? "").toUpperCase();

            const byNameFromRoles = Array.isArray(user.roles)
                ? user.roles.some((role) =>
                      ALLOWED_ROLE_NAMES.has(
                          normalizeName(role?.name ?? role?.roleName ?? role?.code ?? role)
                      )
                  )
                : false;

            const byNameFallback = user.roleName
                ? ALLOWED_ROLE_NAMES.has(normalizeName(user.roleName))
                : false;

            return byId || byNameFromRoles || byNameFallback;
        },
        [currentUserEmail]
    );

    const {
        data: activeUsersData,
        isLoading: isLoadingActive,
        isError: isErrorActive,
        error: errorActive,
        refetch: refetchActive,
    } = useAllUsers();
    const {
        data: inactiveUsersData,
        isLoading: isLoadingInactive,
        isError: isErrorInactive,
        error: errorInactive,
        refetch: refetchInactive,
    } = useInactiveUsers({ enabled: showDeleted });
    const addMut = useAddUser();
    const updateMut = useUpdateUser(editingUser?.userId ?? editingUser?.id);
    const deleteMut = useDeleteUser();
    const restoreMut = useRestoreUser();

    const activeUsers = useMemo(
        () =>
            (activeUsersData ?? [])
                .filter((user) => shouldIncludeUser(user))
                .map((user) => ({
                    ...user,
                    id: user.userId ?? user.id,
                    roleId: user.roles?.[0]?.roleId ?? null,
                    roleName: user.roles?.[0]?.name ?? "—",
                })),
        [activeUsersData, shouldIncludeUser]
    );

    const inactiveUsers = useMemo(
        () =>
            (inactiveUsersData ?? [])
                .filter((user) => shouldIncludeUser(user))
                .map((user) => ({
                    ...user,
                    id: user.userId ?? user.id,
                    roleId: user.roles?.[0]?.roleId ?? null,
                    roleName: user.roles?.[0]?.name ?? "—",
                })),
        [inactiveUsersData, shouldIncludeUser]
    );

    const tableData = useMemo(() => {
        const source = showDeleted ? inactiveUsers : activeUsers;
        return Array.isArray(source) ? source : [];
    }, [showDeleted, inactiveUsers, activeUsers]);

    const currentLoading = showDeleted ? isLoadingInactive : isLoadingActive;
    const currentError = showDeleted ? errorInactive : errorActive;
    const currentIsError = showDeleted ? isErrorInactive : isErrorActive;

    const resetModalStates = useCallback(() => {
        setEditingUser(null);
        setSelectedUser(null);
        setServerErrors({});
        setUserToDelete(null);
    }, []);

    const columns = useMemo(() => {
        const baseColumns = [
            {
                accessorKey: "id",
                header: "ID",
                size: 80,
            },
            {
                accessorKey: "firstName",
                header: "Nombre",
            },
            {
                accessorKey: "lastName",
                header: "Apellido",
            },
            {
                accessorKey: "email",
                header: "Correo",
            },
            {
                accessorKey: "phone",
                header: "Teléfono",
            },
            {
                accessorKey: "username",
                header: "Usuario",
            },
            {
                accessorKey: "roleName",
                header: "Rol",
                cell: ({ row }) => row.original.roleName ?? row.original.roles?.[0]?.name ?? "—",
            },
        ];

        return baseColumns;
    }, [showDeleted]);

    const rowActions = useCallback(
        (row) => {
            const user = row.original;

            if (showDeleted) {
                return (
                    <div className="flex gap-1 justify-end">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                                setSelectedUser(user);
                                setViewOpen(true);
                            }}
                            title="Ver"
                        >
                            <Eye className="size-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={async () => {
                                try {
                                    await restoreMut.mutateAsync(user.userId ?? user.id);
                                    toast.success("Usuario reactivado", {
                                        description: `ID ${user.userId ?? user.id}`,
                                    });
                                    refetchInactive?.();
                                    refetchActive?.();
                                } catch (err) {
                                    toast.error(getErrorDetail(err, "Error al restaurar"));
                                }
                            }}
                            title="Restaurar"
                        >
                            <Undo2 className="size-4" />
                        </Button>
                    </div>
                );
            }

            return (
                <div className="flex gap-1 justify-end">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                            setSelectedUser(user);
                            setViewOpen(true);
                        }}
                        title="Ver"
                    >
                        <Eye className="size-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                            setEditingUser({
                                ...user,
                                roleId: user.roleId ?? user.roles?.[0]?.roleId ?? null,
                            });
                            setFormOpen(true);
                        }}
                        title="Editar"
                    >
                        <Pencil className="size-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                            setUserToDelete(user);
                            setConfirmOpen(true);
                        }}
                        title="Eliminar"
                    >
                        <Trash2 className="size-4 text-destructive" />
                    </Button>
                </div>
            );
        },
        [showDeleted, restoreMut, refetchActive, refetchInactive]
    );

    const handleSave = useCallback(
        async (values) => {
            const payload = {
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                phone: values.phone,
                username: values.username,
                roleIds: values.roleId ? [Number(values.roleId)] : [],
            };

            if (!editingUser) {
                payload.password = values.password;
            }

            try {
                setServerErrors({});
                if (editingUser) {
                    await updateMut.mutateAsync(payload);
                    toast.success("Usuario actualizado");
                } else {
                    await addMut.mutateAsync(payload);
                    toast.success("Usuario creado");
                }
                setFormOpen(false);
                resetModalStates();
                refetchActive();
                if (showDeleted) {
                    refetchInactive?.();
                }
            } catch (err) {
                const fieldErrors = parseFieldErrors(err);
                if (Object.keys(fieldErrors).length > 0) {
                    setServerErrors(fieldErrors);
                } else {
                    toast.error(getErrorDetail(err, "No se pudo guardar el usuario"));
                }
            }
        },
        [
            addMut,
            editingUser,
            refetchActive,
            refetchInactive,
            resetModalStates,
            showDeleted,
            updateMut,
        ]
    );

    return (
        <div className="space-y-6 p-6">
            <PageHeading
                title="Usuarios del sistema"
                subtitle="Administra las cuentas, roles y estado de los usuarios."
                icon={UserRound}
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant={showDeleted ? "outline" : "secondary"}
                            size="icon"
                            onClick={() => setShowDeleted((prev) => !prev)}
                            title={
                                showDeleted
                                    ? "Ver usuarios activos"
                                    : "Ver usuarios dados de baja"
                            }
                        >
                            {showDeleted ? <UserRound className="size-4" /> : <UserX2 className="size-4" />}
                        </Button>
                        <Button
                            onClick={() => {
                                resetModalStates();
                                setFormOpen(true);
                            }}
                        >
                            <Plus className="mr-2 size-4" />
                            Nuevo usuario
                        </Button>
                    </div>
                }
            />

            <div className="rounded-xl border bg-card">
                <div className="px-4 pt-3">
                    
                </div>

                <div className="p-4 pt-1">
                    {currentLoading ? (
                        <div className="text-sm text-muted-foreground">Cargando usuarios…</div>
                    ) : currentIsError ? (
                        <div className="text-sm text-destructive">
                            {currentError?.message || "Error al cargar"}
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={tableData}
                            rowActions={rowActions}
                            emptyMessage={showDeleted ? "Sin usuarios eliminados" : "Sin usuarios"}
                        />
                    )}
                </div>
            </div>

            <Dialog
                open={formOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        resetModalStates();
                    }
                    setFormOpen(open);
                }}
            >
                <DialogContent className="max-w-lg w-full">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? "Editar usuario" : "Nuevo usuario"}
                        </DialogTitle>
                    </DialogHeader>
                    <UserForm
                        defaultValues={editingUser}
                        onSubmit={handleSave}
                        serverErrors={serverErrors}
                        formId="user-form"
                    />
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setFormOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" form="user-form">
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="max-w-lg w-full">
                    <DialogHeader>
                        <DialogTitle>Detalle del usuario</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        {selectedUser ? (
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                                <dt className="text-xs font-medium text-muted-foreground">Nombre</dt>
                                <dd className="text-sm">{selectedUser.firstName}</dd>
                                <dt className="text-xs font-medium text-muted-foreground">Apellido</dt>
                                <dd className="text-sm">{selectedUser.lastName}</dd>
                                <dt className="text-xs font-medium text-muted-foreground">Correo</dt>
                                <dd className="text-sm">{selectedUser.email}</dd>
                                <dt className="text-xs font-medium text-muted-foreground">Teléfono</dt>
                                <dd className="text-sm">{selectedUser.phone}</dd>
                                <dt className="text-xs font-medium text-muted-foreground">Usuario</dt>
                                <dd className="text-sm">{selectedUser.username}</dd>
                                <dt className="text-xs font-medium text-muted-foreground">Rol</dt>
                                <dd className="text-sm">
                                    {Array.isArray(selectedUser.roles) && selectedUser.roles.length > 0
                                        ? selectedUser.roles.map((r) => r.name).join(", ")
                                        : selectedUser.roleName ?? "—"}
                                </dd>
                            </dl>
                        ) : (
                            <p className="text-sm text-muted-foreground">Selecciona un usuario.</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setViewOpen(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {userToDelete
                                ? `Esta acción deshabilitará a ${userToDelete.firstName} ${userToDelete.lastName}.`
                                : "Esta acción no se puede deshacer."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (!userToDelete) return;
                                try {
                                    await deleteMut.mutateAsync(userToDelete.userId ?? userToDelete.id);
                                    toast.success("Usuario eliminado", {
                                        description: `ID ${userToDelete.userId ?? userToDelete.id}`,
                                    });
                                    setConfirmOpen(false);
                                    resetModalStates();
                                    refetchActive();
                                    refetchInactive?.();
                                } catch (err) {
                                    toast.error(getErrorDetail(err, "Error al eliminar"));
                                }
                            }}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
