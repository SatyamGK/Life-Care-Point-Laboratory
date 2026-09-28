import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "./Icon";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="mobile-header">
      <div className="header-left">
        {!isHome ? (
          <button type="button" className="header-back" onClick={() => navigate(-1)} aria-label="Go back">
            <Icon name="back" size={20} />
          </button>
        ) : <span className="header-back-placeholder" aria-hidden="true" />}

        <Link to="/" className="header-brand" aria-label="Life Care Point Laboratory Home">
          <div className="header-logo-image">
            <img src="/images/life-care-point-logo.png" alt="Life Care Point Laboratory" />
          </div>
          <div className="header-brand-text">
            <strong>Life Care Point</strong>
            <span>LABORATORY</span>
          </div>
        </Link>
      </div>

      <button type="button" className="header-menu-button" onClick={() => navigate("/menu")} aria-label="Open menu">
        <Icon name="menu" size={17} />
      </button>
    </header>
  );
}
