import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { submitBooking } from "../services/api";
import MedicalArt from "../components/MedicalArt";

export default function PackageBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const packageData = location.state?.packageData;
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
        itemName: packageData.name,
        price: packageData.price,
      });

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