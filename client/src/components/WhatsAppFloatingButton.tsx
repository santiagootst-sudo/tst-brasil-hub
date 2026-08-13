import { MessageCircle } from "lucide-react";

export function WhatsAppFloatingButton() {
  const whatsappUrl = "https://wa.me/5554999097610?text=Olá!%20Preciso%20de%20suporte%20e%20orientações%20sobre%20o%20TST%20Brasil%20Hub.";

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Abrir suporte via WhatsApp"
      title="Abrir suporte via WhatsApp"
      className="fixed bottom-4 right-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_8px_18px_rgba(37,211,102,.28)] transition-transform duration-200 hover:scale-105 hover:bg-[#20ba5a] hover:shadow-[0_10px_22px_rgba(37,211,102,.34)] focus:outline-none focus:ring-4 focus:ring-[#25d366]/30 active:scale-95 sm:bottom-5 sm:right-5"
    >
      <MessageCircle className="h-5 w-5 fill-white text-[#25d366]" />
    </a>
  );
}
