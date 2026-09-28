import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { submitBooking, trackEvent } from "../services/api";
import MedicalArt from "../components/MedicalArt";
import { packages } from "../data/packages";

export default function PackageBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const packageData = location.state?.packageData || packages.find((item) => item.id === decodeURIComponent(id || ""));
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);


  if (!packageData) {
    return (
      <section className="booking-page">

        <div className="booking-empty-card">

          <h1>
            Package Not Selected
          </h1>

          <button type="button" onClick={() => navigate("/packages") } >
            View Packages
          </button>

        </div>

      </section>
    );
  }


  const clearError = (field) => {
    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };


  const validate = () => {
    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Please enter your full name";
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      nextErrors.mobile = "Please enter a valid 10-digit mobile number";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      await submitBooking({
        type: "package",
        name: name.trim(),
        mobile,
        itemId: packageData.id,
        itemName: packageData.name,
        price: packageData.price,
      });

      trackEvent("booking_submit", { type: "booking" });
      navigate("/booking-success");

    } catch (error) {
      alert(
        error?.message ||
          "Unable to submit booking."
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <section className="package-booking-page">

      {/* ============================================
          SELECTED PACKAGE
      ============================================ */}

      <div className="selected-booking-card">

        <div className="selected-booking-image">

          <MedicalArt id={packageData.id} type={packageData.type} />

        </div>


        <div className="selected-booking-content">

          <h1>
            {packageData.name}
          </h1>

          <div className="selected-price">

            {packageData.oldPrice && (
              <del>
                ₹{packageData.oldPrice}
              </del>
            )}

            <strong>
              ₹{packageData.price}
            </strong>

            <span>
              / person
            </span>

          </div>

        </div>

      </div>


      {/* ============================================
          FORM
      ============================================ */}

      <div className="contact-choice-row">

        <a href="tel:+919910108453" onClick={() => trackEvent("call_click")} className="quick-contact-button call-button" >
          <span>☎</span>
          Call
        </a>

        <a
          href="https://wa.me/919910108453"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("whatsapp_click")}
          className="quick-contact-button whatsapp-button"
        >
          <span>◯</span>
          WhatsApp
        </a>

      </div>


      <div className="booking-or">
        OR
      </div>

      <div className="compact-patient-card">

        <h2>
          Enter Patient Details
        </h2>


        <form onSubmit={handleSubmit} noValidate >

          <div className="compact-form-field">

            <label htmlFor="package-name">
              Full Name
              <em>*</em>
            </label>

            <input id="package-name" type="text" placeholder="Enter your Full Name" value={name} onChange={(event) => {
                setName(event.target.value);
                clearError("name");
              }}
            />

            {errors.name && (
              <small className="compact-form-error">
                {errors.name}
              </small>
            )}

          </div>


          <div className="compact-form-field">

            <label htmlFor="package-mobile">
              Mobile Number
              <em>*</em>
            </label>

            <div className="compact-mobile-input">

              <span>
                +91
              </span>

              <input id="package-mobile" type="tel" inputMode="numeric" maxLength="10" placeholder="Enter your Mobile Number" value={mobile}
                onChange={(event) => {
                  const value =
                    event.target.value.replace(
                      /\D/g,
                      ""
                    );
                  setMobile(value);
                  clearError("mobile");
                }}
              />

            </div>

            {errors.mobile && (
              <small className="compact-form-error">
                {errors.mobile}
              </small>
            )}

          </div>

          <button type="submit" className="compact-confirm-button" disabled={loading} >
            {loading ? "Submitting..." : "Confirm Booking"}
          </button>

          <div className="compact-security">
            🔒 SECURE
          </div>

        </form>

      </div>

    </section>
  );
}