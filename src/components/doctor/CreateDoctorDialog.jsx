import React from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/shadcn/dialog";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/shadcn/separator";
import { Combobox } from "@/components/ui/inputs/combobox";
import doctors from "@/services/doctors.service";
import specialties from "@/services/specialties.service";
import medicalCenters from "@/services/medicalCenters.service";

const genders = [
    { value: "MALE", label: "Masculino" },
    { value: "FEMALE", label: "Femenino" },
];

const numErr = (v) => {
    const s = String(v ?? "").trim();
    if (!s) return "Ingresa el ID numérico del usuario a asociar.";
    const n = Number(s);
    if (!Number.isFinite(n)) return "El ID de usuario debe ser un número válido.";
    if (n <= 0) return "El ID de usuario debe ser mayor que 0.";
    return "";
};

const emailErr = (v) => {
    const s = (v ?? "").trim();
    if (!s) return "Ingresa el correo electrónico.";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(s)) return "Ingresa un correo electrónico válido.";
    if (s.length > 150) return "El correo no puede superar 150 caracteres.";
    return "";
};

// --- NUEVO: validador de cédula ecuatoriana ---
const cedulaErr = (v) => {
    const s = String(v ?? "").trim();
    if (!s) return "Ingresa una cédula ecuatoriana.";
    if (!/^\d{10}$/.test(s)) return "La cédula debe tener 10 dígitos.";
    const prov = Number(s.slice(0, 2));
    if (prov < 1 || prov > 24) return "La cédula tiene un código de provincia inválido.";
    const tercer = Number(s[2]);
    if (tercer >= 6) return "La cédula no corresponde a una persona natural.";
    const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) {
        let prod = Number(s[i]) * coef[i];
        if (prod >= 10) prod -= 9;
        suma += prod;
    }
    const verif = (10 - (suma % 10)) % 10;
    if (verif !== Number(s[9])) return "La cédula no supera la validación.";
    return "";
};

export default function CreateDoctorDialog({ open, onOpenChange, onSuccess }) {
    const [mode, setMode] = React.useState("associate"); // "associate" | "register"
    const [pending, setPending] = React.useState(false);
    const [submitAttempted, setSubmitAttempted] = React.useState(false);

    const [spOptions, setSpOptions] = React.useState([]);
    const [centerOptions, setCenterOptions] = React.useState([]);

    // ASSOCIATE
    const [associateForm, setAssociateForm] = React.useState({ userId: "", specialtyId: "" });
    const [associateTouched, setAssociateTouched] = React.useState({ userId: false, specialtyId: false });
    const [associateClientErrs, setAssociateClientErrs] = React.useState({ userId: "", specialtyId: "" });
    const [associateServerErrs, setAssociateServerErrs] = React.useState({ userId: "", specialtyId: "" });

    // REGISTER
    const [registerForm, setRegisterForm] = React.useState({
        username: "", // UI: Cédula
        email: "",
        password: "",
        gender: "",
        firstName: "",
        lastName: "",
        centerId: "",
        specialtyId: "",
    });
    const [registerTouched, setRegisterTouched] = React.useState({
        username: false,
        email: false,
        password: false,
        gender: false,
        firstName: false,
        lastName: false,
        centerId: false,
        specialtyId: false,
    });
    const [registerClientErrs, setRegisterClientErrs] = React.useState({
        username: "",
        email: "",
        password: "",
        gender: "",
        firstName: "",
        lastName: "",
        centerId: "",
        specialtyId: "",
    });
    const [registerServerErrs, setRegisterServerErrs] = React.useState({
        username: "",
        email: "",
        password: "",
        gender: "",
        firstName: "",
        lastName: "",
        centerId: "",
        specialtyId: "",
    });

    // Load combos
    const loadOptions = React.useCallback(async () => {
        try {
            const [sp, centers] = await Promise.all([
                specialties.listAllSpecialties({ includeDeleted: false }),
                medicalCenters.listAllCenters({ includeDeleted: false }),
            ]);
            setSpOptions(sp.map((s) => ({ value: String(s.id), label: s.name })));
            setCenterOptions(centers.map((c) => ({ value: String(c.id), label: `${c.name} · ${c.city}` })));
        } catch {
            toast.error("No se pudieron cargar especialidades y centros.");
        }
    }, []);

    // Reset al abrir
    React.useEffect(() => {
        if (open) {
            setMode("associate");
            setSubmitAttempted(false);

            setAssociateForm({ userId: "", specialtyId: "" });
            setAssociateTouched({ userId: false, specialtyId: false });
            setAssociateClientErrs({ userId: "", specialtyId: "" });
            setAssociateServerErrs({ userId: "", specialtyId: "" });

            setRegisterForm({
                username: "",
                email: "",
                password: "",
                gender: "",
                firstName: "",
                lastName: "",
                centerId: "",
                specialtyId: "",
            });
            setRegisterTouched({
                username: false,
                email: false,
                password: false,
                gender: false,
                firstName: false,
                lastName: false,
                centerId: false,
                specialtyId: false,
            });
            setRegisterClientErrs({
                username: "",
                email: "",
                password: "",
                gender: "",
                firstName: "",
                lastName: "",
                centerId: "",
                specialtyId: "",
            });
            setRegisterServerErrs({
                username: "",
                email: "",
                password: "",
                gender: "",
                firstName: "",
                lastName: "",
                centerId: "",
                specialtyId: "",
            });

            loadOptions();
        }
    }, [open, loadOptions]);

    // Validaciones — Associate
    const validateAssociateField = async (field, value) => {
        if (field === "userId") {
            const msg = numErr(value);
            if (msg) return msg;
            try {
                await doctors.getDoctorByUser(Number(value));
                return "Ese usuario ya está asociado a un doctor. Elige otro usuario.";
            } catch {
                return "";
            }
        }
        if (field === "specialtyId") {
            if (!String(value ?? "").trim()) return "Selecciona una especialidad para el doctor.";
            return "";
        }
        return "";
    };

    const associateMsg = (f) =>
        associateServerErrs[f] ||
        ((associateTouched[f] || submitAttempted) && associateClientErrs[f]) ||
        "";

    const onAssociateChange = async (field, value) => {
        const next = { ...associateForm, [field]: value };
        setAssociateForm(next);
        const clientMsg = await validateAssociateField(field, value);
        setAssociateClientErrs((e) => ({ ...e, [field]: clientMsg }));
        if (associateServerErrs[field]) setAssociateServerErrs((e) => ({ ...e, [field]: "" }));
    };

    const onAssociateBlur = async (field) => {
        setAssociateTouched((t) => ({ ...t, [field]: true }));
        const msg = await validateAssociateField(field, associateForm[field]);
        setAssociateClientErrs((e) => ({ ...e, [field]: msg }));
    };

    const canAssociate =
        String(associateForm.userId).trim() &&
        String(associateForm.specialtyId).trim() &&
        !associateClientErrs.userId &&
        !associateClientErrs.specialtyId &&
        !associateServerErrs.userId &&
        !associateServerErrs.specialtyId;

    // Validaciones — Register
    const validateRegisterField = (field, value) => {
        const s = typeof value === "string" ? value.trim() : value;
        switch (field) {
            case "username": // UI: Cédula
                return cedulaErr(s);
            case "email":
                return emailErr(s);
            case "password":
                if (!s) return "La contraseña es obligatoria.";
                if (String(s).length < 8) return "La contraseña debe tener al menos 8 caracteres.";
                return "";
            case "gender":
                if (!s) return "Selecciona el género (Masculino o Femenino).";
                return "";
            case "firstName":
                if (!s) return "Ingresa los nombres del doctor.";
                return "";
            case "lastName":
                if (!s) return "Ingresa los apellidos del doctor.";
                return "";
            case "centerId":
                return numErr(s);
            case "specialtyId":
                if (!s) return "Selecciona la especialidad del doctor.";
                return "";
            default:
                return "";
        }
    };

    const registerMsg = (f) =>
        registerServerErrs[f] ||
        ((registerTouched[f] || submitAttempted) && registerClientErrs[f]) ||
        "";

    const onRegisterChange = (field, value) => {
        // Para CÉDULA, permitimos solo dígitos y máx 10
        let val = value;
        if (field === "username") {
            val = String(value || "").replace(/\D+/g, "").slice(0, 10);
        }
        const next = { ...registerForm, [field]: val };
        setRegisterForm(next);
        const clientMsg = validateRegisterField(field, val);
        setRegisterClientErrs((e) => ({ ...e, [field]: clientMsg }));
        if (registerServerErrs[field]) setRegisterServerErrs((e) => ({ ...e, [field]: "" }));
    };

    const onRegisterBlur = (field) => {
        setRegisterTouched((t) => ({ ...t, [field]: true }));
        const msg = validateRegisterField(field, registerForm[field]);
        setRegisterClientErrs((e) => ({ ...e, [field]: msg }));
    };

    const canRegister =
        registerForm.username &&
        registerForm.email &&
        registerForm.password &&
        registerForm.gender &&
        registerForm.firstName &&
        registerForm.lastName &&
        registerForm.centerId &&
        registerForm.specialtyId &&
        Object.values(registerClientErrs).every((m) => !m) &&
        Object.values(registerServerErrs).every((m) => !m);

    // Submit
    const submit = async () => {
        setSubmitAttempted(true);
        setPending(true);
        try {
            if (mode === "associate") {
                const eUser = await validateAssociateField("userId", associateForm.userId);
                const eSpec = await validateAssociateField("specialtyId", associateForm.specialtyId);
                setAssociateTouched({ userId: true, specialtyId: true });
                setAssociateClientErrs({ userId: eUser || "", specialtyId: eSpec || "" });
                if (eUser || eSpec) throw { message: "Revisa los campos resaltados." };

                const res = await doctors.createDoctor({
                    userId: Number(associateForm.userId),
                    specialtyId: Number(associateForm.specialtyId),
                });
                toast.success("Doctor asociado correctamente", { description: `Usuario vinculado: ${res?.data?.userId}` });
            } else {
                const fields = Object.keys(registerForm);
                const errs = fields.reduce((acc, f) => ({ ...acc, [f]: validateRegisterField(f, registerForm[f]) }), {});
                setRegisterTouched(fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
                setRegisterClientErrs(errs);
                if (Object.values(errs).some(Boolean)) throw { message: "Revisa los campos resaltados." };

                const res = await doctors.registerDoctor({
                    // Enviamos "username" como tu backend espera, aunque sea la cédula
                    username: registerForm.username.trim(),
                    email: registerForm.email.trim(),
                    password: registerForm.password,
                    gender: registerForm.gender,
                    firstName: registerForm.firstName.trim(),
                    lastName: registerForm.lastName.trim(),
                    centerId: Number(registerForm.centerId),
                    specialtyId: Number(registerForm.specialtyId),
                });
                toast.success("Doctor registrado correctamente", { description: `ID generado: ${res?.data?.id}` });
            }

            onOpenChange(false);
            onSuccess?.();
        } catch (e) {
            const fe = doctors.parseFieldErrors?.(e) ?? {};
            if (mode === "associate") {
                setAssociateServerErrs((prev) => ({
                    ...prev,
                    userId: fe.userId || fe.user_id || prev.userId,
                    specialtyId: fe.specialtyId || fe.specialty_id || prev.specialtyId,
                }));
            } else {
                setRegisterServerErrs((prev) => ({
                    ...prev,
                    username: fe.username ?? prev.username,
                    email: fe.email ?? prev.email,
                    password: fe.password ?? prev.password,
                    gender: fe.gender ?? prev.gender,
                    firstName: fe.firstName ?? fe.first_name ?? prev.firstName,
                    lastName: fe.lastName ?? fe.last_name ?? prev.lastName,
                    centerId: fe.centerId ?? fe.center_id ?? prev.centerId,
                    specialtyId: fe.specialtyId ?? fe.specialty_id ?? prev.specialtyId,
                }));
            }
            toast.error(e?.message || "No fue posible completar la operación.");
        } finally {
            setPending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!pending) { onOpenChange(o); } }}>
            <DialogContent className="sm:max-w-[1000px]">
                <DialogHeader>
                    <DialogTitle>Crear doctor</DialogTitle>
                    <DialogDescription>Selecciona el modo y completa los campos necesarios.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="flex items-center gap-2">
                        <Label className="min-w-16">Modo</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={mode === "associate" ? "default" : "outline"}
                                size="sm"
                                onClick={() => { if (!pending) { setMode("associate"); setSubmitAttempted(false); } }}
                                disabled={pending}
                            >
                                Asociar empleado
                            </Button>
                            <Button
                                type="button"
                                variant={mode === "register" ? "default" : "outline"}
                                size="sm"
                                onClick={() => { if (!pending) { setMode("register"); setSubmitAttempted(false); } }}
                                disabled={pending}
                            >
                                Registrar nuevo
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {mode === "associate" ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="userId">ID de usuario</Label>
                                <Input
                                    id="userId"
                                    inputMode="numeric"
                                    value={associateForm.userId}
                                    onChange={(e) => onAssociateChange("userId", e.target.value)}
                                    onBlur={() => onAssociateBlur("userId")}
                                    aria-invalid={!!associateMsg("userId")}
                                    placeholder="Ej. 2"
                                />
                                {associateMsg("userId") ? <p className="text-xs text-destructive">{associateMsg("userId")}</p> : null}
                            </div>

                            <div className="grid gap-2">
                                <Label>Especialidad</Label>
                                <Combobox
                                    options={spOptions}
                                    value={associateForm.specialtyId}
                                    onChange={(v) => onAssociateChange("specialtyId", v)}
                                />
                                {associateMsg("specialtyId") ? <p className="text-xs text-destructive">{associateMsg("specialtyId")}</p> : null}
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    {/* UI: Cédula, pero el id/clave siguen como username */}
                                    <Label htmlFor="username">Cédula</Label>
                                    <Input
                                        id="username"
                                        inputMode="numeric"
                                        maxLength={10}
                                        value={registerForm.username}
                                        onChange={(e) => onRegisterChange("username", e.target.value)}
                                        onBlur={() => onRegisterBlur("username")}
                                        aria-invalid={!!registerMsg("username")}
                                        placeholder="Ej. 1718137159"
                                    />
                                    {registerMsg("username") ? <p className="text-xs text-destructive">{registerMsg("username")}</p> : null}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Correo electrónico</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={registerForm.email}
                                        onChange={(e) => onRegisterChange("email", e.target.value)}
                                        onBlur={() => onRegisterBlur("email")}
                                        aria-invalid={!!registerMsg("email")}
                                        placeholder="correo@ejemplo.com"
                                    />
                                    {registerMsg("email") ? <p className="text-xs text-destructive">{registerMsg("email")}</p> : null}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={registerForm.password}
                                        onChange={(e) => onRegisterChange("password", e.target.value)}
                                        onBlur={() => onRegisterBlur("password")}
                                        aria-invalid={!!registerMsg("password")}
                                        placeholder="Mínimo 8 caracteres"
                                    />
                                    {registerMsg("password") ? <p className="text-xs text-destructive">{registerMsg("password")}</p> : null}
                                </div>

                                <div className="grid gap-2">
                                    <Label>Género</Label>
                                    <Combobox
                                        options={genders}
                                        value={registerForm.gender}
                                        onChange={(v) => onRegisterChange("gender", v)}
                                    />
                                    {registerMsg("gender") ? <p className="text-xs text-destructive">{registerMsg("gender")}</p> : null}
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="firstName">Nombres</Label>
                                    <Input
                                        id="firstName"
                                        value={registerForm.firstName}
                                        onChange={(e) => onRegisterChange("firstName", e.target.value)}
                                        onBlur={() => onRegisterBlur("firstName")}
                                        aria-invalid={!!registerMsg("firstName")}
                                        placeholder="Ej. Ana María"
                                    />
                                    {registerMsg("firstName") ? <p className="text-xs text-destructive">{registerMsg("firstName")}</p> : null}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="lastName">Apellidos</Label>
                                    <Input
                                        id="lastName"
                                        value={registerForm.lastName}
                                        onChange={(e) => onRegisterChange("lastName", e.target.value)}
                                        onBlur={() => onRegisterBlur("lastName")}
                                        aria-invalid={!!registerMsg("lastName")}
                                        placeholder="Ej. Pérez Gómez"
                                    />
                                    {registerMsg("lastName") ? <p className="text-xs text-destructive">{registerMsg("lastName")}</p> : null}
                                </div>

                                <div className="grid gap-2">
                                    <Label>Centro médico</Label>
                                    <Combobox
                                        options={centerOptions}
                                        value={registerForm.centerId}
                                        onChange={(v) => onRegisterChange("centerId", v)}
                                        // Si tu Combobox soporta placeholder, podrías pasar: placeholder="Selecciona un centro"
                                    />
                                    {registerMsg("centerId") ? <p className="text-xs text-destructive">{registerMsg("centerId")}</p> : null}
                                </div>

                                <div className="grid gap-2">
                                    <Label>Especialidad</Label>
                                    <Combobox
                                        options={spOptions}
                                        value={registerForm.specialtyId}
                                        onChange={(v) => onRegisterChange("specialtyId", v)}
                                        // placeholder="Selecciona una especialidad"
                                    />
                                    {registerMsg("specialtyId") ? <p className="text-xs text-destructive">{registerMsg("specialtyId")}</p> : null}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={
                            pending ||
                            (mode === "associate" ? !canAssociate : !canRegister)
                        }
                    >
                        {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                        Crear
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
