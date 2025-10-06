import React from "react";
import { Outlet } from "react-router-dom";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/shadcn/sidebar";
import AdminSidebar from "@/inc/admin/AdminSidebar";
import AdminBreadcrumbs from "@/inc/admin/AdminBreadcrumbs";
import ThemeToggle from "@/inc/theme/ThemeToggle.jsx";

export default function AdminLayout() {
    return (
        <SidebarProvider>
            <div className="flex h-dvh w-full overflow-hidden">
                {/* Sidebar fijo */}
                <AdminSidebar />

                {/* Panel derecho: ocupa TODO el espacio y es el que scrollea */}
                <SidebarInset className="flex flex-1 min-w-0 flex-col bg-background overflow-y-auto">
                    <header className="sticky top-0 z-30 w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
                        <div className="flex h-14 w-full items-center justify-between gap-3 px-4 md:px-6 lg:px-8">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <SidebarTrigger
                                    className="rounded-xl border px-3 py-2 text-sm hover:bg-accent/50"
                                    aria-label="Toggle sidebar"
                                    title="Abrir/Cerrar menú"
                                />
                                <div className="min-w-0 flex-1 truncate">
                                    <AdminBreadcrumbs />
                                </div>
                            </div>
                            <div className="shrink-0">
                                <ThemeToggle />
                            </div>
                        </div>
                    </header>

                    <main className="mx-auto w-full max-w-7xl flex-1 px-4 md:px-6 lg:px-8 py-6">
                        <Outlet />
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
