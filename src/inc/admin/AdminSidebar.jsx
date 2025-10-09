import React, { useContext, useState } from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/shadcn/sidebar";
import { Avatar } from "@/components/ui/shadcn/avatar";
import { FolderKanban, BookText, BarChart3, TestTube2, Car, ChevronDown } from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import logoUrl from "@/assets/favicon.ico";
import AuthContext from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/shadcn/dropdown-menu";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/shadcn/collapsible";
import Can from "@/utils/Can.jsx";

function NavItem({ to, icon: Icon, label, collapsed, end = false }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={collapsed ? label : undefined}
        className={`${collapsed ? "justify-center px-0" : "justify-start"}`}
      >
        <NavLink
          to={to}
          end={end}
          aria-label={label}
          className={[
            "group",
            collapsed
              ? "relative w-full grid place-items-center rounded-lg px-0 py-0.5"
              : "relative w-full flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/60 text-foreground/90 aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground aria-[current=page]:ring-1 aria-[current=page]:ring-brand/20 aria-[current=page]:before:absolute aria-[current=page]:before:left-[-6px] aria-[current=page]:before:top-1/2 aria-[current=page]:before:-translate-y-1/2 aria-[current=page]:before:h-5 aria-[current=page]:before:w-[3px] aria-[current=page]:before:rounded-full aria-[current=page]:before:bg-brand",
          ].join(" ")}
        >
          <span
            className={[
              collapsed
                ? "grid size-7 place-content-center shrink-0 rounded-md mx-0 my-0"
                : "grid size-7 place-content-center shrink-0 rounded-md",
              "bg-transparent hover:bg-brand-1/25",
              collapsed
                ? "group-aria-[current=page]:bg-accent group-aria-[current=page]:text-accent-foreground"
                : "aria-[current=page]:bg-brand-1/40",
            ].join(" ")}
          >
            <Icon
              className={collapsed ? "size-3.5 shrink-0" : "size-4 shrink-0"}
            />
          </span>
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function VehiclesCollapsibleMenu({ collapsed }) {
  const location = useLocation();
  const isVehiclesActive = location.pathname.startsWith("/vehicles");
  const [isOpen, setIsOpen] = useState(isVehiclesActive);

  // Si el sidebar está colapsado, mostramos solo el ícono sin collapsible
  if (collapsed) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip="Vehículos"
          className="justify-center px-0"
        >
          <NavLink
            to="/vehicles/models"
            aria-label="Vehículos"
            className="group relative w-full grid place-items-center rounded-lg px-0 py-0.5"
          >
            <span
              className={[
                "grid size-7 place-content-center shrink-0 rounded-md mx-0 my-0",
                "bg-transparent hover:bg-brand-1/25",
                isVehiclesActive
                  ? "bg-accent text-accent-foreground"
                  : "",
              ].join(" ")}
            >
              <Car className="size-3.5 shrink-0" />
            </span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={[
              "w-full flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-muted/60 text-foreground/90",
              // Solo aplicar estilos activos cuando está cerrado
              isVehiclesActive && !isOpen
                ? "bg-accent text-accent-foreground ring-1 ring-brand/20 before:absolute before:left-[-6px] before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-full before:bg-brand"
                : "",
            ].join(" ")}
          >
            <div className="flex items-center gap-2">
              <span
                className={[
                  "grid size-7 place-content-center shrink-0 rounded-md",
                  "bg-transparent hover:bg-brand-1/25",
                  isVehiclesActive && !isOpen ? "bg-brand-1/40" : "",
                ].join(" ")}
              >
                <Car className="size-4 shrink-0" />
              </span>
              <span className="truncate">Vehículos</span>
            </div>
            <ChevronDown
              className={`size-4 shrink-0 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-9 pt-1 space-y-1 relative">
          {/* Línea vertical al lado de las opciones */}
          <div className="absolute left-[26px] top-2 bottom-2 w-[2px] bg-border/50" />

          <NavLink
            to="/vehicles/models"
            className={({ isActive }) =>
              [
                "block rounded-md px-3 py-1.5 text-sm hover:bg-muted/60 transition-colors relative",
                isActive
                  ? "bg-muted text-foreground font-medium"
                  : "text-foreground/80",
              ].join(" ")
            }
          >
            Modelos
          </NavLink>
          <NavLink
            to="/vehicles/units"
            className={({ isActive }) =>
              [
                "block rounded-md px-3 py-1.5 text-sm hover:bg-muted/60 transition-colors relative",
                isActive
                  ? "bg-muted text-foreground font-medium"
                  : "text-foreground/80",
              ].join(" ")
            }
          >
            Unidades
          </NavLink>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export default function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const MENU = {
    reports: [
      {
        to: "/admin/reports",
        icon: BarChart3,
        label: "Dashboard de Reportes",
        roles: ["ADMIN"],
      },
    ],
    routes: [
      {
        to: "/admin/generic",
        icon: TestTube2,
        label: "Routes",
        roles: ["ADMIN"],
      },
    ],
    platform: [
      {
        to: "/admin/playground",
        icon: FolderKanban,
        label: "Playground",
        roles: ["ADMIN"],
      },
    ],
    docs: [{ to: "/admin/docs", icon: BookText, label: "Guías & Manuales" }],
  };

  return (
    <Sidebar
      collapsible="icon"
      className="sidebar-surface border-r overflow-hidden"
    >
      <SidebarHeader
        className={collapsed ? "px-4 pt-3 pb-3" : "px-4 pt-6 pb-4"}
      >
        <NavLink
          to="/"
          className={[
            "group flex items-center gap-3 rounded-md outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring",
            collapsed ? "justify-center px-0" : "",
          ].join(" ")}
        >
          <div className="relative grid size-9 shrink-0 rounded-xl overflow-hidden border border-[color-mix(in_oklab,var(--brand-1),transparent_55%)] bg-[color-mix(in_oklab,var(--brand-veil),transparent_78%)] backdrop-blur-md">
            <img
              src={logoUrl}
              alt="HQ"
              className="w-full h-full object-contain"
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl pointer-events-none [background:conic-gradient(from_20deg_at_50%_50%,color-mix(in_oklab,var(--brand-1),transparent_85%),color-mix(in_oklab,var(--brand-2),transparent_88%),color-mix(in_oklab,var(--brand-3),transparent_85%),color-mix(in_oklab,#8ad2ff,transparent_90%),color-mix(in_oklab,#ffd38a,transparent_90%),color-mix(in_oklab,var(--brand-2),transparent_88%))] mix-blend-screen opacity-70 [padding:1px] [-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] [-webkit-mask-composite:xor]"
            />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-[1.05rem] font-semibold tracking-tight">
                F<span className="text-sm relative -top-[1px]">&</span>Q
              </p>
              <p className="text-[0.8rem] text-muted-foreground">
                Administración
              </p>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent
        className={collapsed ? "px-1 overflow-hidden" : "px-2 overflow-hidden"}
      >
        <Can allowedRoles={["ADMIN"]}>
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              Reportes & Analiticas
            </SidebarGroupLabel>
            <SidebarGroupContent className="overflow-hidden">
              <SidebarMenu>
                {MENU.reports.map((item) => (
                  <NavItem key={item.to} {...item} collapsed={collapsed} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator className="sidebar-divider my-2" />
        </Can>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Gestión
          </SidebarGroupLabel>
          <SidebarGroupContent className="overflow-hidden">
            <SidebarMenu>
              {/* Vehículos con collapsible */}
              <VehiclesCollapsibleMenu collapsed={collapsed} />

              {/* Rutas con roles específicos */}
              <Can allowedRoles={["ADMIN"]}>
                {MENU.routes
                  .filter((i) => i.roles?.includes("ADMIN"))
                  .map((item) => (
                    <NavItem key={item.to} {...item} collapsed={collapsed} />
                  ))}
              </Can>
              <Can allowedRoles={["DOCTOR"]}>
                {MENU.routes
                  .filter((i) => i.roles?.includes("DOCTOR"))
                  .map((item) => (
                    <NavItem key={item.to} {...item} collapsed={collapsed} />
                  ))}
              </Can>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="sidebar-divider my-2" />

        <Can allowedRoles={["ADMIN"]}>
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              Plataforma
            </SidebarGroupLabel>
            <SidebarGroupContent className="overflow-hidden">
              <SidebarMenu>
                {MENU.platform.map((item) => (
                  <NavItem key={item.to} {...item} collapsed={collapsed} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator className="sidebar-divider my-2" />
        </Can>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Documentación
          </SidebarGroupLabel>
          <SidebarGroupContent className="overflow-hidden">
            <SidebarMenu>
              {MENU.docs.map((item) => (
                <NavItem key={item.to} {...item} collapsed={collapsed} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter
        className={
          collapsed
            ? "mt-auto border-t px-2 pt-2 pb-1"
            : "mt-auto border-t px-3 py-3"
        }
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  asChild
                  tooltip={collapsed ? "Cuenta" : undefined}
                  className={
                    collapsed ? "justify-center px-0" : "justify-start"
                  }
                >
                  <button
                    type="button"
                    className={
                      collapsed
                        ? "h-9 w-9 grid place-items-center rounded-md"
                        : "w-full cursor-pointer"
                    }
                    aria-label="Cuenta"
                  >
                    <Avatar
                      className={`flex items-center justify-center rounded-full text-white font-bold
                        ${collapsed ? "h-9 w-9 text-sm" : "h-8 w-10 text-base"} 
                        bg-gray-500`}
                    >
                      {user
                        ? `${user.firstName?.[0]?.toUpperCase() ?? ""}${
                            user.lastName?.[0]?.toUpperCase() ?? ""
                          }`
                        : "U"}
                    </Avatar>

                    {!collapsed && (
                      <div className="grid grow truncate text-left ml-2">
                        <span className="truncate text-sm font-medium">
                          {user
                            ? `${user.firstName} ${user.lastName}`
                            : "Usuario"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user?.email ?? "sin correo"}
                        </span>
                      </div>
                    )}
                  </button>
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" side="top" className="w-48">
                <DropdownMenuItem disabled>
                  {user ? `${user.firstName} ${user.lastName}` : "Usuario"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="focus:bg-muted dark:focus:bg-gray-700 dark:text-gray-100"
                >
                  Mi perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:bg-red-500"
                >
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
