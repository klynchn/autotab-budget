import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import Receipts from "./pages/Receipts";
import AddPurchase from "./pages/AddPurchase";
import Insights from "./pages/Insights";
import BudgetSetup from "./pages/BudgetSetup";
import Subscriptions from "./pages/Subscriptions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/add" element={<AddPurchase />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/settings" element={<BudgetSetup />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
