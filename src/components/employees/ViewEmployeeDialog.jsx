// ViewEmployeeDialog.jsx
import React from "react";
import { Button } from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/shadcn/dialog";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";

export default function ViewEmployeeDialog({
  open,
  onOpenChange,
  employee = {},
}) {
  // Si no hay empleado, no renderizamos nada dentro
  if (!employee) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full space-y-4">
        <DialogHeader>
          <DialogTitle>Información del usuario</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {/* ID */}
          <div>
            <Label className="mb-1 block">ID</Label>
            <Input value={employee.id || ""} disabled />
          </div>

          {/* Usuario */}
          <div>
            <Label className="mb-1 block">Usuario</Label>
            <Input value={employee.username || ""} disabled />
          </div>

          {/* Nombre */}
          <div>
            <Label className="mb-1 block">Nombre</Label>
            <Input value={employee.first_name || ""} disabled />
          </div>

          {/* Apellido */}
          <div>
            <Label className="mb-1 block">Apellido</Label>
            <Input value={employee.last_name || ""} disabled />
          </div>

          {/* Email */}
          <div>
            <Label className="mb-1 block">Email</Label>
            <Input value={employee.email || ""} disabled />
          </div>

          {/* Género */}
          <div>
            <Label className="mb-1 block">Género</Label>
            <Input
              value={
                employee.gender === "FEMALE"
                  ? "Femenino"
                  : employee.gender === "MALE"
                  ? "Masculino"
                  : employee.gender === "OTHER"
                  ? "Otro"
                  : ""
              }
              disabled
            />
          </div>

          {/* Estado */}
          <div>
            <Label className="mb-1 block">Estado</Label>
            <Input value={employee.enabled ? "Activo" : "Inactivo"} disabled />
          </div>

          {/* Roles */}
          <div>
            <Label className="mb-1 block">Roles</Label>
            <Input value={employee.roles?.join(", ") || ""} disabled />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
