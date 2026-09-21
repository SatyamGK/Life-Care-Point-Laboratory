import { useNavigate } from "react-router-dom";

export default function KeyFeatures() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "⌂",
      title: "Home Collection",
      description: "Sample pickup at your doorstep by trained professionals.",
    },
    {
      icon: "◷",
      title: "Priority Reports",
      description: "Get your diagnostic reports quickly and conveniently.",
    },
    {
      icon: "📍",
      title: "Multiple Locations",
      description: "Visit our laboratory or choose a location near you.",
    },
    {
      icon: "▢",
      title: "Trusted by Doctors",
      description: "Diagnostics trusted by doctors and healthcare partners.",
    },
    {
      icon: "◯",
      title: "WhatsApp Support",
      description: "Connect with our team easily through WhatsApp.",
    },
    {
      icon: "♙",
      title: "Trained Staff",
      description: "Experienced professionals focused on patient care.",
    },
    {
      icon: "₹",
      title: "Affordable Pricing",
      description: "Quality diagnostic services at fair and transparent prices.",
    },
    {
      icon: "♡",
      title: "Patient First",
      description: "Friendly service designed around your comfort and needs.",
    },
  ];

  return (
    <section className="key-features-page">

      {/* Header */}
      <div className="key-features-heading">

        <h1>
          WHY CHOOSE US
        </h1>

        <p>
          Everything we do is designed around accurate diagnostics and better patient care.
        </p>

      </div>


      {/* Feature Cards */}
      <div className="key-features-grid">

        {features.map((feature, index) => (
          <div className="key-feature-card" key={`${feature.title}-${index}`} >

            <div className="key-feature-icon">
              {feature.icon}
            </div>

            <div className="key-feature-content">

              <h2>
                {feature.title}
              </h2>

              <p>
                {feature.description}
              </p>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}