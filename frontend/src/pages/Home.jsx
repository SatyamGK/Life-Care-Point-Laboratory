import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import MedicalArt from "../components/MedicalArt";
import { packages } from "../data/packages";
import { tests } from "../data/tests";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  /* =========================================================
     AREAS
     ========================================================= */

  const collectionAreas = [
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

  /* =========================================================
     HOW IT WORKS
     ========================================================= */

  const howItWorks = [
    {
      number: "1",
      icon: "▣",
      title: "Book Online",
      description:
        "Select your required tests or health packages & fill-up your details.",
    },
    {
      number: "2",
      icon: "♙",
      title: "Sample Collection at Home",
      description:
        "A certified technician visits your address using certified sterile kits.",
    },
    {
      number: "3",
      icon: "▤",
      title: "Get Reports",
      description:
        "Receive highly accurate digital reports securely via email & SMS within 24 hours.",
    },
  ];

  /* =========================================================
     MILESTONES
     ========================================================= */

  const milestones = [
    "ISO certified",
    "50+ Doctors & 5+ Hospitals network",
    "Advanced lab equipment upgraded",
    "Trusted by 1 Lakh+ families",
    "Community health initiatives",
    "Third location opened",
  ];

  /* =========================================================
     WHY CHOOSE US
     ========================================================= */

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
      icon: "▢",
      title: "Trusted by Doctors",
      description: "Backed by more than 50+",
    },
    {
      icon: "◯",
      title: "WhatsApp support",
      description: "Chat with our team",
    },
    {
      icon: "♙",
      title: "Trained staff",
      description: "Experienced professionals",
    },
    {
      icon: "♙",
      title: "Affordable pricing",
      description: "Quality diagnostics at fair prices",
    },
    {
      icon: "◯",
      title: "Patient first",
      description: "Friendly service focused on your comfort",
    },
  ];

  /* =========================================================
     EXISTING HEALTH PACKAGES
     
     IMPORTANT:
     These come directly from your existing packages data.
     Nothing is hard-coded here.
     ========================================================= */

  const existingPackages = Array.isArray(packages)
    ? packages
    : [];

  /* =========================================================
     EXISTING TESTS
     
     IMPORTANT:
     These come directly from your existing tests data.
     ========================================================= */

  const existingTests = Array.isArray(tests)
    ? tests
    : [];

  /* =========================================================
     RECOMMENDED TESTS
     
     First try to use the same tests from your existing data.
     ========================================================= */

  const recommendedNames = [
    "CBC with ESR",
    "Complete Blood Count",
    "Thyroid Profile",
    "Lipid Profile",
    "Vitamin D3",
    "Vitamin D Test",
  ];

  const recommendedTests = [];

  recommendedNames.forEach((name) => {
    const found = existingTests.find(
      (test) =>
        test?.name?.toLowerCase().trim() ===
        name.toLowerCase().trim()
    );

    if (
      found &&
      !recommendedTests.some(
        (item) => item.id === found.id
      )
    ) {
      recommendedTests.push(found);
    }
  });

  /*
   * If your current data file does not contain all the
   * recommended names above, fill the remaining cards
   * from the same existing tests array.
   */
  existingTests.forEach((test) => {
    if (
      recommendedTests.length < 4 &&
      !recommendedTests.some(
        (item) => item.id === test.id
      )
    ) {
      recommendedTests.push(test);
    }
  });

  const finalRecommendedTests =
    recommendedTests.slice(0, 4);

  /* =========================================================
     MENU → WHY CHOOSE US
     ========================================================= */

  useEffect(() => {
    if (
      location.state?.scrollTo !==
      "why-choose-us"
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const element =
        document.getElementById(
          "why-choose-us"
        );

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      navigate("/", {
        replace: true,
        state: {},
      });
    }, 150);

    return () =>
      clearTimeout(timer);
  }, [
    location.state,
    navigate,
  ]);

  /* =========================================================
     NAVIGATION
     ========================================================= */

  const connectHealthPartner = () => {
    navigate("/book-test");
  };

  const openPackage = (packageData) => {
    navigate("/package-info", {
      state: {
        packageData,
      },
    });
  };

  const openTest = (test) => {
    navigate("/test-info", {
      state: {
        test,
      },
    });
  };

  const bookTest = (test) => {
    navigate("/test-booking", {
      state: {
        test,
      },
    });
  };

  const openPackages = () => {
    navigate("/packages");
  };

  const openMaps = () => {
    window.open(
      "https://www.google.com/maps/search/?api=1&query=Life+Care+Point+Laboratory+Indirapuram+Ghaziabad",
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* =========================================================
     HOME
     ========================================================= */

  return (
    <div className="figma-home-page">

      {/* =====================================================
          SCREEN 1 — HERO + PREVIOUS VIDEO
          ===================================================== */}

      <section className="figma-screen figma-screen-hero">

        <div className="figma-hero-content">

          <h1>
            We Are Your Health
            <br />
            Care Partner
          </h1>

          <p>
            Every Blood Test has a story to tell and with
            over 20+ years of experience, we know how to
            deliver it with high precision.
          </p>

        </div>


        {/* PREVIOUS HOME PAGE VIDEO */}

        <div className="figma-hero-video">

          <video
            className="figma-hero-video-element"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/images/test-tube.png"
          >
            <source
              src="/videos/hero-animation.mp4"
              type="video/mp4"
            />
          </video>

        </div>


        <div className="figma-doctor-badge">
          TRUSTED AND RECOMMENDED BY DOCTORS
        </div>

      </section>


      {/* =====================================================
          SCREEN 2 — HOME SAMPLE COLLECTION
          ===================================================== */}

      <section className="figma-screen figma-screen-collection">

        <div className="figma-screen-heading">

          <h2>
            Free Home Sample
            <br />
            Collection
          </h2>

          <p>
            Professional hygienic tests collected comfortably
            <br />
            from your doorstep
          </p>

        </div>


        <div className="figma-collection-image">

          <img
            src="/images/home-collection.png"
            alt="Free home sample collection"
          />

        </div>


        <div className="figma-area-title">

          <h3>
            Areas We Serve
          </h3>

          <span>
            10+ Regions
          </span>

        </div>


        <div className="figma-area-grid">

          {collectionAreas.map((area) => (
            <div
              className="figma-area-item"
              key={area}
            >

              <span className="figma-location-icon">
                ⌖
              </span>

              <span>
                {area}
              </span>

            </div>
          ))}

        </div>

      </section>


      {/* =====================================================
          SCREEN 3 — HOW IT WORKS + ACHIEVEMENTS
          ===================================================== */}

      <section className="figma-screen figma-screen-how">

        <div className="figma-screen-heading">

          <h2>
            How It Works
          </h2>

        </div>


        <div className="figma-how-list">

          {howItWorks.map((item) => (
            <div
              className="figma-how-item"
              key={item.number}
            >

              <div className="figma-how-icon">
                {item.icon}
              </div>

              <div className="figma-how-number">
                {item.number}
              </div>

              <div className="figma-how-text">

                <h3>
                  {item.title}
                </h3>

                <p>
                  {item.description}
                </p>

              </div>

            </div>
          ))}

        </div>


        <div className="figma-achievements">

          <h2>
            Achievements
          </h2>

          <div className="figma-achievement-grid">

            <div className="figma-achievement-card">
              <strong>
                5 Lakh+
              </strong>

              <span>
                Overall tests performed
              </span>
            </div>


            <div className="figma-achievement-card">
              <strong>
                1 Lakh+
              </strong>

              <span>
                Happy patients
              </span>
            </div>


            <div className="figma-achievement-card">
              <strong>
                25+
              </strong>

              <span>
                Years of experience
              </span>
            </div>


            <div className="figma-achievement-card">
              <strong>
                10+
              </strong>

              <span>
                Areas we serve
              </span>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          SCREEN 4 — MILESTONES + SAME HEALTH PACKAGES
          ===================================================== */}

      <section className="figma-screen figma-screen-packages">

        <div className="figma-milestone-card">

          <h2>
            Milestones
          </h2>

          <div className="figma-milestone-list">

            {milestones.map((milestone) => (
              <div
                className="figma-milestone-item"
                key={milestone}
              >

                <span className="figma-milestone-check">
                  ✓
                </span>

                <span>
                  {milestone}
                </span>

              </div>
            ))}

          </div>

        </div>


        {/* SAME EXISTING PACKAGE DATA */}

        <div className="figma-packages-title">
          Health Packages &amp; Tests
        </div>


        <div className="figma-package-scroller">

          {existingPackages.map(
            (packageData) => (
              <article
                className="figma-package-card"
                key={
                  packageData.id ||
                  packageData.name
                }
                onClick={() =>
                  openPackage(
                    packageData
                  )
                }
              >

                <div className="figma-package-image">

                  <MedicalArt
                    id={
                      packageData.id
                    }
                    type={
                      packageData.type
                    }
                  />

                </div>


                <div className="figma-package-details">

                  <h3>
                    {packageData.name}
                  </h3>

                  <p>
                    {packageData.description ||
                      "Comprehensive diagnostic health package."}
                  </p>


                  <div className="figma-package-price">

                    {packageData.oldPrice && (
                      <del>
                        ₹
                        {
                          packageData.oldPrice
                        }
                      </del>
                    )}

                    <strong>
                      ₹
                      {
                        packageData.price
                      }
                    </strong>

                  </div>

                </div>

              </article>
            )
          )}

        </div>


        <button
          type="button"
          className="figma-explore-button"
          onClick={
            openPackages
          }
        >
          Explore More
        </button>

      </section>


      {/* =====================================================
          SCREEN 5 — SAME TEST DATA
          ===================================================== */}

      <section className="figma-screen figma-screen-tests">


        <div className="figma-recommended-heading">
          Most Recommended Tests
        </div>


        <div className="figma-test-list">

          {finalRecommendedTests.map(
            (test) => (
              <div
                className="figma-test-card"
                key={
                  test.id ||
                  test.name
                }
              >

                <button
                  type="button"
                  className="figma-test-main"
                  onClick={() =>
                    openTest(test)
                  }
                >

                  <span className="figma-test-icon">

                    {test.name
                      ?.toLowerCase()
                      .includes(
                        "thyroid"
                      )
                      ? "⌁"
                      : test.name
                          ?.toLowerCase()
                          .includes(
                            "lipid"
                          )
                      ? "ϟ"
                      : test.name
                          ?.toLowerCase()
                          .includes(
                            "vitamin"
                          )
                      ? "☼"
                      : "♧"}

                  </span>


                  <span className="figma-test-information">

                    <strong>
                      {
                        test.name
                      }
                    </strong>

                    <small>
                      {
                        test.parameters ||
                        1
                      }{" "}
                      parameters

                      {test.oldPrice
                        ? ` • ₹${test.oldPrice}`
                        : ""}

                      {test.price
                        ? ` • ₹${test.price}`
                        : ""}
                    </small>

                  </span>

                </button>


                <button
                  type="button"
                  className="figma-book-button"
                  onClick={() =>
                    bookTest(test)
                  }
                >
                  Book Now
                </button>

              </div>
            )
          )}

        </div>

      </section>


      {/* =====================================================
          SCREEN 6 — WHY CHOOSE US
          ===================================================== */}

      <section
        id="why-choose-us"
        className="figma-screen figma-screen-why"
      >

        <div className="figma-screen-heading">

          <h2>
            Why Choose Us
          </h2>

        </div>


        <div className="figma-why-grid">

          {whyChooseUs.map(
            (item) => (
              <div
                className="figma-why-card"
                key={
                  item.title
                }
              >

                <div className="figma-why-icon">
                  {item.icon}
                </div>

                <h3>
                  {item.title}
                </h3>

                <p>
                  {item.description}
                </p>

              </div>
            )
          )}

        </div>

      </section>


      {/* =====================================================
          SCREEN 7 — CONTACT
          ===================================================== */}

      <section className="figma-screen figma-screen-contact">

        <div className="figma-screen-heading">

          <h2>
            Contact Us
          </h2>

        </div>


        <button
          type="button"
          className="figma-map"
          onClick={
            openMaps
          }
        >

          <div className="figma-map-label">
            Life Care Point Lab
          </div>

          <div className="figma-map-center">
            ⌖
          </div>

          <div className="figma-map-location">
            Life Care Point Laboratory
          </div>

        </button>


        <div className="figma-contact-box">

          <div className="figma-contact-box-icon">
            ⌖
          </div>

          <div>

            <span>
              Address
            </span>

            <p>
              Life Care Point Laboratory,
              <br />
              1033, Ground Floor, Nishant-1,
              <br />
              Opposite Orange County,
              <br />
              Indirapuram, Ghaziabad,
              <br />
              Uttar Pradesh - 201014
            </p>

          </div>

        </div>


        <a
          href="tel:+91910108459"
          className="figma-contact-box figma-contact-phone"
        >

          <div className="figma-contact-box-icon">
            ♧
          </div>

          <div>

            <span>
              Contact Number
            </span>

            <p>
              +91 910108459
            </p>

          </div>

        </a>


        <div className="figma-contact-box">

          <div className="figma-contact-box-icon">
            ◷
          </div>

          <div>

            <span>
              Timings
            </span>

            <p>
              Mon-Sat: 8:00 AM - 8:00 PM
              <br />
              Sunday: 8:00 AM - 2:00 PM
            </p>

          </div>

        </div>


        <div className="figma-follow-box">

          <span>
            Follow Us
          </span>

          <div className="figma-social-icons">

            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
            >
              f
            </a>

            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              ◎
            </a>

            <a
              href="https://x.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="X"
            >
              𝕏
            </a>

            <a
              href="https://www.youtube.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
            >
              ▶
            </a>

          </div>

        </div>

      </section>


     

    </div>
  );
}