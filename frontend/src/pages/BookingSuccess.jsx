import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BookingSuccess() {
  const navigate = useNavigate();

  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      navigate("/");
    }, 3000);

    return () => {
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  useEffect(() => {
    const counter = setInterval(() => {
      setSeconds((previous) => {
        if (previous <= 1) {
          clearInterval(counter);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      clearInterval(counter);
    };
  }, []);


  return (
    <section className="booking-success-page">

      <div className="booking-success-card">

        <div className="success-green-check">
          ✓
        </div>

        <h1>
          Your request has been submitted successfully.
        </h1>

        <p>
          Our team will connect with you shortly.
        </p>

        <span className="success-redirect">
          Redirecting to Home in {seconds}...
        </span>

      </div>

    </section>
  );
}