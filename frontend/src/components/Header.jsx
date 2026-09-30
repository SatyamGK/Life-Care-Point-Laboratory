import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "./Icon";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

  const handleBack = () => {
    if (!isHome) {
      navigate(-1);
    }
  };

  return (
    <header className="mobile-header">

      <div className="header-left">

        {/* Back button */}
        {!isHome ? (
          <button type="button" className="header-back" onClick={handleBack} aria-label="Go back"><Icon name="back" size={19} /></button>
        ) : (
          <span className="header-back-placeholder"></span>
        )}

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
        <Icon name="menu" size={16} />
      </button>

    </header>
  );
}