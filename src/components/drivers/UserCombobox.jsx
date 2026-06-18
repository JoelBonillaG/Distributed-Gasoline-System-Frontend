import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/shadcn/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/shadcn/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/shadcn/popover";
import { getAllUsers } from "@/services/users.service";

/**
 * Combobox para seleccionar usuarios con búsqueda
 * @param {Object} props
 * @param {number|null} props.value - userId seleccionado
 * @param {(userId: number|null) => void} props.onChange - Callback cuando cambia la selección
 * @param {string} [props.placeholder] - Placeholder cuando no hay selección
 * @param {boolean} [props.disabled] - Si está deshabilitado
 * @param {string} [props.className] - Clases adicionales
 */
const UserCombobox = ({ 
  value, 
  onChange, 
  placeholder = "Seleccionar usuario...",
  disabled = false,
  className 
}) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Error al cargar usuarios");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUser = users.find((user) => {
    const userId = user.userId || user.id;
    return userId === value;
  });

  const getUserLabel = (user) => {
    const userId = user.userId || user.id;
    const name = user.name || user.username || `Usuario ${userId}`;
    const email = user.email ? ` (${user.email})` : "";
    return `${name}${email}`;
  };

  const getUserSearchValue = (user) => {
    const userId = user.userId || user.id;
    const name = user.name || user.username || "";
    const email = user.email || "";
    return `${userId} ${name} ${email}`.toLowerCase();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn("w-full justify-between", className)}
        >
          {isLoading ? (
            <span className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando usuarios...
            </span>
          ) : selectedUser ? (
            <span className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              {getUserLabel(selectedUser)}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Buscar por nombre, email o ID..." 
            className="h-9"
          />
          <CommandList>
            {error ? (
              <CommandEmpty>
                <div className="text-center py-6">
                  <p className="text-sm text-destructive mb-2">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadUsers}
                  >
                    Reintentar
                  </Button>
                </div>
              </CommandEmpty>
            ) : (
              <>
                <CommandEmpty>No se encontraron usuarios</CommandEmpty>
                <CommandGroup>
                  {users.map((user) => {
                    const userId = user.userId || user.id;
                    const isSelected = userId === value;
                    
                    return (
                      <CommandItem
                        key={userId}
                        value={getUserSearchValue(user)}
                        onSelect={() => {
                          onChange(isSelected ? null : userId);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.name || user.username || `Usuario ${userId}`}
                          </span>
                          {user.email && (
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          )}
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground">
                          #{userId}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default UserCombobox;
