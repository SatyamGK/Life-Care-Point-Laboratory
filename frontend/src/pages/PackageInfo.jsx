<<<<<<< HEAD
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MedicalArt from "../components/MedicalArt";
import { tests } from "../data/tests";
import { packages } from "../data/packages";
=======
import { useLocation, useNavigate } from "react-router-dom";
import MedicalArt from "../components/MedicalArt";
import { tests } from "../data/tests";
>>>>>>> dc3f419736288355f428efbde9f237afa060c2c2

export default function PackageInfo() {
  const location = useLocation();
  const navigate = useNavigate();
<<<<<<< HEAD
  const { id } = useParams();

  const packageData = location.state?.packageData || packages.find((item) => item.id === decodeURIComponent(id || ""));
=======

  const packageData = location.state?.packageData;
>>>>>>> dc3f419736288355f428efbde9f237afa060c2c2

  if (!packageData) {
    return (
      <section className="info-page">
        <h1>Package Not Selected</h1>

        <p>Please select a health package first.</p>

        <button type="button" onClick={() => navigate("/packages")} >
          View Health Packages
        </button>
      </section>
    );
  }

  const packageTests =
    packageData.tests?.map((testName) => {
      const foundTest = tests.find(
        (test) =>
          test.name.toLowerCase().trim() ===
          testName.toLowerCase().trim()
      );

      return (
        foundTest || {
          id: testName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-"),
          name: testName,
          description: `Information about ${testName}.`,
          price: 0,
          image: null,
          type: "cbc-with-esr",
        }
      );
    }) || [];

  const bookPackage = () => {
<<<<<<< HEAD
    navigate(`/package-booking/${encodeURIComponent(packageData.id)}`, {
      state: { packageData },
=======
    navigate("/package-booking", {
      state: {
        packageData,
      },
>>>>>>> dc3f419736288355f428efbde9f237afa060c2c2
    });
  };

  return (
    <section className="package-info-page">

      {/* Package Image */}
      <div className="package-detail-image">
        <MedicalArt id={packageData.id} type={packageData.type} />
      </div>

      {/* Package Title + Price */}
      <div className="package-detail-heading">
        <div>
          <span className="package-detail-label">
            HEALTH PACKAGE
          </span>

          <h1>{packageData.name}</h1>
        </div>

        <div className="detail-price">
          {packageData.oldPrice && (
            <del>₹{packageData.oldPrice}</del>
          )}

          <strong>₹{packageData.price}</strong>
        </div>
      </div>

      {/* Description */}
      {packageData.description && (
        <p className="test-detail-description">
          {packageData.description}
        </p>
      )}

      {/* Included Tests */}
      <div className="package-test-heading">
        <span>PACKAGE INCLUDES</span>

        <h2>
          {packageTests.length} Tests
        </h2>
      </div>

      {/* Simple Test List */}
      <div className="package-simple-test-list">
        {packageTests.map((test, index) => (
          <div className="package-simple-test" key={`${test.id}-${index}`} >
            <span className="package-simple-test-name">
              {test.name}
            </span>
          </div>
        ))}
      </div>

      {/* Book Package */}
      <button type="button" className="detail-book-button" onClick={bookPackage} >
        Book Now
      </button>

    </section>
  );
}