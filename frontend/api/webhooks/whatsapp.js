
import React from "react";
import "./WhatsAppButton.css";

const WhatsAppButton = ({
  phoneNumber,
  message = "Hi",
  children = "Chat on WhatsApp",
}) => {
  // WhatsApp requires the complete international number
  // without +, spaces, brackets or dashes.
  const cleanNumber = String(phoneNumber).replace(/\D/g, "");

  // Encode the complete message.
  const encodedMessage = encodeURIComponent(message);

  // Official WhatsApp Click-to-Chat URL.
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      className="whatsapp-button"
      aria-label="Chat on WhatsApp"
    >
      <span className="whatsapp-button-icon" aria-hidden="true">
        <svg
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="currentColor"
            d="M16.04 3C8.84 3 3 8.84 3 16c0 2.3.61 4.45 1.68 6.31L3 29l6.88-1.66A12.96 12.96 0 0 0 16.04 29C23.2 29 29 23.16 29 16S23.2 3 16.04 3Zm0 23.63c-1.98 0-3.9-.57-5.55-1.65l-.4-.24-4.08.99 1.1-3.96-.26-.41A10.72 10.72 0 0 1 5.3 16c0-5.92 4.82-10.74 10.74-10.74S26.78 10.08 26.78 16s-4.82 10.63-10.74 10.63Zm5.88-8.01c-.32-.16-1.88-.93-2.17-1.04-.29-.1-.5-.16-.71.16-.21.32-.81 1.04-.99 1.25-.18.21-.36.24-.68.08-.32-.16-1.36-.5-2.59-1.6-.96-.85-1.61-1.9-1.79-2.22-.18-.32-.02-.5.14-.66.15-.15.32-.36.48-.54.16-.18.21-.31.32-.52.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.25-.61-.51-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.07 1.3 3.28c.16.21 2.24 3.43 5.45 4.81.76.33 1.35.53 1.81.68.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.52.26-.75.26-1.39.18-1.52-.08-.13-.29-.21-.61-.37Z"
          />
        </svg>
      </span>

      <span>{children}</span>
    </a>
  );
};

export default WhatsAppButton;