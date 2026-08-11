import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppDashboard from "./pages/AppDashboard";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import PgrApp from "./pages/PgrApp";
import Pricing from "./pages/Pricing";

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/planos" component={Pricing} /><Route path="/app/pgr" component={PgrApp} /><Route path="/app" component={AppDashboard} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
