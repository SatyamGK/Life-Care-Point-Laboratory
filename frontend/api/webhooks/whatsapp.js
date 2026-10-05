
import React from "react";
import "./WhatsAppButton.css";

const WhatsAppButton = ({
  phoneNumber = "919876543210",
  message = "Hi",
  children = "Chat on WhatsApp",
}) => {
  // Keep only numbers
  const cleanPhoneNumber = String(phoneNumber).replace(/\D/g, "");

  // Encode the message
  const encodedMessage = encodeURIComponent(message);

  // WhatsApp universal URL
  const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      className="whatsapp-button"
      aria-label="Chat with us on WhatsApp"
    >
      <svg
        className="whatsapp-icon"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M16.04 3C8.86 3 3.03 8.83 3.03 16c0 2.3.61 4.46 1.68 6.33L3 29l6.83-1.69A12.94 12.94 0 0 0 16.04 29C23.21 29 29 23.17 29 16S23.21 3 16.04 3Zm0 23.67c-2.02 0-3.9-.59-5.49-1.61l-.39-.23-4.05 1 1.08-3.94-.25-.41A10.72 10.72 0 0 1 5.25 16c0-5.95 4.84-10.79 10.79-10.79S26.83 10.05 26.83 16s-4.84 10.67-10.79 10.67Zm5.91-8.05c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.81 1.03-.99 1.24-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.89-1.77-2.21-.18-.32-.02-.49.14-.65.15-.15.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.63-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.63s1.14 3.05 1.3 3.26c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.53 1.81.68.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.26-.74.26-1.37.18-1.51-.08-.13-.29-.21-.61-.37Z"
          fill="currentColor"
        />
      </svg>

      <span>{children}</span>
    </a>
  );
};

export default WhatsAppButton;
