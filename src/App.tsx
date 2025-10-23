import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdvertiserRegister from "./pages/AdvertiserRegister";
import ScreenOwnerRegister from "./pages/ScreenOwnerRegister";
import ScreenDisplay from "./pages/ScreenDisplay";
import AdvertiserDashboard from "./pages/AdvertiserDashboard";
import CreateCampaignPage from "./pages/CreateCampaignPage";
import EditCampaignPage from "./pages/EditCampaignPage";
import ScreenOwnerDashboard from "./pages/ScreenOwnerDashboard";
import QRRedirect from "./pages/QRRedirect";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/advenue-smart-space">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/advertiser" element={<AdvertiserRegister />} />
          <Route path="/register/screen-owner" element={<ScreenOwnerRegister />} />
          <Route path="/screen" element={<ScreenDisplay />} />
          <Route path="/dashboard/advertiser" element={<AdvertiserDashboard />} />
          <Route path="/dashboard/advertiser/create-campaign" element={<CreateCampaignPage />} />
          <Route path="/dashboard/advertiser/edit-campaign/:campaignId" element={<EditCampaignPage />} />
          <Route path="/dashboard/owner" element={<ScreenOwnerDashboard />} />
          <Route path="/scan" element={<QRRedirect />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
