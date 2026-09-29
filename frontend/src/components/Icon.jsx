export default function Icon({ name, size = 20, className = "", title }) {
  if (name === "whatsapp") {
    return (
      <img
        src="/images/whatsapp-black-white.svg"
        alt={title || "WhatsApp"}
        className={`lcp-icon lcp-icon-image ${className}`}
        width={size}
        height={size}
      />
    );
  }

  const paths = {
    home: <path d="M3 10.5 12 3l9 7.5v8a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 18.5z" />,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    pin: <><path d="M12 21s7-6.1 7-12A7 7 0 0 0 5 9c0 5.9 7 12 7 12Z" /><circle cx="12" cy="9" r="2.2" /></>,
    doctor: <><circle cx="12" cy="7" r="3" /><path d="M5 21a7 7 0 0 1 14 0M9 13h6" /></>,
    phone: <><path d="M7.3 3.2 5.6 4.8c-.6.6-.7 1.5-.3 2.3 1.8 3.8 4.8 6.8 8.6 8.6.8.4 1.7.3 2.3-.3l1.6-1.7a1.5 1.5 0 0 0 .2-1.8l-1.2-1.8a1.5 1.5 0 0 0-1.8-.5l-1.6.7a11.4 11.4 0 0 1-4.3-4.3l.7-1.6a1.5 1.5 0 0 0-.5-1.8L9.1 3a1.5 1.5 0 0 0-1.8.2Z" /></>,
    map: <><path d="m9 18-6-3V6l6 3 6-3 6 3v9l-6-3-6 3Z" /><path d="M9 9v9M15 6v9" /></>,
    lab: <><path d="M9 3h6M10 3v6l-5.2 9.2A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-2.8L14 9V3" /><path d="M7.5 16h9" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.2 8.4-8 10-4.8-1.6-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    rupee: <><path d="M5 5h13M5 9h10M8 5c4 0 6 1.5 6 4s-2 4-6 4h-.5l7.5 6" /></>,
    heart: <path d="M20.8 8.8c0 5.5-8.8 10.7-8.8 10.7S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" />,
    check: <path d="m5 12 4.2 4L19 6" />,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    arrow: <path d="m9 6 6 6-6 6" />,
    back: <path d="m15 18-6-6 6-6" />,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    facebook: <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.7.3-1 1-1Z" />,
    instagram: <><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.3" cy="6.8" r=".8" fill="currentColor" stroke="none"/></>,
    youtube: <><rect x="3" y="6" width="18" height="12" rx="3"/><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none"/></>,
    x: <><path d="M5 4 19 20M19 4 5 20" /></>,
    report: <><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 11h6M9 15h6"/></>,
  };

  return (
    <svg
      className={`lcp-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {paths[name] || paths.lab}
    </svg>
  );
}
