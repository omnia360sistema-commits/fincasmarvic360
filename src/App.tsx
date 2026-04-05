import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider } from "./context/SidebarContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
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
import PresenciaPanel from "./pages/PresenciaPanel";
import EstadoGeneral from "./pages/EstadoGeneral";
import Historicos from "./pages/Historicos";
import ExportarPDF from "./pages/ExportarPDF";
import NotFound from "./pages/NotFound";
import Trazabilidad from "./pages/Trazabilidad";
import Login from "./pages/Login";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-slate-300">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
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
        <Route path="/presencia" element={<PresenciaPanel />} />
        <Route path="/estado-general" element={<EstadoGeneral />} />
        <Route path="/historicos" element={<Historicos />} />
        <Route path="/exportar-pdf" element={<ExportarPDF />} />
        <Route path="/trazabilidad" element={<Trazabilidad />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const App = () => (
  <ThemeProvider>
    <SidebarProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </SidebarProvider>
  </ThemeProvider>
);

export default App;