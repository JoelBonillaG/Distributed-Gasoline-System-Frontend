import React from 'react';
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn/select";



export default function PatientForm({ defaultValues, onSubmit, centers = [], readOnly = false, serverErrors = {}, formId }) {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues || {
      dni: "",
      firstName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      centerId: "",
    },
    mode: "onChange",
  });

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const todayStr = `${yyyy}-${mm}-${dd}`;

  
  // Mapear errores del backend a react-hook-form
  React.useEffect(() => {
    // Limpiar errores previos
    clearErrors();
    
    if (serverErrors && typeof serverErrors === "object") {
      Object.entries(serverErrors).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          // Tomar el primer mensaje del array
          setError(field, { 
            type: "server", 
            message: messages[0] 
          });
        }
      });
    }
  }, [serverErrors, setError, clearErrors]);

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-4"
      id={formId} // ✅ Agregar el ID del formulario
    >
      {/* DNI */}
      <div>
        <Label className="mb-1 block">DNI</Label>
        <Input
          {...register("dni", {
            required: "La cédula es obligatoria",
            minLength: { value: 10, message: "La cédula debe tener 10 dígitos" },
            maxLength: { value: 10, message: "La cédula debe tener 10 dígitos" },
            pattern: { value: /^[0-9]+$/, message: "La cédula solo debe contener números" },
          
          })}
          disabled={readOnly}
        />
        {errors.dni && <p className="text-sm text-red-500">{errors.dni.message}</p>}
      </div>

      {/* Nombre */}
      <div>
        <Label className="mb-1 block">Nombre</Label>
        <Input
          {...register("firstName", {
            required: "El nombre es obligatorio",
            minLength: { value: 2, message: "El nombre debe tener al menos 2 caracteres" },
            maxLength: { value: 50, message: "El nombre debe tener máximo 50 caracteres" },
            pattern: { 
              value: /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/, 
              message: "El nombre solo debe contener letras y espacios" 
            }
          })}
          disabled={readOnly}
        />
        {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
      </div>

      {/* Apellido */}
      <div>
        <Label className="mb-1 block">Apellido</Label>
        <Input
          {...register("lastName", {
            required: "El apellido es obligatorio",
            minLength: { value: 2, message: "El apellido debe tener al menos 2 caracteres" },
            maxLength: { value: 50, message: "El apellido debe tener máximo 50 caracteres" },
            pattern: { 
              value: /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/, 
              message: "El apellido solo debe contener letras y espacios" 
            }
          })}
          disabled={readOnly}
        />
        {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
      </div>

      {/* Centro Médico */}
      <div>
        <Label className="mb-1 block">Centro Médico</Label>
        <Controller
          name="centerId"
          control={control}
          rules={{ required: "Seleccione un centro médico" }}
          render={({ field }) => (
            <Select
              disabled={readOnly}
              value={field.value ? field.value.toString() : ""}
              onValueChange={(val) => field.onChange(parseInt(val))}
              className="w-full"
            >
              <SelectTrigger className="h-12 px-3 w-full">
                <SelectValue placeholder="Seleccione un centro" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {centers.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.centerId && <p className="text-sm text-red-500">{errors.centerId.message}</p>}
      </div>

      {/* Género */}
      <div>
        <Label className="mb-1 block">Género</Label>
        <select
          {...register("gender", { required: "Seleccione un género" })}
          disabled={readOnly}
          className="h-12 px-3 py-2 border rounded-md w-full"
        >
          <option value="">Seleccione género</option>
          <option value="FEMALE">Femenino</option>
          <option value="MALE">Masculino</option>
      
        </select>
        {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
      </div>

      {/* Fecha de nacimiento */}
      <div>
        <Label className="mb-1 block">Fecha de nacimiento</Label>
    <input
  type="date"
  max={todayStr} // ahora solo permite hasta hoy
  min={new Date(today.setFullYear(today.getFullYear() - 110)).toISOString().split("T")[0]}
  {...register("birthDate", { required: "Seleccione la fecha de nacimiento" })}
  disabled={readOnly}
  className="h-12 px-3 py-2 border rounded-md w-full"
/>

        {errors.birthDate && <p className="text-sm text-red-500">{errors.birthDate.message}</p>}
      </div>

      {/* ✅ Solo mostrar botón si NO está en modo readOnly y NO tiene formId (evita duplicados) */}
      {!readOnly && !formId && (
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
          >
            Guardar
          </button>
        </div>
      )}
    </form>
  );
}