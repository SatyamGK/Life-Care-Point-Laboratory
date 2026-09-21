export default function Achievements() {
  const milestones = [
    "ISO certified",
    "50+ Doctors & 5+ Hospitals network",
    "Advanced lab equipment upgraded",
    "Trusted by 1 Lakh+ families",
    "Community health initiatives",
    "Third location opened",
  ];

  return (
    <section className="achievements-page">

      <h1>
        Achievements
      </h1>

      <div className="achievement-stats">

        <div>
          <strong>5 Lakh+</strong>
          <span>Overall tests performed</span>
        </div>

        <div>
          <strong>1 Lakh+</strong>
          <span>Happy families</span>
        </div>

        <div>
          <strong>25+</strong>
          <span>Years of experience</span>
        </div>

        <div>
          <strong>10+</strong>
          <span>Areas we serve</span>
        </div>

      </div>


      <div className="milestones-card">

        <h2>
          Milestones
        </h2>

        {milestones.map((item) => (
          <div className="milestone-row" key={item} >
            <span>✓</span>
            <strong>{item}</strong>
          </div>
        ))}

      </div>

    </section>
  );
}