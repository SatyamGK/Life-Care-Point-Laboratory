
import { useNavigate } from "react-router-dom";

import { packages } from "../data/packages";
import { recommendedTests } from "../data/tests";

import MedicalArt from "../components/MedicalArt";

export default function Home() {
  const navigate = useNavigate();

  /* =====================================================
     DATA
  ===================================================== */

  const areas = [
    "Indirapuram",
    "Vaishali",
    "Vasundhara",
    "Kaushambi",
    "Sahibabad",
    "Siddharth Vihar",
    "Vijay Nagar",
    "Crossing Republik",
    "Noida Sec-62",
    "Noida Sec-63",
  ];

  const milestones = [
    "ISO certified",
    "50+ Doctors & 5+ Hospitals network",
    "Advanced lab equipment upgraded",
    "Trusted by 1 Lakh+ families",
    "Community health initiatives",
    "Third location opened",
  ];

  const whyChooseUs = [
    {
      icon: "⌂",
      title: "Home collection",
      description: "Sample pickup at your door",
    },
    {
      icon: "◷",
      title: "Priority reports",
      description: "Results shared quickly",
    },
    {
      icon: "⌖",
      title: "Multiple locations",
      description: "Visit your nearest lab",
    },
    {
      icon: "✓",
      title: "Trusted by Doctors",
      description: "Backed by more than 50+",
    },
    {
      icon: "◉",
      title: "WhatsApp support",
      description: "Chat with our team",
    },
    {
      icon: "♙",
      title: "Trained staff",
      description: "Experienced professionals",
    },
    {
      icon: "♧",
      title: "Affordable pricing",
      description: "Quality diagnostics at fair prices",
    },
    {
      icon: "◫",
      title: "Patient first",
      description: "Friendly service focused on your comfort",
    },
  ];


  /* =====================================================
     ACTIONS
  ===================================================== */

  const openHealthPartner = () => {
    navigate("/book-test");
  };


  const openPackages = () => {
    navigate("/packages");
  };


  const openTests = () => {
    navigate("/tests");
  };


  const openPackageDetails = (item) => {
    navigate("/package-info", {
      state: {
        packageData: item,
      },
    });
  };


  const openTestDetails = (item) => {
    navigate("/test-info", {
      state: {
        test: item,
      },
    });
  };


  const openWhatsApp = () => {
    window.open(
      "https://wa.me/919910108453",
      "_blank",
      "noopener,noreferrer"
    );
  };


  /* =====================================================
     HOME PAGE
  ===================================================== */

  return (
    <div className="home-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="home-hero">

        <div className="home-hero-content">

          <h1>
            We Are Your Health
            <br />
            Care Partner
          </h1>

          <p>
            Every Blood Test has a story to tell and with over 25+ years of experience,
            we know how to deliver it with high precision.
          </p>

        </div>

        <div className="hero-animation-container">
          <video className="hero-animation-video" autoPlay muted loop playsInline preload="metadata" controls={false} >
            <source src="/videos/hero-animation.webm" type="video/webm" />
            <source src="/videos/hero-animation.mp4" type="video/mp4" />

            Your browser does not support HTML5 video.
          </video>
        </div>

        {/* DOCTOR BADGE */}

        <div className="doctor-badge">
          TRUSTED AND RECOMMENDED BY DOCTORS
        </div>

      </section>


      {/* =================================================
          FREE HOME SAMPLE COLLECTION
      ================================================= */}

      <section className="home-collection-section">

        <h2>
          Free Home Sample
          <br />
          Collection
        </h2>


        <p className="collection-description">
          Professional hygienic tests collected comfortably
          <br />
          from your doorstep.
        </p>


        {/* CARTOON COLLECTION IMAGE */}

        <div className="collection-image">
          <img src="/images/home-collection.png" alt="Home sample collection" />
        </div>


        {/* AREAS */}

        <div className="areas-heading">

          <strong>
            Areas We Serve
          </strong>

          <span>
            10+ Regions
          </span>

        </div>

        <div className="areas-grid">

          {areas.map((area) => (

            <div className="area-chip" key={area} >

              <span>
                📍
              </span>

              {area}

            </div>

          ))}

        </div>

        {/* HOW IT WORKS */}

        <div className="how-it-works">

          <h3>
            How It Works
          </h3>

          {/* STEP 1 */}

          <div className="work-step">

            <div className="work-icon">
              ▣
            </div>

            <div>

              <strong>
                Book Online
              </strong>

              <p>
                Select your required tests or health packages
                <br />
                & fill-up your details.
              </p>

            </div>

            <span className="work-number">
              1
            </span>

          </div>

          {/* STEP 2 */}

          <div className="work-step">

            <div className="work-icon">
              ♙
            </div>

            <div>

              <strong>
                Sample Collection at Home
              </strong>

              <p>
                A certified technician visits your address using
                <br />
                certified sterile kits.
              </p>

            </div>

            <span className="work-number">
              2
            </span>

          </div>

          {/* STEP 3 */}

          <div className="work-step">

            <div className="work-icon">
              ▤
            </div>

            <div>

              <strong>
                Get Reports
              </strong>

              <p>
                Receive highly accurate digital reports
                <br />
                securely via email & SMS within 24 hours.
              </p>

            </div>

            <span className="work-number">
              3
            </span>

          </div>

        </div>

      </section>


      {/* =================================================
          ACHIEVEMENTS
      ================================================= */}

      <section className="achievements-section">

        <h2>
          Achievements
        </h2>


        <div className="achievement-stats">

          <div>

            <strong>
              5 Lakh+
            </strong>

            <span>
              Overall tests performed
            </span>

          </div>

          <div>

            <strong>
              1 Lakh+
            </strong>

            <span>
              Happy families
            </span>

          </div>

          <div>

            <strong>
              25+
            </strong>

            <span>
              Years of experience
            </span>

          </div>

          <div>

            <strong>
              10+
            </strong>

            <span>
              Areas we serve
            </span>

          </div>

        </div>


        {/* MILESTONES */}

        <div className="milestones-card">

          <h3>
            Milestones
          </h3>


          {milestones.map((milestone) => (

            <div className="milestone-row" key={milestone} >

              <span>
                ✓
              </span>

              <strong>
                {milestone}
              </strong>

            </div>

          ))}

        </div>

      </section>


      {/* =================================================
          HEALTH PACKAGES & TESTS
      ================================================= */}

      <section className="home-packages-section">

        <div className="section-title-row">

          <h2>
            Health Packages & Tests
          </h2>

          <button type="button" onClick={openPackages} >
            Swipe →
          </button>

        </div>


        {/* HORIZONTAL PACKAGE CARDS */}

        <div className="package-horizontal-list">

          {packages
            .slice(0, 5)
            .map((item, index) => (

              <article className="home-package-card"
                key={
                  item.id ||
                  item.name ||
                  index
                }
                role="button" tabIndex={0} onClick={() =>
                  openPackageDetails(item)
                }
                onKeyDown={(event) => {

                  if ( event.key === "Enter" || event.key === " " ) {
                    openPackageDetails(item);
                  }

                }}
              >

                {/* CARTOON IMAGE */}

                <div className="home-package-image">

                  <MedicalArt type={
                      item.type ||
                      "full-body"
                    }
                  />

                </div>

                {/* CARD BODY */}

                <div className="home-package-body">

                  <h3>
                    {item.name}
                  </h3>


                  <p>
                    {item.description ||
                      "Comprehensive health screening package"}
                  </p>


                  <div className="home-price">

                    {item.oldPrice && (
                      <del>
                        ₹{item.oldPrice}
                      </del>
                    )}

                    <strong>
                      ₹{item.price}
                    </strong>

                  </div>

                </div>

              </article>

            ))}

        </div>


        {/* EXPLORE MORE */}

        <button type="button" className="explore-more-button" onClick={openPackages} >
          Explore More
        </button>

      </section>


      {/* =================================================
          MOST RECOMMENDED TESTS
      ================================================= */}

      <section className="recommended-section">

        <h2>
          Most Recommended Tests
        </h2>


        <div className="recommended-list">

          {recommendedTests
            .slice(0, 4)
            .map((test, index) => (

              <div className="recommended-row" key={ test.id || test.name || index } role="button" tabIndex={0} onClick={() =>
                  openTestDetails(test)
                }
                onKeyDown={(event) => {

                  if ( event.key === "Enter" || event.key === " " ) {
                    openTestDetails(test);
                  }

                }}
              >

                {/* TEST ICON */}

                <div className="recommended-icon">

                  <MedicalArt type={ test.type || "cbc" } />

                </div>


                {/* TEST DETAILS */}

                <div className="recommended-info">

                  <strong>
                    {test.name}
                  </strong>

                  <span>

                    {test.parameters ? `${test.parameters} parameters` : "Diagnostic test"}

                    {" • "}

                    {test.oldPrice && (
                      <del>
                        ₹{test.oldPrice}
                      </del>
                    )}

                    {" "}

                    ₹{test.price}

                  </span>

                </div>


                {/* BOOK NOW */}

                <button type="button" onClick={(event) => {
                    event.stopPropagation();
                    navigate(
                      "/test-booking",
                      {
                        state: { test, },
                      }
                    );

                  }}
                >
                  Book Now
                </button>

              </div>

            ))}

        </div>

      </section>


      {/* =================================================
          WHY CHOOSE US
      ================================================= */}

      <section id="why-choose-us" className="why-section">

        <h2>
          Why Choose Us
        </h2>


        <div className="why-grid">

          {whyChooseUs.map(
            (item) => (

              <div
                className="why-card"
                key={item.title}
              >

                <div className="why-icon">
                  {item.icon}
                </div>

                <strong>
                  {item.title}
                </strong>

                <span>
                  {item.description}
                </span>

              </div>

            )
          )}

        </div>

      </section>


      {/* =================================================
          CONTACT US
      ================================================= */}

      <section className="contact-section">

        <h2>
          Contact Us
        </h2>


        {/* GOOGLE MAP */}

        <a className="contact-map" href="https://www.google.com/maps/search/?api=1&query=Life+Care+Point+Laboratory+Indirapuram+Ghaziabad" target="_blank" rel="noopener noreferrer" aria-label="Open Life Care Point Laboratory in Google Maps" >

          <div className="map-visual">

            <span className="map-marker">
              ♥
            </span>

            <strong>
              Life Care Point Laboratory
            </strong>

            <small>
              Tap to open Google Maps
            </small>

          </div>

        </a>


        {/* ADDRESS */}

        <div className="contact-card">

          <div className="contact-icon location-pin-icon">
            📍
          </div>

          <div>

            <b>
              Address
            </b>

            <p>
              Life Care Point Laboratory,
              <br />
              1033, Ground Floor, Niti Khand-1,
              <br />
              Opposite Orange County,
              <br />
              Indirapuram, Ghaziabad,
              <br />
              Uttar Pradesh - 201014
            </p>

          </div>

        </div>


        {/* PHONE */}

        <a
          href="tel:+919910108453"
          className="contact-card"
        >

          <div className="contact-icon">
            ☎
          </div>

          <div>

            <b>
              Contact Number
            </b>

            <p>
              +91 9910108453
            </p>

          </div>

        </a>


        {/* TIMINGS */}

        <div className="contact-card">

          <div className="contact-icon">
            ◷
          </div>

          <div>

            <b>
              Timings
            </b>

            <p>
              Mon-Sat: 8:00 AM - 8:00 PM
              <br />
              Sunday: 8:00 AM - 2:00 PM
            </p>

          </div>

        </div>


        {/* SOCIAL */}

        <div className="follow-us">

          <span>
            Follow Us
          </span>

          <div>

            <a href="https://www.facebook.com/lifecarepointlaboratory/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" >
              f
            </a>

            <a href="https://www.instagram.com/lifecarepointlaboratory/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" >
              ◎
            </a>

            <a href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label="X" >
              𝕏
            </a>

            <a href="https://https://www.youtube.com/@lifecarepointlaboratory/" target="_blank" rel="noopener noreferrer" aria-label="YouTube" >
              ▶
            </a>

          </div>

        </div>

      </section>

    </div>
  );
}