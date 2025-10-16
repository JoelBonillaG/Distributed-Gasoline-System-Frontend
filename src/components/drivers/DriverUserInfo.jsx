import { User } from "lucide-react";

/**
 * Componente que muestra la información del usuario asociado al conductor
 */
const DriverUserInfo = ({ driver, user }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <User className="h-4 w-4" />
        Usuario Asociado
      </h3>
      
      {user ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">ID Usuario</p>
            <p className="font-mono">#{user.userId || user.id}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Nombre de Usuario</p>
            <p>{user.username || "-"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Nombre</p>
            <p>{user.firstName || user.first_name || "-"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Apellido</p>
            <p>{user.lastName || user.last_name || "-"}</p>
          </div>

          {user.email && (
            <div className="space-y-1 col-span-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="break-all">{user.email}</p>
            </div>
          )}

          {user.phone && (
            <div className="space-y-1 col-span-2">
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p>{user.phone}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Usuario #{driver.userId}
        </p>
      )}
    </div>
  );
};

export default DriverUserInfo;
