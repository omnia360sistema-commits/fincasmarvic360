import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider } from "./context/SidebarContext";
import AppLayout from "./components/AppLayout";
import FarmSelector from "./pages/FarmSelector";
import FarmMap from "./pages/FarmMap";
import Dashboard from "./pages/Dashboard";
import Inventario from "./pages/Inventario";
import InventarioUbicacion from "./pages/InventarioUbicacion";
import ParteDiario from "./pages/ParteDiario";
import Trabajos from "./pages/Trabajos";
import Logistica from "./pages/Logistica";
import Maquinaria from "./pages/Maquinaria";
import Personal from "./pages/Personal";
import QRCuadrilla from "./pages/QRCuadrilla";
import EstadoGeneral from "./pages/EstadoGeneral";
import Historicos from "./pages/Historicos";
import ExportarPDF from "./pages/ExportarPDF";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <SidebarProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/qr/:cuadrilla_id" element={<QRCuadrilla />} />
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/farm" element={<FarmSelector />} />
                <Route path="/farm/:farmName" element={<FarmMap />} />
                <Route path="/inventario" element={<Inventario />} />
                <Route path="/inventario/:ubicacionId" element={<InventarioUbicacion />} />
                <Route path="/parte-diario" element={<ParteDiario />} />
                <Route path="/trabajos" element={<Trabajos />} />
                <Route path="/logistica" element={<Logistica />} />
                <Route path="/maquinaria" element={<Maquinaria />} />
                <Route path="/personal" element={<Personal />} />
                <Route path="/estado-general" element={<EstadoGeneral />} />
                <Route path="/historicos" element={<Historicos />} />
                <Route path="/exportar-pdf" element={<ExportarPDF />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </SidebarProvider>
  </ThemeProvider>
);

export default App;