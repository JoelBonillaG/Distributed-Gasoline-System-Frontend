import { useMemo, useState } from "react";
import { Button } from "@/components/ui/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { Badge } from "@/components/ui/shadcn/badge";
import { Separator } from "@/components/ui/shadcn/separator";

const LicenseInclusionEditor = ({
  parent,
  allLicenseTypes,
  onAdd,
  onRemove,
  isAdding,
  removingId,
}) => {
  const [selectedChildId, setSelectedChildId] = useState("");

  const availableOptions = useMemo(() => {
    if (!parent) return [];
    const usedIds = new Set(
      (parent.childIncludes || []).map((inc) => inc.childLicenseTypeId)
    );
    usedIds.add(parent.licenseTypeId);
    return (allLicenseTypes || []).filter(
      (type) => !usedIds.has(type.licenseTypeId)
    );
  }, [parent, allLicenseTypes]);

  const childDetails = useMemo(() => {
    const map = new Map(
      (allLicenseTypes || []).map((lt) => [lt.licenseTypeId, lt])
    );
    return (parent?.childIncludes || []).map((include) => {
      const info = map.get(include.childLicenseTypeId);
      return {
        id: include.childLicenseTypeId,
        code: info?.code || `ID ${include.childLicenseTypeId}`,
        description: info?.description || "Sin descripción",
      };
    });
  }, [parent, allLicenseTypes]);

  const handleAddClick = () => {
    const childIdNumber = Number(selectedChildId);
    if (!childIdNumber || Number.isNaN(childIdNumber)) return;
    onAdd(childIdNumber)
      .then((success) => {
        if (success) {
          setSelectedChildId("");
        }
      })
      .catch(() => {
        /* la función padre ya muestra el error */
      });
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-semibold">Incluir otra licencia</h4>
        <p className="text-sm text-muted-foreground">
          Selecciona un tipo de licencia que quedará automáticamente incluído
          dentro de {parent?.code}. Los conductores con {parent?.code} podrán
          realizar las actividades permitidas por la licencia incluida.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          value={selectedChildId}
          onValueChange={setSelectedChildId}
          disabled={isAdding || availableOptions.length === 0}
        >
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Selecciona licencia a incluir" />
          </SelectTrigger>
          <SelectContent>
            {availableOptions.map((lt) => (
              <SelectItem key={lt.licenseTypeId} value={String(lt.licenseTypeId)}>
                {lt.code} — {lt.description || "Sin descripción"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleAddClick}
          disabled={
            isAdding || !selectedChildId || availableOptions.length === 0
          }
        >
          {isAdding ? "Agregando..." : "Agregar inclusión"}
        </Button>
      </div>

      <Separator />

      <div className="space-y-3">
        <h5 className="text-sm font-medium text-muted-foreground">
          Licencias actualmente incluídas
        </h5>
        {childDetails.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {parent?.code} no incluye otras licencias.
          </p>
        ) : (
          <div className="space-y-2">
            {childDetails.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex flex-col">
                  <span className="font-semibold flex items-center gap-2">
                    <Badge variant="outline">{child.code}</Badge>
                    <span>{child.description}</span>
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  size="sm"
                  disabled={removingId === child.id}
                  onClick={() => onRemove(child.id)}
                >
                  {removingId === child.id ? "Quitando..." : "Quitar"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LicenseInclusionEditor;
