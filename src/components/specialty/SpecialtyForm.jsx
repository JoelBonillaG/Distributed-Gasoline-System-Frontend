import React from "react";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Textarea } from "@/components/ui/shadcn/textarea";

export default function SpecialtyForm({ value, onChange, errors = {}, onValidityChange }) {
    const [touched, setTouched] = React.useState({ name: false, description: false });
    const [clientErrs, setClientErrs] = React.useState({ name: "", description: "" });
    const [serverErrs, setServerErrs] = React.useState({ name: "", description: "" });

    React.useEffect(() => {
        setServerErrs({
            name: errors?.name || "",
            description: errors?.description || "",
        });
    }, [errors]);

    const v = (k) => (typeof value?.[k] === "string" ? value[k] : "");

    const validateField = (field, val) => {
        const s = (val ?? "").trim();
        if (field === "name") {
            if (!s) return "Ingresa el nombre de la especialidad.";
            if (s.length > 100) return "El nombre no puede superar 100 caracteres.";
        }
        if (field === "description") {
            if (s.length > 1000) return "La descripción no puede superar 1000 caracteres.";
        }
        return "";
    };

    const recomputeValidity = (nextVal, nextClientErrs, nextServerErrs) => {
        const empty = !nextVal.name?.trim();
        const hasClient = Object.values(nextClientErrs).some(Boolean);
        const hasServer = Object.values(nextServerErrs).some(Boolean);
        onValidityChange?.(!empty && !hasClient && !hasServer);
    };

    const handleChange = (field, val) => {
        const nextVal = { ...value, [field]: val };
        onChange(nextVal);
        const nextClient = { ...clientErrs, [field]: validateField(field, val) };
        setClientErrs(nextClient);
        const nextServer = { ...serverErrs, [field]: "" };
        setServerErrs(nextServer);
        recomputeValidity(nextVal, nextClient, nextServer);
    };

    const handleBlur = (field) => {
        const nextTouched = { ...touched, [field]: true };
        setTouched(nextTouched);
        const nextClient = { ...clientErrs, [field]: validateField(field, v(field)) };
        setClientErrs(nextClient);
        recomputeValidity(value, nextClient, serverErrs);
    };

    const msg = (field) => serverErrs[field] || (touched[field] && clientErrs[field]) || "";

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                    id="name"
                    value={v("name")}
                    onChange={(e) => handleChange("name", e.target.value)}
                    onBlur={() => handleBlur("name")}
                    aria-invalid={!!msg("name")}
                />
                {msg("name") ? <p className="text-xs text-destructive">{msg("name")}</p> : null}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                    id="description"
                    value={v("description")}
                    onChange={(e) => handleChange("description", e.target.value)}
                    onBlur={() => handleBlur("description")}
                    aria-invalid={!!msg("description")}
                    rows={4}
                />
                {msg("description") ? <p className="text-xs text-destructive">{msg("description")}</p> : null}
            </div>
        </div>
    );
}
