import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { submitBooking, trackEvent } from "../services/api";
import MedicalArt from "../components/MedicalArt";
import { tests } from "../data/tests";
import Icon from "../components/Icon";

const WHATSAPP_NUMBER = "919910108453";
const WHATSAPP_MESSAGE = "Hello, I would like to know more about your health tests and packages.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export default function TestBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const test = location.state?.test || tests.find((item) => item.id === decodeURIComponent(id || ""));
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
        itemId: test.id,
        itemName: test.name,
        price: test.price,
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
    <section className="test-booking-page">

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
                <span className="rupee-symbol">₹</span>{test.oldPrice}
              </del>
            )}

            <strong>
              <span className="rupee-symbol">₹</span>{test.price}
            </strong>

            <span>
              / person
            </span>

          </div>

        </div>

      </div>

      <div className="contact-choice-row">

        <a href="tel:+919910108453" onClick={() => trackEvent("call_click")} className="quick-contact-button call-button" >
          <Icon name="phone" size={17} />
          Call
        </a>

        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("whatsapp_click")} className="quick-contact-button whatsapp-button" >
          <Icon name="whatsapp" size={19} />
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