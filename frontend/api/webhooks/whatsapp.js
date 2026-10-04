import React from "react";
import "../styles.css";

const WhatsAppButton = () => {
  const whatsappNumber = "919910108453";
  const message = "Hi, I would like to know more about your tests and health packages.";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;

  const handleWhatsAppClick = () => {
    window.location.assign(whatsappUrl);
  };
};

export default WhatsAppButton;
