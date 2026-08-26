import { ArrowRight, BriefcaseBusiness, ChevronRight, ClipboardCheck, FileText, HardHat, LayoutDashboard } from "lucide-react";
import { publicAssetUrls } from "@shared/publicAssets";
import { PortalLandingSections } from "@/components/PortalLandingSections";
import { officialTstBrasilHubLogo } from "@/lib/brand";
import "./portal-landing-hero.css";
import "./portal-official-logo.css";

type PortalLandingHeroProps = { onEnter: () => void };

const whatsAppUrl = "https://wa.me/5554999097610?text=Ol%C3%A1%21%20Quero%20ver%20como%20o%20Portal%20TST%20se%20aplica%20%C3%A0%20minha%20opera%C3%A7%C3%A3o.";

export function PortalLandingHero({ onEnter }: PortalLandingHeroProps) {
  return (
    <>
      <header className="portal-hero-header">
        <a href="#inicio" className="portal-brand" aria-label="TST Brasil Hub, início"><img className="portal-brand-logo" src={officialTstBrasilHubLogo} alt="Logo oficial TST Brasil Hub" /><span><small>Gestão de SST</small></span></a>
        <nav aria-label="Navegação principal"><a href="#operacao">Soluções</a><a href="#empresas">Para Empresas</a><a href="#profissionais">Para Profissionais</a><a href="#ecossistema">Conhecimento</a><a href="#planos">Planos</a></nav>
        <button type="button" className="portal-access" onClick={onEnter}><LayoutDashboard size={16} /><span><small>ÁREA DO CLIENTE</small><b>Entrar no portal</b></span><ChevronRight size={14} /></button>
      </header>
      <section id="inicio" className="portal-hero" style={{ backgroundImage: `url(${publicAssetUrls.hero})` }}>
        <div className="portal-hero-overlay" />
        <div className="portal-hero-grid" aria-hidden="true" />
          <div className="portal-hero-inner">
          <div className="portal-hero-copy"><div className="portal-hero-logo-plaque"><img src={officialTstBrasilHubLogo} alt="Logo oficial TST Brasil Hub" /></div><span className="portal-eyebrow"><i />TST Brasil Hub · Gestão de SST</span><h1>Gestão de SST<br /><em>em um só portal.</em></h1><p>Organize PGR, inspeções, EPIs e documentos em uma rotina mais clara — para acompanhar o que importa e agir no momento certo.</p><div className="portal-route-system"><a className="portal-route portal-route-primary" href="#jornadas"><span>01</span><strong>Escolher ambiente</strong><ArrowRight size={17} /></a><a className="portal-route portal-route-commercial" href={whatsAppUrl} target="_blank" rel="noreferrer"><span>02</span><strong>Falar com especialista</strong><ArrowRight size={17} /></a><button type="button" className="portal-route portal-route-existing" onClick={onEnter}><span>03</span><strong>Entrar no portal</strong><LayoutDashboard size={16} /></button></div></div>
          <div className="portal-radar" aria-label="Radar de prioridades da rotina SST"><div className="portal-orbit portal-orbit-one" /><div className="portal-orbit portal-orbit-two" /><div className="portal-orbit portal-orbit-three" /><div className="portal-radar-core"><img className="portal-radar-logo" src={officialTstBrasilHubLogo} alt="Logo TST Brasil Hub" /><span>RADAR TST</span><strong>Transforme pendências<br />em próximas ações.</strong><p>Responsável, prazo e evidência na mesma decisão.</p></div><div className="portal-signal portal-signal-doc"><FileText size={19} /><div><small>EVIDÊNCIA</small><strong>Validade e documentos no acervo.</strong></div><i /></div><div className="portal-signal portal-signal-action"><ClipboardCheck size={19} /><div><small>PRÓXIMA AÇÃO</small><strong>Defina responsável e prazo.</strong></div><i /></div><div className="portal-signal portal-signal-epi"><HardHat size={19} /><div><small>STATUS PREVENTIVO</small><strong>CA, estoque e aceite conectados.</strong></div><i /></div><div className="portal-radar-sequence"><span>responsável</span><b /> <span>prazo</span><b /> <span>ação</span><b /> <span>evidência</span></div></div>
        </div>
      </section>
      <PortalLandingSections onEnter={onEnter} />
    </>
  );
}
