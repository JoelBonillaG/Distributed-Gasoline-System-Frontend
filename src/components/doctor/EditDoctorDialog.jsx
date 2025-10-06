import React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/shadcn/dialog";
import { Button } from "@/components/ui/shadcn/button";
import { Label } from "@/components/ui/shadcn/label";
import { Loader2 } from "lucide-react";
import {Combobox} from "@/components/ui/inputs/combobox";
import doctors from "@/services/doctors.service";
import specialties from "@/services/specialties.service";

export default function EditDoctorDialog({ open, onOpenChange, doctorId, includeDeleted = false, onSuccess }) {
    const [pending, setPending] = React.useState(false);
    const [spOptions, setSpOptions] = React.useState([]);
    const [form, setForm] = React.useState({ specialtyId: "" });
    const [errs, setErrs] = React.useState({ specialtyId: "" });
    const [canEdit, setCanEdit] = React.useState(false);

    const loadData = React.useCallback(async () => {
        try {
            const [sp, doc] = await Promise.all([
                specialties.listAllSpecialties({ includeDeleted: false }),
                doctors.getDoctor(doctorId, { includeDeleted }),
            ]);
            setSpOptions(sp.map((s) => ({ value: String(s.id), label: s.name })));
            setForm({ specialtyId: doc.data.specialtyId ? String(doc.data.specialtyId) : "" });
            setErrs({ specialtyId: doc.data.specialtyId ? "" : "Requerido" });
            setCanEdit(!!doc.data.specialtyId);
        } catch (e) {
            toast.error(e?.message || "Error cargando datos");
        }
    }, [doctorId, includeDeleted]);

    React.useEffect(() => {
        if (open && doctorId) loadData();
    }, [open, doctorId, loadData]);

    const validate = (f) => {
        const e = { specialtyId: "" };
        if (!f.specialtyId) e.specialtyId = "Requerido";
        setErrs(e);
        setCanEdit(!e.specialtyId);
    };

    React.useEffect(() => {
        if (open) validate(form);
    }, [form, open]);

    const submit = async () => {
        setPending(true);
        try {
            const res = await doctors.updateDoctor(doctorId, { specialtyId: Number(form.specialtyId) });
            toast.success("Doctor actualizado", { description: `ID ${res?.data?.id}` });
            onOpenChange(false);
            if (typeof onSuccess === "function") onSuccess();
        } catch (e) {
            const f = doctors.parseFieldErrors(e);
            setErrs((prev) => ({ ...prev, ...f }));
            toast.error(e?.message || "Error");
        } finally {
            setPending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!pending) onOpenChange(o); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar doctor</DialogTitle>
                    <DialogDescription>Actualiza la especialidad</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Especialidad</Label>
                        <Combobox
                            options={spOptions}
                            value={form.specialtyId}
                            onChange={(v) => setForm((f) => ({ ...f, specialtyId: v }))}
                            onBlur={() => validate(form)}
                            placeholder="Selecciona especialidad"
                        />
                        {errs.specialtyId ? <p className="text-xs text-destructive">{errs.specialtyId}</p> : null}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>Cancelar</Button>
                    <Button onClick={submit} disabled={!canEdit || pending}>
                        {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
