import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppDashboard from "./pages/AppDashboard";
import AdminPanel from "./pages/AdminPanel";
import Certificates from "./pages/Certificates";
import Home from "./pages/Home";
import Library from "./pages/Library";
import Materials from "./pages/Materials";
import NotFound from "./pages/NotFound";
import Operations from "./pages/Operations";
import Inspections from "./pages/Inspections";
import Commercial from "./pages/Commercial";
import Organization from "./pages/Organization";
import PgrApp from "./pages/PgrApp";
import Pricing from "./pages/Pricing";
import Support from "./pages/Support";
import Trainings from "./pages/Trainings";
import WorkspaceOverview from "./pages/WorkspaceOverview";

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/planos" component={Pricing} /><Route path="/admin" component={AdminPanel} /><Route path="/app/visao" component={WorkspaceOverview} /><Route path="/app/estrutura" component={Organization} /><Route path="/app/operacao" component={Operations} /><Route path="/app/inspecoes" component={Inspections} /><Route path="/app/clientes" component={Commercial} /><Route path="/app/agenda" component={Commercial} /><Route path="/app/treinamentos" component={Trainings} /><Route path="/app/biblioteca" component={Library} /><Route path="/app/materiais" component={Materials} /><Route path="/app/suporte" component={Support} /><Route path="/app/certificados" component={Certificates} /><Route path="/app/pgr" component={PgrApp} /><Route path="/app" component={AppDashboard} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
