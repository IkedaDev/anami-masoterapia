import { CONFIG } from "@/config/const";
import type { MouseEventHandler } from "react";

const WhatsAppButton = () => {
  const openWhatsApp = (event: React.MouseEvent<HTMLImageElement>) => {
    const phone = CONFIG.phone;
    const message = CONFIG.whatsAppText;
    const webWhatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${message}`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      open(webWhatsappUrl);
    } else {
      open(webWhatsappUrl, "__blank");
    }
  };

  return (
    <>
      <img
        onClick={openWhatsApp}
        className="fixed bottom-5 right-5 hover:drop-shadow-2xl transition-all cursor-pointer z-30"
        src="/WhatsApp.svg"
        alt="WhatsApp Anami Masoterapia"
        width="60"
        height="60"
        id="btn-whatsapp-contact"
      />
    </>
  );
};

export default WhatsAppButton;
