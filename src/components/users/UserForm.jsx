import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";

const ROLE_OPTIONS = [
  { value: "1", label: "Administrador" },
  { value: "2", label: "Supervisor" },
];

export default function UserForm({
  defaultValues,
  onSubmit,
  readOnly = false,
  serverErrors = {},
  formId,
}) {
  const isEditing = Boolean(defaultValues?.userId ?? defaultValues?.id);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    trigger,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      username: "",
      password: "",
      roleId: "",
      ...defaultValues,
      roleId:
        defaultValues?.roleId != null
          ? String(defaultValues.roleId)
          : defaultValues?.roles?.[0]?.roleId != null
            ? String(defaultValues.roles[0].roleId)
            : defaultValues?.roleIds?.[0] != null
              ? String(defaultValues.roleIds[0])
              : "",
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    clearErrors();

    if (serverErrors && typeof serverErrors === "object") {
      Object.entries(serverErrors).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          setError(field, {
            type: "server",
            message: messages[0],
          });
        }
      });
    }
  }, [serverErrors, clearErrors, setError]);

  const handleFormSubmit = (values) => {
    onSubmit(values);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4"
      id={formId}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1 block">Nombre</Label>
          <Input
            {...register("firstName", {
              required: "El nombre es obligatorio",
              minLength: {
                value: 2,
                message: "El nombre debe tener al menos 2 caracteres",
              },
              maxLength: {
                value: 60,
                message: "Máximo 60 caracteres",
              },
            })}
            disabled={readOnly}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <Label className="mb-1 block">Apellido</Label>
          <Input
            {...register("lastName", {
              required: "El apellido es obligatorio",
              minLength: {
                value: 2,
                message: "El apellido debe tener al menos 2 caracteres",
              },
              maxLength: {
                value: 60,
                message: "Máximo 60 caracteres",
              },
            })}
            disabled={readOnly}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>

        <div>
          <Label className="mb-1 block">Correo electrónico</Label>
          <Input
            type="email"
            {...register("email", {
              required: "El correo es obligatorio",
              pattern: {
                value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                message: "Correo inválido",
              },
            })}
            disabled={readOnly}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label className="mb-1 block">Teléfono</Label>
          <Controller
            control={control}
            name="phone"
            rules={{
              required: "Ingresa un número de 10 dígitos",
              minLength: {
                value: 10,
                message: "Ingresa un número de 10 dígitos",
              },
              maxLength: {
                value: 10,
                message: "Ingresa un número de 10 dígitos",
              },
            }}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                onChange={(event) => {
                  const raw = event.target.value;
                  const digits = raw.replace(/\D/g, "");
                  field.onChange(digits);

                  if (raw !== digits) {
                    setError("phone", {
                      type: "manual",
                      message: "Solo números (10 dígitos)",
                    });
                  } else {
                    clearErrors("phone");
                    trigger("phone");
                  }
                }}
                disabled={readOnly}
              />
            )}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <Label className="mb-1 block">Usuario</Label>
          <Input
            {...register("username", {
              required: "El usuario es obligatorio",
              minLength: {
                value: 4,
                message: "Mínimo 4 caracteres",
              },
              maxLength: {
                value: 30,
                message: "Máximo 30 caracteres",
              },
            })}
            disabled={readOnly}
          />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username.message}</p>
          )}
        </div>

        {!isEditing && (
          <div>
            <Label className="mb-1 block">Contraseña</Label>
            <Input
              type="password"
              autoComplete="new-password"
              {...register("password", {
                required: "La contraseña es obligatoria",
                minLength: {
                  value: 8,
                  message: "Mínimo 8 caracteres",
                },
                pattern: {
                  value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                  message: "Debe contener letras y números",
                },
              })}
              disabled={readOnly}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        )}

        <div>
          <Label className="mb-1 block">Rol</Label>
          <Controller
            control={control}
            name="roleId"
            rules={{ required: "Selecciona un rol" }}
            render={({ field }) => (
              <Select
                disabled={readOnly}
                value={field.value || ""}
                onValueChange={(val) => field.onChange(val)}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.roleId && (
            <p className="text-sm text-destructive">{errors.roleId.message}</p>
          )}
        </div>

      </div>

      {!readOnly && formId == null && (
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