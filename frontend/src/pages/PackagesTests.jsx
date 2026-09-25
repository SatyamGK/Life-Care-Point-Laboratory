import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { packages } from "../data/packages";
import { tests } from "../data/tests";
import MedicalArt from "../components/MedicalArt";

export default function PackagesTests() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = location.pathname === "/tests" ? "tests" : "packages";
  const [activeTab, setActiveTab] = useState(initialTab);

  const openPackage = (item) => {
    navigate("/package-info", {
      state: {
        packageData: item,
      },
    });
  };


  const openTest = (item) => {
    navigate("/test-info", {
      state: {
        test: item,
      },
    });
  };


  const bookPackage = (item) => {
    navigate("/package-booking", {
      state: {
        packageData: item,
      },
    });
  };


  const bookTest = (item) => {
    navigate("/test-booking", {
      state: {
        test: item,
      },
    });
  };

  return (
    <section className="listing-page">

      {/* =================================================
          TABS
      ================================================= */}

      <div className="listing-tabs">

        <button type="button" className={ activeTab === "packages" ? "active" : "" } onClick={() => {
            setActiveTab("packages");
            navigate("/packages");
          }}
        >
          Health Packages
        </button>

        <button type="button" className={ activeTab === "tests" ? "active" : "" }
          onClick={() => {
            setActiveTab("tests");
            navigate("/tests");
          }}
        >
          Tests List
        </button>

      </div>

      {/* =================================================
          PACKAGES
      ================================================= */}

      {activeTab === "packages" && (
        <div className="listing-items">

          {packages.map((item) => (
            <article className="listing-card" key={item.id} onClick={() =>
                openPackage(item)
              }
            >

              <div className="listing-image">
                <MedicalArt id={item.id} type={item.type} />
              </div>


              <div className="listing-content">

                <h2>
                  {item.name}
                </h2>

                <div className="listing-price">

                  {item.oldPrice && (
                    <del>
                      ₹{item.oldPrice}
                    </del>
                  )}

                  <strong>
                    ₹{item.price}
                  </strong>

                </div>

                <p>
                  {item.tests ?.slice(0, 4).join(", ")} ...
                </p>

                <button type="button" onClick={(event) => {
                    event.stopPropagation();
                    bookPackage(item);
                  }}
                >
                  Book Now
                </button>

              </div>

            </article>
          ))}

        </div>
      )}


      {/* =================================================
          TESTS
      ================================================= */}

      {activeTab === "tests" && (
        <div className="listing-items">

          {tests.map((item) => (
            <article className="listing-card" key={item.id} onClick={() =>
                openTest(item)
              }
            >

              <div className="listing-image">
                <MedicalArt id={item.id} type={item.type} />
              </div>

              <div className="listing-content">

                <h2>
                  {item.name}
                </h2>


                <div className="listing-price">

                  {item.oldPrice && (
                    <del>
                      ₹{item.oldPrice}
                    </del>
                  )}

                  <strong>
                    ₹{item.price}
                  </strong>

                </div>

                <p>
                  {item.description}
                </p>

                <button type="button" onClick={(event) => {
                    event.stopPropagation();
                    bookTest(item);
                  }}
                >
                  Book Now
                </button>

              </div>

            </article>
          ))}

        </div>
      )}

    </section>
  );
}