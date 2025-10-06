import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/shadcn/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/shadcn/avatar";
import { Separator } from "@/components/ui/shadcn/separator";
import { Loader2 } from "lucide-react";
import AuthContext from "@/context/AuthContext";
import employees from "@/services/employeeService";

export default function ProfilePage() {
  const { user, updateUser } = React.useContext(AuthContext);

  const [form, setForm] = React.useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
  });

  const [pending, setPending] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const eValid = validate();
    if (Object.keys(eValid).length) {
      setErrors(eValid);
      toast.error("Please complete the required fields.");
      return;
    }

    setPending(true);
    try {
      // Construir payload
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: form.gender || null, // si agregas gender al formulario
      };

      // Llamar a tu endpoint de updateUser con el id del usuario
      const res = await employees.updateProfile(user.id, payload);
      updateUser(res);

      toast.success("Profile updated successfully!");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Update failed";
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl rounded-2xl p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="flex flex-col items-center space-y-4">
          <Avatar className="h-28 w-28 bg-gray-500 dark:bg-gray-700 text-white flex items-center justify-center rounded-full text-4xl font-extrabold shadow-lg">
            {user
              ? `${user.first_name[0]?.toUpperCase()}${user.last_name[0]?.toUpperCase()}`
              : "U"}
          </Avatar>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Edit Profile
          </CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-300">
            Update your personal information below
          </CardDescription>
        </CardHeader>

        <Separator className="my-6 border-t border-gray-200 dark:border-gray-700" />

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label className="text-gray-900 dark:text-gray-100">
                First name
              </Label>
              <Input
                value={form.firstName}
                onChange={(e) => onChange("firstName", e.target.value)}
                placeholder="Your name"
                className="rounded-lg shadow-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
              />
              {errors.firstName && (
                <p className="text-xs text-destructive dark:text-red-400">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label className="text-gray-900 dark:text-gray-100">
                Last name
              </Label>
              <Input
                value={form.lastName}
                onChange={(e) => onChange("lastName", e.target.value)}
                placeholder="Your last name"
                className="rounded-lg shadow-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
              />
              {errors.lastName && (
                <p className="text-xs text-destructive dark:text-red-400">
                  {errors.lastName}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="mt-6">
            <Button
              type="submit"
              className="w-full py-3 text-lg font-medium bg-gray-400 hover:bg-gray-500 text-white dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg shadow-md transition-colors flex justify-center items-center"
              disabled={pending}
            >
              {pending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Save changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
