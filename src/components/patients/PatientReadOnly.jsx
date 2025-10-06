import React from 'react';
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/shadcn/select";

export default function PatientReadOnly({ patient = {}, centers = [] }) {
  return (
    <div className="space-y-4">
      {/* DNI */}
      <div>
        <Label className="mb-1 block">DNI</Label>
        <Input value={patient.dni || ""} disabled />
      </div>

      {/* Nombre */}
      <div>
        <Label className="mb-1 block">Nombre</Label>
        <Input value={patient.firstName || ""} disabled />
      </div>

      {/* Apellido */}
      <div>
        <Label className="mb-1 block">Apellido</Label>
        <Input value={patient.lastName || ""} disabled />
      </div>

      {/* Centro Médico */}
      <div>
        <Label className="mb-1 block">Centro Médico</Label>
        <Select disabled value={patient.centerId?.toString() || ""}>
          <SelectTrigger className="h-12 px-3">
            <SelectValue placeholder="Seleccione un centro" />
          </SelectTrigger>
          <SelectContent>
            {centers.map(c => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Género */}
      <div>
        <Label className="mb-1 block">Género</Label>
        <Input value={
          patient.gender === "FEMALE" ? "Femenino" :
          patient.gender === "MALE" ? "Masculino" :
          patient.gender === "OTHER" ? "Otro" : ""
        } disabled />
      </div>

      {/* Fecha de nacimiento */}
      <div>
        <Label className="mb-1 block">Fecha de nacimiento</Label>
        <Input 
          type="date"
          value={patient.birthDate ? new Date(patient.birthDate).toISOString().split("T")[0] : ""}
          disabled 
        />
      </div>
    </div>
  );
}
