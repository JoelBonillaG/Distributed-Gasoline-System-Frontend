import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Button } from "@/components/ui/shadcn/button";
import { toast } from "sonner";

function LoginFormComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) newErrors.email = "El correo electrónico es requerido";
    else if (!isValidEmail(email))
      newErrors.email = "Ingresa un correo electrónico válido";

    if (!password.trim()) newErrors.password = "La contraseña es requerida";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const result = await login(email, password);
      console.log("Login result:", result);

      if (result.success) {
        toast.success("Inicio de sesión correcto", {
          id: "login-success",
          description: "Bienvenido de nuevo",
        });
        navigate("/", { replace: true });
        return;
      }

      // Si llega aquí sin éxito explícito, tratamos como error
      throw result;
    } catch (error) {
      const backend = error?.errorData || {};
      console.log("Backend error data:", backend);
      const code = backend?.grpc?.code;
      const status = backend?.statusCode;

      if (status === 400 && backend.code === "VALIDATION_ERROR") {
        const fieldErrors = {};

        // Convertimos el objeto del backend en formato { campo: mensaje }
        if (backend.errors) {
          Object.entries(backend.errors).forEach(([field, messages]) => {
            fieldErrors[field] = Array.isArray(messages)
              ? messages.join(", ")
              : messages;
          });
        }

        // Actualizamos los errores visuales
        setErrors(fieldErrors);

        // Mostramos un toast general
        toast.error("Error de validación. Revisa los campos.", {
          id: "validation-error",
        });
        return;
      }

      if (status === 401 || code === 16) {
        toast.error("Credenciales inválidas", { id: "unauthenticated" });
        return;
      }

      if (status === 404 || code === 5) {
        toast.error("Usuario no encontrado", { id: "not-found" });
        return;
      }

      toast.error(backend.message || "Error en el servidor", {
        id: "login-error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="grid gap-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Contraseña */}
        <div className="grid gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        {/* Botón */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#FB923C]"
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </form>
    </div>
  );
}

export default LoginFormComponent;
