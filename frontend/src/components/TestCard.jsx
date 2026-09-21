import { useNavigate } from "react-router-dom";
import MedicalArt from "./MedicalArt";

export default function TestCard({
  test,
}) {
  const navigate = useNavigate();

  if (!test) {
    return null;
  }

  const openDetails = () => {
    navigate("/test-info", {
      state: {
        test,
      },
    });
  };

  const bookTest = (e) => {
    e.stopPropagation();

    navigate("/test-booking", {
      state: {
        test,
      },
    });
  };

  return (
    <article className="package-list-card" onClick={openDetails} >

      <div className="card-art-wrap">

        <MedicalArt type={test.image} />

      </div>

      <div className="package-card-body">

        <h3>
          {test.name}
        </h3>

        <div className="price-line">

          <del>
            ₹{test.oldPrice}
          </del>

          <strong>
            ₹{test.price}
          </strong>

        </div>

        <p>
          {test.description}
        </p>

        <button className="book-btn" onClick={bookTest} >
          Book Now
        </button>

      </div>

    </article>
  );
}