import React from "react";
import "./WhatsAppButton.css";

const WhatsAppButton = () => {
  const WHATSAPP_NUMBER = "919910108453";
  const MESSAGE = "Hi";
  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(MESSAGE);
    const whatsappUrl =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.location.href = whatsappUrl;
  };
};

export default WhatsAppButton;