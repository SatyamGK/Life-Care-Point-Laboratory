import { useState } from "react";
<<<<<<< HEAD
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { submitBooking, trackEvent } from "../services/api";
import MedicalArt from "../components/MedicalArt";
import { tests } from "../data/tests";
=======
import { useLocation, useNavigate } from "react-router-dom";
import { submitBooking } from "../services/api";
import MedicalArt from "../components/MedicalArt";
>>>>>>> dc3f419736288355f428efbde9f237afa060c2c2

export default function TestBooking() {
  const location = useLocation();
  const navigate = useNavigate();
<<<<<<< HEAD
  const { id } = useParams();
  const test = location.state?.test || tests.find((item) => item.id === decodeURIComponent(id || ""));
=======
  const test = location.state?.test;
>>>>>>> dc3f419736288355f428efbde9f237afa060c2c2
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);


  if (!test) {
    return (
      <section className="booking-page">

        <div className="booking-empty-card">

          <h1>
            Test Not Selected
          </h1>

          <button type="button" onClick={() =>
              navigate("/tests")
            }
          >
            View Tests
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
        type: "test",
        name: name.trim(),
        mobile,
<<<<<<< HEAD
        itemId: test.id,
=======
>>>>>>> dc3f419736288355f428efbde9f237afa060c2c2
        itemName: test.name,
        price: test.price,
      });

<<<<<<< HEAD
      trackEvent("booking_submit", { type: "booking" });
=======
>>>>>>> dc3f419736288355f428efbde9f237afa060c2c2
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
    <section className="test-booking-page">

      {/* ============================================
          SELECTED TEST
      ============================================ */}

      <div className="selected-booking-card">

        <div className="selected-booking-image">

          <MedicalArt id={test.id} type={test.type} />

        </div>


        <div className="selected-booking-content">

          <h1>
            {test.name}
          </h1>

          <div className="selected-price">

            {test.oldPrice && (
              <del>
                ₹{test.oldPrice}
              </del>
            )}

            <strong>
              ₹{test.price}
            </strong>

            <span>
              / person
            </span>

          </div>

        </div>

      </div>


      {/* ============================================
          PATIENT DETAILS
      ============================================ */}

      <div className="contact-choice-row">

<<<<<<< HEAD
        <a href="tel:+919910108453" onClick={() => trackEvent("call_click")} className="quick-contact-button call-button" >
=======
        <a href="tel:+919910108453" className="quick-contact-button call-button" >
>>>>>>> dc3f419736288355f428efbde9f237afa060c2c2
          <span>☎</span>
          Call
        </a>

<<<<<<< HEAD
        <a
          href="https://wa.me/919910108453"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("whatsapp_click")}
          className="quick-contact-button whatsapp-button"
        >
=======
        <a href="https://wa.me/919910108453" target="_blank" rel="noopener noreferrer" className="quick-contact-button whatsapp-button" >
>>>>>>> dc3f419736288355f428efbde9f237afa060c2c2
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

            <label htmlFor="test-name">
              Full Name
              <em>*</em>
            </label>

            <input id="test-name" type="text" placeholder="Enter your Full Name" value={name} onChange={(event) => {
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

            <label htmlFor="test-mobile">
              Mobile Number
              <em>*</em>
            </label>

            <div className="compact-mobile-input">

              <span>
                +91
              </span>

              <input id="test-mobile" type="tel" inputMode="numeric" maxLength="10" placeholder="Enter your Mobile Number" value={mobile} onChange={(event) => {
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