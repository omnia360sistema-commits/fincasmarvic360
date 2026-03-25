import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import FarmSelector from "./pages/FarmSelector";
import FarmMap from "./pages/FarmMap";
import Dashboard from "./pages/Dashboard";
import Inventario from "./pages/Inventario";
import InventarioUbicacion from "./pages/InventarioUbicacion";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<FarmSelector />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/farm/:farmName" element={<FarmMap />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/inventario/:ubicacionId" element={<InventarioUbicacion />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;