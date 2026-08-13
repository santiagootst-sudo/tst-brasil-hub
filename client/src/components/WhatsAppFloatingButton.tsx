import { MessageCircle } from "lucide-react";

export function WhatsAppFloatingButton() {
  const whatsappUrl = "https://wa.me/5554999097610?text=Olá!%20Preciso%20de%20suporte%20e%20orientações%20sobre%20o%20TST%20Brasil%20Hub.";

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Suporte rápido via WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-[#25d366] px-4 py-3.5 text-white shadow-[0_10px_25px_rgba(37,211,102,.35)] transition-all duration-300 hover:scale-105 hover:bg-[#20ba5a] hover:shadow-[0_14px_30px_rgba(37,211,102,.45)] focus:outline-none focus:ring-4 focus:ring-[#25d366]/30"
    >
      <MessageCircle className="h-6 w-6 fill-white text-[#25d366]" />
      <span className="hidden text-xs font-bold tracking-wide sm:inline-block">Suporte WhatsApp</span>
    </a>
  );
}
