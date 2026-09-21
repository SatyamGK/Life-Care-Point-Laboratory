import { useNavigate } from "react-router-dom";
import MedicalArt from "./MedicalArt";

export default function PackageCard({
  packageData,
}) {
  const navigate = useNavigate();

  if (!packageData) {
    return null;
  }

  const openDetails = () => {
    navigate("/package-info", {
      state: {
        packageData,
      },
    });
  };

  const bookPackage = (e) => {
    e.stopPropagation();

    navigate("/package-booking", {
      state: {
        packageData,
      },
    });
  };

  return (
    <article className="package-list-card" onClick={openDetails} >

      <div className="card-art-wrap">

        <MedicalArt type={packageData.image} />

      </div>

      <div className="package-card-body">

        <h3>
          {packageData.name}
        </h3>

        <div className="price-line">

          <del>
            ₹{packageData.oldPrice}
          </del>

          <strong>
            ₹{packageData.price}
          </strong>

        </div>

        <p>
          {packageData.description}
        </p>

        <button className="book-btn" onClick={bookPackage} >
          Book Now
        </button>

      </div>

    </article>
  );
}