import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitEnquiry } from "../services/api";

export default function BookTest() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((previous) => ({
        ...previous,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Please enter your full name";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must contain at least 2 characters";
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      await submitEnquiry({
        type: "enquiry",
        name: name.trim(),
        mobile,
        selectedTest: "General Enquiry",
      });

      navigate("/booking-success");
    } catch (error) {
      console.error(
        "Enquiry submission error:",
        error
      );

      alert(
        error?.message || "Unable to submit your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="simple-booking-page">

      {/* ============================================
          TOP HEALTH PARTNER CARD
      ============================================ */}

      <div className="health-partner-card">

        <h1>
          We are your Health Care
          <br />
          Partner
        </h1>

        <span>
          Book your test now
        </span>

      </div>


      {/* ============================================
          CALL / WHATSAPP
      ============================================ */}

      <div className="contact-choice-row">

        <a href="tel:+91910108459" className="quick-contact-button call-button" >
          <span>☎</span>
          Call
        </a>

        <a href="https://wa.me/919910108453" target="_blank" rel="noopener noreferrer" className="quick-contact-button whatsapp-button" >
          <span>◯</span>
          WhatsApp
        </a>

      </div>


      <div className="booking-or">
        OR
      </div>


      {/* ============================================
          FORM
      ============================================ */}

      <div className="simple-booking-card">

        <form onSubmit={handleSubmit} noValidate >

          {/* FULL NAME */}

          <div className="simple-form-field">

            <label htmlFor="simple-name">
              Full Name
              <em>*</em>
            </label>

            <input id="simple-name" type="text" placeholder="Your Full Name" value={name} autoComplete="name" onChange={(event) => {
                setName(event.target.value);
                clearError("name");
              }} />

            {errors.name && (
              <small className="simple-form-error">
                {errors.name}
              </small>
            )}

          </div>


          {/* MOBILE */}

          <div className="simple-form-field">

            <label htmlFor="simple-mobile">
              Mobile Number
              <em>*</em>
            </label>

            <div className="simple-mobile-input">

              <span>
                +91
              </span>

              <input id="simple-mobile" type="tel" inputMode="numeric" maxLength="10" placeholder="Your Mobile Number" value={mobile} autoComplete="tel" onChange={(event) => {
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
              <small className="simple-form-error">
                {errors.mobile}
              </small>
            )}

          </div>


          {/* PRIVACY TEXT */}

          <p className="simple-form-note">
            We'll only use these details to get in touch about your test.
          </p>


          {/* SUBMIT */}

          <button type="submit" className="simple-submit-button" disabled={loading} >
            {loading ? "Submitting..." : "Submit"}
          </button>


          {/* SECURITY */}

          <div className="simple-security">
            <span>🔒</span>
            SECURE
          </div>

        </form>

      </div>

    </section>
  );
}