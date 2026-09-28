import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollRestoration() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, [pathname, search]);

  return null;
}
