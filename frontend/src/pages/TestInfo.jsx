import { useLocation, useNavigate } from "react-router-dom";

import MedicalArt from "../components/MedicalArt";

export default function TestInfo() {
  const location = useLocation();
  const navigate = useNavigate();

  const test =
    location.state?.test;


  if (!test) {
    return (
      <section className="info-page">

        <h1>
          Test Not Selected
        </h1>

        <p>
          Please select a test first.
        </p>

        <button type="button" onClick={() =>
            navigate("/tests")
          }
        >
          View Tests
        </button>

      </section>
    );
  }


  const bookTest = () => {
    navigate("/test-booking", {
      state: {
        test,
      },
    });
  };


  return (
    <section className="test-info-page">

      {/* ============================================
          TEST IMAGE
      ============================================ */}

      <div className="test-detail-image">

        <MedicalArt id={test.id} type={test.type} />

      </div>


      {/* ============================================
          TITLE
      ============================================ */}

      <div className="test-detail-heading">

        <h1>
          {test.name}
        </h1>

        <div className="detail-price">

          {test.oldPrice && (
            <del>
              ₹{test.oldPrice}
            </del>
          )}

          <strong>
            ₹{test.price}
          </strong>

        </div>

      </div>


      {/* ============================================
          PARAMETERS
      ============================================ */}

      {test.parameters && (
        <p className="test-parameter-line">
          {test.parameters} parameters
        </p>
      )}


      {/* ============================================
          DESCRIPTION
      ============================================ */}

      <p className="test-detail-description">
        {test.description}
      </p>


      {/* ============================================
          BOOK
      ============================================ */}

      <button type="button" className="detail-book-button" onClick={bookTest} >
        Book Now
      </button>

    </section>
  );
}