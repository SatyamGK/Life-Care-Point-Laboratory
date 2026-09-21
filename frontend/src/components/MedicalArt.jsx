import React from "react";

const imageMap = {
  /* =====================================================
     HEALTH PACKAGES
  ===================================================== */

  "body-profile-1": "/images/packages/body-profile-1.png",

  "body-profile-2": "/images/packages/body-profile-2.png",

  "body-profile-3": "/images/packages/body-profile-3.png",

  "diabetes-profile": "/images/packages/diabetes-profile.png",

  "arthritis-profile": "/images/packages/arthritis-profile.png",

  "vit-d-vit-b12": "/images/packages/vit-d-vit-b12.png",

  "anaemia-profile": "/images/packages/anaemia-profile.png",


  /* =====================================================
     LABORATORY TESTS
  ===================================================== */

  "cbc-with-esr": "/images/tests/cbc-with-esr.png",

  "platelet-count": "/images/tests/platelet-count.png",

  "bleeding-time": "/images/tests/bleeding-time.png",

  "clotting-time": "/images/tests/clotting-time.png",

  hba1c: "/images/tests/hba1c.png",

  "abo-rh": "/images/tests/abo-rh.png",

  "blood-glucose": "/images/tests/blood-glucose.png",

  lft: "/images/tests/lft.png",

  kft: "/images/tests/kft.png",

  "lipid-profile": "/images/tests/lipid-profile.png",

  ft3: "/images/tests/ft3.png",

  ft4: "/images/tests/ft4.png",

  tsh: "/images/tests/tsh.png",

  "thyroid-profile": "/images/tests/thyroid-profile.png",

  lh: "/images/tests/lh.png",

  fsh: "/images/tests/fsh.png",

  prolactin: "/images/tests/prolactin.png",

  "vitamin-b12": "/images/tests/vitamin-b12.png",

  "vitamin-d3": "/images/tests/vitamin-d3.png",

  ferritin: "/images/tests/ferritin.png",

  "iron-profile": "/images/tests/iron-profile.png",

  ige: "/images/tests/ige.png",

  "rheumatoid-factor": "/images/tests/rheumatoid-factor.png",

  crp: "/images/tests/crp.png",

  widal: "/images/tests/widal.png",

  typhoid: "/images/tests/typhoid.png",

  malaria: "/images/tests/malaria.png",

  "dengue-profile": "/images/tests/dengue-profile.png",

  dengue: "/images/tests/dengue.png",

  hiv: "/images/tests/hiv.png",

  hbsag: "/images/tests/hbsag.png",

  hcv: "/images/tests/hcv.png",

  vdrl: "/images/tests/vdrl.png",

  "urine-rm": "/images/tests/urine-rm.png",

  "urine-culture": "/images/tests/urine-culture.png",

  "stool-rm": "/images/tests/stool-rm.png",

  "stool-culture": "/images/tests/stool-culture.png",

  "stool-occult": "/images/tests/stool-occult.png",

  "gram-stain": "/images/tests/gram-stain.png",

  "afb-stain": "/images/tests/afb-stain.png",

  "fungal-stain": "/images/tests/fungal-stain.png",

  "routine-afb-culture": "/images/tests/routine-afb-culture.png",

  "rapid-afb-culture": "/images/tests/rapid-afb-culture.png",

  "blood-culture": "/images/tests/blood-culture.png",

  "conjunctival-culture": "/images/tests/conjunctival-culture.png",

  "urine-cs": "/images/tests/urine-cs.png",

  "stool-cs": "/images/tests/stool-cs.png",

  "sputum-cs": "/images/tests/sputum-cs.png",

  "throat-cs": "/images/tests/throat-cs.png",

  "pus-cs": "/images/tests/pus-cs.png",

  "vaginal-cs": "/images/tests/vaginal-cs.png",
};


/* =====================================================
   MEDICAL ART COMPONENT
===================================================== */

export default function MedicalArt({
  id,
  type,
  className = "",
}) {
  const image =
    imageMap[id] ||
    imageMap[type];

  if (!image) {
    return (
      <div className={`medical-art-fallback ${className}`} >
        🧪
      </div>
    );
  }

  return (
    <img src={image} alt="" className={`medical-art-image ${className}`} draggable="false" />
  );
}