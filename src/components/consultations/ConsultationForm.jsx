import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { Button } from "@/components/ui/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/shadcn/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/shadcn/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConsultationForm({
  defaultValues,
  onSubmit,
  readOnly = false,
  serverErrors = {},
  patients = [],
  isCreate = false,
  formId,
}) {
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      patientId: "",
      patientName: "",
      doctorId: "",
      doctorName: "",
      centerId: "",
      centerName: "",
      date: "",
      diagnosis: "",
      treatment: "",
      notes: "",
      ...defaultValues,
    },
    mode: "onChange",
  });

  const [selectedPatient, setSelectedPatient] = React.useState(null);

  // ✅ Calcular fecha y hora actuales en formato yyyy-MM-ddTHH:mm
  const now = new Date();
  const nowStr = now.toISOString().slice(0, 16);

  useEffect(() => {
    clearErrors();
    if (serverErrors && typeof serverErrors === "object") {
      Object.entries(serverErrors).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          setError(field, { type: "server", message: messages[0] });
        }
      });
    }
  }, [serverErrors, setError, clearErrors]);

  useEffect(() => {
    if (!defaultValues) return;

    if (!isCreate && defaultValues.patient) {
      setValue("patientId", defaultValues.patient.id);
      setValue(
        "patientName",
        `${defaultValues.patient.firstName} ${defaultValues.patient.lastName}`
      );
      setSelectedPatient({
        id: defaultValues.patient.id,
        name: `${defaultValues.patient.firstName} ${defaultValues.patient.lastName}`,
      });
    }

    setValue("doctorId", defaultValues.doctor?.id ?? defaultValues.doctorId ?? "");
    setValue(
      "doctorName",
      defaultValues.doctor
        ? `${defaultValues.doctor.firstName} ${defaultValues.doctor.lastName}`
        : defaultValues.doctorName ?? ""
    );

    setValue("centerId", defaultValues.center?.id ?? defaultValues.centerId ?? "");
    setValue(
      "centerName",
      defaultValues.center?.name ?? defaultValues.centerName ?? ""
    );

    setValue("date", defaultValues.date ?? "");
    setValue("diagnosis", defaultValues.diagnosis ?? "");
    setValue("treatment", defaultValues.treatment ?? "");
    setValue("notes", defaultValues.notes ?? "");
  }, [defaultValues, setValue, isCreate]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id={formId}>
      <div className="grid grid-cols-2 gap-4">
        {/* Centro */}
        <div>
          <Label className="mb-3">Centro Médico</Label>
          <Input {...register("centerName")} disabled />
          <input type="hidden" {...register("centerId")} />
        </div>

        {/* Doctor */}
        <div>
          <Label className="mb-3">Doctor</Label>
          <Input {...register("doctorName")} disabled />
          <input type="hidden" {...register("doctorId")} />
        </div>

        {/* Paciente */}
        <div>
          <Label className="mb-3">Paciente</Label>
          {isCreate ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedPatient ? selectedPatient.name : "Selecciona un paciente"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar paciente..." />
                  <CommandList>
                    <CommandEmpty>No encontrado.</CommandEmpty>
                    <CommandGroup>
                      {patients.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.id}
                          onSelect={() => {
                            setSelectedPatient({
                              id: p.id,
                              name: `${p.firstName} ${p.lastName}`,
                            });
                            setValue("patientId", p.id, { shouldValidate: true });
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPatient?.id === p.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {p.firstName} {p.lastName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          ) : (
            <>
              <Input {...register("patientName")} disabled />
              <input type="hidden" {...register("patientId")} />
            </>
          )}
          {/* ✅ patientId requerido */}
          <input
            type="hidden"
            {...register("patientId", { required: "Seleccione un paciente" })}
          />
          {errors.patientId && (
            <p className="text-sm text-red-500">{errors.patientId.message}</p>
          )}
        </div>

        {/* Fecha y hora */}
        <div>
          <Label className="mb-3">Fecha y hora</Label>
          <Input
            type="datetime-local"
            {...register("date", { required: "Seleccione fecha y hora" })}
            disabled={readOnly}
            max={nowStr} // ✅ no permite fechas futuras
          />
          {errors.date && (
            <p className="text-sm text-red-500">{errors.date.message}</p>
          )}
        </div>
      </div>

      {/* Diagnóstico */}
      <div>
        <Label className="mb-3">Diagnóstico</Label>
        <Textarea
          {...register("diagnosis", { required: "El diagnóstico es obligatorio" })}
          disabled={readOnly}
        />
        {errors.diagnosis && (
          <p className="text-sm text-red-500">{errors.diagnosis.message}</p>
        )}
      </div>

      {/* Tratamiento (opcional) */}
      <div>
        <Label className="mb-3">Tratamiento</Label>
        <Textarea {...register("treatment")} disabled={readOnly} />
      </div>

      {/* Notas (opcional) */}
      <div>
        <Label className="mb-3">Notas</Label>
        <Textarea {...register("notes")} disabled={readOnly} />
      </div>
    </form>
  );
}
