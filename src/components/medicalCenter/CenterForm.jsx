import React from "react";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";

export default function CenterForm({ value, onChange, errors = {}, onValidityChange }) {
    const [touched, setTouched] = React.useState({ name: false, city: false, address: false });
    const [clientErrs, setClientErrs] = React.useState({ name: "", city: "", address: "" });
    const [serverErrs, setServerErrs] = React.useState({ name: "", city: "", address: "" });

    React.useEffect(() => {
        setServerErrs({
            name: errors?.name || "",
            city: errors?.city || "",
            address: errors?.address || "",
        });
    }, [errors]);

    const v = (k) => (typeof value?.[k] === "string" ? value[k] : "");

    const validateField = (field, val) => {
        const s = (val ?? "").trim();
        if (field === "name") {
            if (!s) return "Ingresa el nombre del centro.";
            if (s.length > 100) return "El nombre no puede superar 100 caracteres.";
        }
        if (field === "city") {
            if (!s) return "Ingresa la ciudad.";
            if (s.length > 100) return "La ciudad no puede superar 100 caracteres.";
        }
        if (field === "address") {
            if (!s) return "Ingresa la dirección.";
            if (s.length > 200) return "La dirección no puede superar 200 caracteres.";
        }
        return "";
    };

    const recomputeValidity = (nextVal, nextClientErrs, nextServerErrs) => {
        const empty =
            !nextVal.name?.trim() || !nextVal.city?.trim() || !nextVal.address?.trim();
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
                <Label htmlFor="city">Ciudad</Label>
                <Input
                    id="city"
                    value={v("city")}
                    onChange={(e) => handleChange("city", e.target.value)}
                    onBlur={() => handleBlur("city")}
                    aria-invalid={!!msg("city")}
                />
                {msg("city") ? <p className="text-xs text-destructive">{msg("city")}</p> : null}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                    id="address"
                    value={v("address")}
                    onChange={(e) => handleChange("address", e.target.value)}
                    onBlur={() => handleBlur("address")}
                    aria-invalid={!!msg("address")}
                />
                {msg("address") ? <p className="text-xs text-destructive">{msg("address")}</p> : null}
            </div>
        </div>
    );
}
