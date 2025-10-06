import React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/reactQueryClient";
import { Toaster } from "sonner";
import ThemeProvider from "@/inc/theme/ThemeProvider";

export default function AppProviders({ children }) {
    return (
        <QueryClientProvider client={queryClient} contextSharing>
            <ThemeProvider>
                <BrowserRouter>
                    {children}
                </BrowserRouter>
                <Toaster position="top-right" richColors />
            </ThemeProvider>
        </QueryClientProvider>
    );
}
