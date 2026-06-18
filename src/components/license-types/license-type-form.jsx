import { useState, useEffect } from "react";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { Switch } from "@/components/ui/shadcn/switch";
import { Label } from "@/components/ui/shadcn/label";

const LicenseTypeForm = ({ licenseType, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    code: licenseType?.code || "",
    description: licenseType?.description || "",
    isProfessional: licenseType?.isProfessional ?? false,
  });

  // Sincronizar el estado cuando cambie licenseType
  useEffect(() => {
    if (licenseType) {
      setFormData({
        code: licenseType.code || "",
        description: licenseType.description || "",
        isProfessional: licenseType.isProfessional ?? false,
      });
    }
  }, [licenseType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("📝 Submitting form data:", formData);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="code">Código *</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="Ej: A, B, C1..."
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción del tipo de licencia..."
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
        <Label htmlFor="isProfessional" className="font-medium cursor-pointer">
          Licencia Profesional
        </Label>
        <Switch
          id="isProfessional"
          checked={formData.isProfessional}
          onCheckedChange={(checked) => {
            console.log("🔄 Switch changed:", checked);
            setFormData({ ...formData, isProfessional: checked });
          }}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {licenseType ? "Actualizar" : "Crear"} Tipo de Licencia
        </Button>
      </div>
    </form>
  );
};

export default LicenseTypeForm;