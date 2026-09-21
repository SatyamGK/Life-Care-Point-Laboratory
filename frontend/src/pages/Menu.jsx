import { useNavigate } from "react-router-dom";

export default function Menu() {
  const navigate = useNavigate();

  const goTo = (path) => {
    navigate(path);
  };

  return (
    <section className="menu-page">

      <div className="menu-panel">

        {/* Menu Header */}
        <div className="menu-topbar">

          <span className="menu-title">
            MENU
          </span>

          <button type="button" className="menu-close-button" onClick={() => navigate(-1)} aria-label="Close menu" >
            ×
          </button>

        </div>


        {/* Navigation */}
        <nav className="menu-navigation">

          {/* Home */}
          <button type="button" className="menu-navigation-item" onClick={() => goTo("/")} >
            <span className="menu-navigation-label">
              Home
            </span>

            <span className="menu-navigation-arrow">
              ›
            </span>
          </button>


          {/* Achievements */}
          <button type="button" className="menu-navigation-item" onClick={() => goTo("/achievements")} >
            <span className="menu-navigation-label">
              Achievements
            </span>

            <span className="menu-navigation-arrow">
              ›
            </span>
          </button>


          {/* Health Packages */}
          <button type="button" className="menu-navigation-item menu-packages-item" onClick={() => goTo("/packages")} >
            <span className="menu-navigation-label">
              Health Packages
            </span>

            <span className="menu-navigation-arrow">
              ›
            </span>
          </button>

          {/* Tests */}
          <button type="button" className="menu-navigation-item" onClick={() => goTo("/tests")} >
            <span className="menu-navigation-label">
              Tests
            </span>

            <span className="menu-navigation-arrow">
              ›
            </span>
          </button>


          {/* KEY FEATURES - FIXED */}
          <button type="button" className="menu-navigation-item" onClick={() => goTo("/key-features")} >
            <span className="menu-navigation-label">
              Key Features
            </span>

            <span className="menu-navigation-arrow">
              ›
            </span>
          </button>


          {/* Contact */}
          <button type="button" className="menu-navigation-item" onClick={() => goTo("/contact")} >
            <span className="menu-navigation-label">
              Contact
            </span>

            <span className="menu-navigation-arrow">
              ›
            </span>
          </button>

        </nav>

      </div>

    </section>
  );
}