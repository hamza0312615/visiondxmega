// High-fidelity SVG Medical Illustrations represented as browser-compatible Data URLs
// All '#' are escaped to '%23' for correct Data URL rendering.

const svgTemplates = {
  eye_cataract: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23020810" rx="20"/><ellipse cx="200" cy="150" rx="130" ry="75" fill="%23ffffff" stroke="%2322d3ee" stroke-width="2"/><circle cx="200" cy="150" r="48" fill="%230ea5e9" stroke="%23ffffff" stroke-width="1.5"/><circle cx="200" cy="150" r="24" fill="%2394a3b8" opacity="0.85"/><circle cx="200" cy="150" r="22" fill="radial-gradient(circle, %23ffffff 0%, %2394a3b8 100%)"/><circle cx="185" cy="135" r="7" fill="%23ffffff" opacity="0.6"/><text x="200" y="260" fill="%23e2e8f0" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">MILKY LENS OPACITY DETECTED (CATARACT)</text></svg>`,
  
  eye_glaucoma: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23020810" rx="20"/><ellipse cx="200" cy="150" rx="130" ry="75" fill="%23ffffff" stroke="%23a855f7" stroke-width="2"/><circle cx="200" cy="150" r="48" fill="%23020810" stroke="%23a855f7" stroke-width="3" stroke-dasharray="4 2"/><circle cx="200" cy="150" r="40" fill="%236b21a8" opacity="0.3"/><circle cx="200" cy="150" r="18" fill="%23ffffff"/><circle cx="200" cy="150" r="12" fill="%23a855f7"/><text x="200" y="260" fill="%23c084fc" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">OPTIC NERVE HEAD PREDICTIONS</text></svg>`,

  skin_dermatitis: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23020810" rx="20"/><rect x="50" y="50" width="300" height="200" rx="15" fill="%23fbcfe8" opacity="0.85"/><circle cx="120" cy="110" r="12" fill="%23f43f5e" opacity="0.6"/><circle cx="140" cy="120" r="8" fill="%23f43f5e" opacity="0.7"/><circle cx="160" cy="95" r="15" fill="%23f43f5e" opacity="0.5"/><circle cx="190" cy="130" r="14" fill="%23f43f5e" opacity="0.6"/><circle cx="210" cy="110" r="9" fill="%23f43f5e" opacity="0.8"/><circle cx="230" cy="140" r="16" fill="%23f43f5e" opacity="0.5"/><circle cx="270" cy="100" r="10" fill="%23f43f5e" opacity="0.7"/><circle cx="110" cy="150" r="15" fill="%23f43f5e" opacity="0.5"/><circle cx="280" cy="150" r="12" fill="%23f43f5e" opacity="0.6"/><text x="200" y="235" fill="%23be123c" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">ACUTE DERMATITIS ERUPTION ZONE</text></svg>`,

  skin_psoriasis: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23020810" rx="20"/><rect x="50" y="50" width="300" height="200" rx="15" fill="%23fecdd3" opacity="0.8"/><path d="M120,90 Q150,70 180,95 Q220,120 260,90 Q300,110 270,150 Q230,170 190,140 Q150,165 110,130 Z" fill="%23f43f5e" opacity="0.5"/><path d="M125,95 Q145,80 175,100 Q215,115 250,95 M130,125 Q170,145 220,125 M160,110 Q200,120 230,105" fill="none" stroke="%23cbd5e1" stroke-width="3" stroke-linecap="round" opacity="0.9"/><text x="200" y="235" fill="%239f1239" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">SILVERY SCALY PLAQUE FORMATION</text></svg>`,

  hair_graying: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23020810" rx="20"/><rect x="50" y="50" width="300" height="200" rx="15" fill="%2318181b"/><path d="M100,250 C120,150 160,120 180,90 M130,250 C150,160 190,130 200,80 M160,250 C170,170 210,140 220,95 M210,250 C220,180 240,150 250,90 M250,250 C260,190 280,160 300,90" fill="none" stroke="%2352525b" stroke-width="4" stroke-linecap="round"/><path d="M115,250 C130,160 170,130 190,95 M180,250 C190,180 220,155 235,90 M230,250 C240,190 265,160 280,95" fill="none" stroke="%23cbd5e1" stroke-width="3" stroke-linecap="round"/><text x="200" y="235" fill="%23cbd5e1" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">PREMATURE GRAYING HAIR FOLLICLES</text></svg>`,

  hair_alopecia: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23020810" rx="20"/><rect x="50" y="50" width="300" height="200" rx="15" fill="%2318181b"/><path d="M80,250 C100,100 130,80 160,60 M120,250 C130,120 150,90 180,70 M280,250 C270,120 250,90 220,70 M320,250 C300,100 270,80 240,60" fill="none" stroke="%2309090b" stroke-width="5"/><circle cx="200" cy="150" r="45" fill="%23fda4af" opacity="0.8" stroke="%23f43f5e" stroke-width="2"/><text x="200" y="235" fill="%23f43f5e" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">ROUND BALD PATCH (ALOPECIA AREATA)</text></svg>`,

  hair_dandruff: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23020810" rx="20"/><rect x="50" y="50" width="300" height="200" rx="15" fill="%2327272a"/><path d="M100,240 C110,130 150,110 180,80 M200,240 C210,140 230,110 250,80 M300,240 C290,130 270,110 240,80" fill="none" stroke="%2309090b" stroke-width="4"/><polygon points="120,110 130,115 125,120" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="0.5"/><polygon points="160,130 170,133 162,140" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="0.5"/><polygon points="210,95 220,98 215,105" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="0.5"/><polygon points="250,140 260,145 252,150" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="0.5"/><polygon points="140,160 148,162 142,168" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="0.5"/><text x="200" y="235" fill="%23e2e8f0" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">SEBORRHEIC SCALES / DANDRUFF PARTICLES</text></svg>`,

  wound_incision: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23020810" rx="20"/><rect x="50" y="50" width="300" height="200" rx="15" fill="%23fed7aa" opacity="0.95"/><path d="M80,150 L320,150" fill="none" stroke="%23f43f5e" stroke-width="4"/><path d="M120,135 L120,165 M160,135 L160,165 M200,135 L200,165 M240,135 L240,165 M280,135 L280,165" fill="none" stroke="%2318181b" stroke-width="2.5"/><text x="200" y="235" fill="%23be123c" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">CLEAN INCISION LINE WITH STITCHES</text></svg>`,

  wound_infected: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23020810" rx="20"/><rect x="50" y="50" width="300" height="200" rx="15" fill="%23fecdd3" opacity="0.95"/><path d="M80,150 L320,150" fill="none" stroke="%23e11d48" stroke-width="8" stroke-linecap="round"/><circle cx="160" cy="150" r="12" fill="%23eab308" opacity="0.8"/><circle cx="240" cy="150" r="14" fill="%23eab308" opacity="0.7"/><path d="M120,130 L120,170 M200,130 L200,170 M280,130 L280,170" fill="none" stroke="%2309090b" stroke-width="3" opacity="0.8"/><text x="200" y="235" fill="%239f1239" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">INFECTION RISK: HIGH (YELLOW PURULENT EXUDATE)</text></svg>`,

  wound_laceration: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23020810" rx="20"/><rect x="50" y="50" width="300" height="200" rx="15" fill="%23ffedd5" opacity="0.95"/><path d="M100,160 Q150,130 200,155 Q250,180 300,150" fill="none" stroke="%23fda4af" stroke-width="8" stroke-linecap="round"/><path d="M100,160 Q150,130 200,155 Q250,180 300,150" fill="none" stroke="%23f43f5e" stroke-width="3" stroke-linecap="round"/><text x="200" y="235" fill="%239f1239" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">HEALING LACERATION INFLAMMATORY STAGE</text></svg>`,

  med_blurry: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23020810" rx="20"/><rect x="80" y="60" width="240" height="150" rx="10" fill="%23fee2e2" stroke="%23f43f5e" stroke-width="3" filter="blur(1.5px)"/><text x="200" y="120" fill="%239f1239" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" filter="blur(2px)">UNLABELLED PILLS</text><text x="200" y="250" fill="%23f43f5e" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">SUSPICIOUS PACKAGING WARNING</text></svg>`,

  lab_lipid: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23020810" rx="20"/><rect x="60" y="40" width="280" height="200" rx="10" fill="%23f8fafc" stroke="%233b82f6" stroke-width="2"/><text x="80" y="75" fill="%230f172a" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">LIPID SCORECARD PANEL</text><line x1="80" y1="90" x2="320" y2="90" stroke="%23e2e8f0" stroke-width="1.5"/><text x="80" y="115" fill="%23475569" font-family="monospace" font-size="10">Total Cholesterol: 260 mg/dL [HIGH]</text><text x="80" y="135" fill="%23475569" font-family="monospace" font-size="10">LDL (Bad): 185 mg/dL         [HIGH]</text><text x="80" y="135" fill="%23475569" font-family="monospace" font-size="10">HDL (Good): 35 mg/dL          [LOW]</text><text x="80" y="175" fill="%23475569" font-family="monospace" font-size="10">Triglycerides: 210 mg/dL     [HIGH]</text><line x1="80" y1="195" x2="320" y2="195" stroke="%23e2e8f0" stroke-width="1.5"/><text x="200" y="270" fill="%233b82f6" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">CARDIOVASCULAR LIPID WARNING SHOWN</text></svg>`
}

export const demoPresets = {
  skin: [
    {
      id: 'skin-1',
      title: 'Acute Eczema Rash (Real Image)',
      description: 'Dermatological rash demonstrating erythematous papules and micro-scaling.',
      location: 'Torso / Body Patch',
      itching: 'Severe',
      symptoms: 'Intense itching, dry scaly red patches, and tiny fluid-filled bumps spreading across the abdomen.',
      image: '/demo_skin.png',
      fileName: 'demo_skin.png',
      fallbackResult: {
        rawResponse: `**DERMATOLOGICAL CLINICAL AI ASSESSMENT**

Visual assessment of the inflammatory skin lesions reveals characteristics highly consistent with an **Acute Flare-Up of Atopic Dermatitis (Eczema)**.

**Diagnostic Observations:**
- **Morphology:** Diffuse erythematous (red) patches with numerous micro-papules and superficial scaling.
- **Distribution:** Clustered, typical of eczema flare-ups under environmental or physical triggers.
- **Infection Risk:** Mild secondary risk due to potential epidermal barrier disruption from scratching.

**Symptom Correlation:**
Matches severe itching and scaling reported by the patient.

**Urgency & Care Guidelines:**
- **Urgency Level:** **SEE_DOCTOR**
- **Skincare Precautions:** Stop using scented soaps, shower gels, or fragrances. Wash strictly with lukewarm water and a soap-free emollient cleanser. Pat the skin dry with a soft towel—do not rub.
- Apply a thick barrier cream (ceramide-based) within 3 minutes of bathing to seal in moisture.
- Avoid hot baths, tight synthetic clothing, and scratching the affected area.

**Suggested Topical & Systemic Medications:**
- **Topical Corticosteroid**: Hydrocortisone 1% cream or prescribed Betamethasone Valerate to reduce active dermal inflammation.
- **Topical Emollient**: CeraVe moisturizing cream or Cetaphil lotion applied 3-4 times daily.
- **Oral Antihistamine**: Cetirizine 10mg or Loratadine 10mg once daily to manage severe nocturnal itching.
`,
        details: {
          detectedCondition: 'Atopic Dermatitis (Eczema)',
          urgencyLevel: 'SEE DOCTOR',
          bodyLocation: 'Torso / Body Patch',
          itchingReported: 'Severe',
          expertDescription: 'Pink/red papules and dry scaling caused by compromised epidermal skin barrier.',
          causes: 'Genetic factors, immune triggers, stress, or soap allergens.',
          precautions: 'Apply rich ceramides. Stop scratching. Avoid hot showers and harsh soaps.'
        }
      }
    },
    {
      id: 'skin-2',
      title: 'Contact Dermatitis Rash',
      description: 'Acute pink inflammatory bumps with localized mild itching.',
      location: 'Left Forearm / Wrist',
      itching: 'Moderate',
      symptoms: 'Sudden red itchy rash containing micro-papules. Appeared shortly after using a new brand of laundry detergent.',
      image: svgTemplates.skin_dermatitis,
      fileName: 'preset_contact_dermatitis.png',
      fallbackResult: {
        rawResponse: `Based on a clinical dermatological AI evaluation, there is a clear representation of **Acute Contact Dermatitis** on the left forearm area.

**Observations:**
- **Asymmetry:** High symmetry matching irritant dermatitis lines rather than asymmetric malignant melanomas.
- **Borders:** Well-demarcated pink boundaries with small, raised inflammatory micro-papules.
- **Color:** Saturated pinkish-red hue indicating dermal capillary engorgement without blue-black signs.
- **Diameter:** Localized patch spans approximately 3.5cm.

**Potential Causes:**
Allergenic or irritant chemical exposure from laundry detergents, fabric softeners, soaps, or metal alloys (nickel).

**Urgency & Action Plan:**
- **Urgency Level:** NORMAL
- **Precautions:** Stop using suspected detergents. Wash the skin with lukewarm water and a soap-free gentle cleanser. Apply an over-the-counter soothing topical cream. Avoid scratching to prevent secondary bacterial infection.

NORMAL`,
        details: {
          detectedCondition: 'Contact Dermatitis',
          urgencyLevel: 'NORMAL',
          bodyLocation: 'Left Forearm / Wrist',
          itchingReported: 'Moderate',
          expertDescription: 'Pink/red papules and swelling caused by skin contact with foreign irritant substances.',
          causes: 'Chemicals, soaps, nickel, latex, cosmetics, or new laundry detergents.',
          precautions: 'Avoid further contact with the allergen. Wash the area thoroughly. Do not scratch.'
        }
      }
    },
    {
      id: 'skin-3',
      title: 'Psoriasis Silvery Plaque',
      description: 'Thick reddish plaque covered with prominent silvery scales.',
      location: 'Right Elbow Extension',
      itching: 'Mild',
      symptoms: 'Symmetrical dry red plaques on elbow extensions, exhibiting scaling, cracking, and mild itching over several months.',
      image: svgTemplates.skin_psoriasis,
      fileName: 'preset_psoriasis_plaque.png',
      fallbackResult: {
        rawResponse: `Based on clinical dermatological AI evaluation, the lesion exhibits characteristic visual indicators of **Chronic Plaque Psoriasis**.

**Observations:**
- **Appearance:** Symmetrical thick pink/red raised plaques with high density of silvery-white micaceous scaling.
- **Texture:** Dry, scaling skin with micro-fissures or cracking.
- **Urgency:** Medium priority chronic management.

**Potential Causes:**
Autoimmune-mediated rapid epidermal hyperproliferation triggered by genetic factors, physical stress, cold weather, or localized friction.

**Urgency & Action Plan:**
- **Urgency Level:** SEE_DOCTOR
- **Precautions:** Keep the skin moisturized with thick emollients. Avoid hot water. Do not forcefully scrub or peel off the silvery scales as this can trigger the Koebner phenomenon (worsening of plaques). Apply prescribed soothing topical ointments under professional guidance.

SEE_DOCTOR`,
        details: {
          detectedCondition: 'Psoriasis',
          urgencyLevel: 'SEE DOCTOR',
          bodyLocation: 'Right Elbow Extension',
          itchingReported: 'Mild',
          expertDescription: 'Chronic autoimmune disease causing red scaly patches, most commonly on elbows, knees, and scalp.',
          causes: 'Genetic factors and immune system triggers leading to rapid skin cell buildup.',
          precautions: 'Apply thick ointments and moisturizers. Avoid picking scales. Avoid stress and cold dry air.'
        }
      }
    }
  ],
  hair: [
    {
      id: 'hair-1',
      title: 'Alopecia Bald Spot',
      description: 'Smooth, circular bald patch on the scalp vertex with active hair fall.',
      location: 'Scalp Vertex / Crown',
      symptoms: 'Discovered a completely smooth, round bald patch about the size of a coin on the top of the crown last week.',
      image: svgTemplates.hair_alopecia,
      fileName: 'preset_alopecia.png',
      fallbackResult: {
        rawResponse: `Trichological evaluation of the scalp reveals a localized area of smooth, well-defined hair loss matching **Alopecia Areata**.

**Observations:**
- **Scalp Surface:** Pinkish, smooth skin, completely free of scarring or scaling.
- **Hair Follicles:** Small "exclamation point" hairs at the peripheral boundary indicating active follicle shedding.
- **Urgency:** Moderate medical priority.

**Potential Causes:**
Localized autoimmune reaction where T-lymphocytes target the hair follicles, causing them to enter the telogen (resting) phase prematurely.

**Urgency & Action Plan:**
- **Urgency Level:** SEE_DOCTOR
- **Precautions:** Avoid tight hairstyles, harsh hair treatments, chemical dyes, or extreme heat styling. Do not forcefully scrub the bald spot. Consult a dermatologist or trichologist for potential medical guidelines.

SEE_DOCTOR`,
        details: {
          patientName: 'Patient',
          detectedCondition: 'Alopecia Areata',
          urgencyLevel: 'SEE DOCTOR',
          symptomsReported: 'Smooth, round bald patch on crown.',
          scalpAnalysis: 'Smooth scalp skin showing focal alopecia with no scarring.',
          suggestedCare: 'Consult a dermatologist. Use gentle shampoos. Avoid styling heat.'
        }
      }
    },
    {
      id: 'hair-2',
      title: 'Premature White Hairs',
      description: 'Streaks of premature white graying strands on the crown vertex.',
      location: 'Scalp Vertex / Hair Shaft',
      symptoms: 'A rapid increase of white hairs in the front and crown over the last 6 months. High stress levels.',
      image: svgTemplates.hair_graying,
      fileName: 'preset_graying.png',
      fallbackResult: {
        rawResponse: `Trichological evaluation indicates signs of rapid **Premature Graying (Canities)**.

**Observations:**
- **Melanin Activity:** Focal loss of melanocyte activity in active hair shafts on the crown area.
- **Hair Shaft Integrity:** Normal thickness, but showing complete loss of pigment. Scalp skin appears completely healthy.

**Potential Causes:**
Genetics, elevated systemic oxidative stress, vitamin deficiencies (specifically B12, iron, or zinc), or metabolic shifts.

**Urgency & Action Plan:**
- **Urgency Level:** NORMAL
- **Precautions:** Maintain a nutrient-rich diet rich in antioxidants, B-complex vitamins, and iron. Manage chronic stress. Avoid excessive chemical bleaching, sulfates, or styling products that increase scalp oxidative load.

NORMAL`,
        details: {
          patientName: 'Patient',
          detectedCondition: 'Premature Graying',
          urgencyLevel: 'NORMAL',
          symptomsReported: 'Rapid white hair progression and chronic stress.',
          scalpAnalysis: 'Normal scalp density with graying and silver hair shafts.',
          suggestedCare: 'Take vitamin supplements, reduce stress, avoid harsh chemical dyes.'
        }
      }
    },
    {
      id: 'hair-3',
      title: 'Seborrheic Scalp Scales',
      description: 'Yellowish oily dandruff flakes and scalp inflammation.',
      location: 'Scalp Base / Occipital',
      symptoms: 'Severe scalp itching, thick oily yellow flakes falling on shoulders, red itchy patches at the scalp base.',
      image: svgTemplates.hair_dandruff,
      fileName: 'preset_dandruff.png',
      fallbackResult: {
        rawResponse: `Trichological AI evaluation reveals indicators of **Seborrheic Dermatitis (Scalp Dandruff)**.

**Observations:**
- **Scalp Condition:** Mild localized erythema (redness) accompanied by thick, greasy, yellowish scales clinging to hair shafts.
- **Infection Risk:** Low, but showing active yeast/Malassezia colonization risk due to sebum buildup.

**Potential Causes:**
Overgrowth of Malassezia yeast feeding on excess sebum, seasonal changes, or stress.

**Urgency & Action Plan:**
- **Urgency Level:** SEE_DOCTOR
- **Precautions:** Use an over-the-counter anti-dandruff shampoo containing ketoconazole, selenium sulfide, or zinc pyrithione 2-3 times a week. Avoid heavy hair oils (like coconut or olive oil) which can feed Malassezia yeast. Gently massage the scalp—do not scratch with fingernails.

SEE_DOCTOR`,
        details: {
          patientName: 'Patient',
          detectedCondition: 'Seborrheic Dermatitis',
          urgencyLevel: 'SEE DOCTOR',
          symptomsReported: 'Scalp itchiness and thick greasy yellow scales.',
          scalpAnalysis: 'Inflamed pink scalp base showing heavy sebum and oily scaling.',
          suggestedCare: 'Use ketoconazole shampoos. Avoid heavy greasy oils. Wash hair regularly.'
        }
      }
    }
  ],
  eye: [
    {
      id: 'eye-1',
      title: 'Bacterial Conjunctivitis (Real Image)',
      description: 'Extreme bloodshot sclera showing red vascular congestion and eyelid swelling.',
      image: '/demo_eye.png',
      fileName: 'demo_eye.png',
      fallbackResult: {
        rawResponse: `**OPHTHALMIC CLINICAL AI PREDICTION**

Evaluation of the ocular scan indicates a classic presentation of **Acute Bacterial Conjunctivitis** (Pink Eye).

**Visual Observations:**
- **Conjunctival Injection:** Severe, diffuse redness spreading across the bulbar and palpebral sclera.
- **Eyelid Status:** Mild localized edema (swelling) along the lower margin.
- **Pupil & Cornea:** Cornea appears clear, and pupil is normal, circular, and reactive. No signs of deep intraocular inflammation.

**Urgency & Safety Precautions:**
- **Urgency Level:** **SEE_DOCTOR**
- **Strict Hygiene Guidelines**: Highly contagious. Do not rub the eye. Wash hands with soap immediately after touching the face. Use dedicated towels and pillowcases and wash them in hot water.
- Remove contact lenses immediately. Do not wear contact lenses until the eye is completely clear for 48 hours.
- Apply a sterile cold compress to relieve ocular burning.

**Suggested Pharmacotherapy Considerations:**
- **Antibiotic Eye Drops**: Topical Moxifloxacin 0.5% or Tobramycin 0.3% ophthalmic drops, 1 drop in the affected eye 3-4 times daily for 5-7 days.
- **Lubricant Eye Drops**: Preservative-free artificial tears to soothe mechanical irritation.
`,
        details: {
          detectedCondition: 'Bacterial Conjunctivitis (Pink Eye)',
          urgencyLevel: 'SEE DOCTOR',
          primaryBiomarker: 'Bulbar Injection: Severe',
          clinicalCorrelation: 'Suggests localized bacterial contagion. Eye rubbing must be restricted.'
        }
      }
    },
    {
      id: 'eye-2',
      title: 'Milky Cataract Lens',
      description: 'Cloudy milky gray central lens indicating mature cataract.',
      image: svgTemplates.eye_cataract,
      fileName: 'preset_cataract.png',
      fallbackResult: {
        rawResponse: `Clinical AI vision evaluation indicates signs of a **Mature Senile Cataract**.

**Observations:**
- **Pupil Area:** High density milky-white cloudy opacity inside the lens behind the pupil.
- **Vision Impact:** Cloudiness is located centrally, which will cause blurry, washed-out, or doubled vision.

**Potential Causes:**
Age-related natural protein denaturation in the crystalline lens, accelerated by UV exposure, smoking, or diabetes.

**Urgency & Action Plan:**
- **Urgency Level:** SEE_DOCTOR
- **Precautions:** Schedule an evaluation with an ophthalmologist for a comprehensive visual test and discussion of surgical lens replacement. Wear sunglasses to protect the eyes from UV light.

SEE_DOCTOR`
      }
    },
    {
      id: 'eye-3',
      title: 'Glaucoma Disc Evaluation',
      description: 'Elevated optic disc cupping risk indicating glaucoma.',
      image: svgTemplates.eye_glaucoma,
      fileName: 'preset_glaucoma.png',
      fallbackResult: {
        rawResponse: `Ophthalmic AI evaluation of the optic nerve head indicates a high optic cup-to-disc ratio, presenting a risk for **Open-Angle Glaucoma**.

**Observations:**
- **Optic Disc Cupping:** Ratio is estimated above 0.7, indicating focal loss of neuroretinal rim.
- **Urgency:** High clinical priority.

**Potential Causes:**
Elevated intraocular pressure (IOP) leading to optic nerve fiber damage, genetic predisposition, or microvascular compromise.

**Urgency & Action Plan:**
- **Urgency Level:** SEE_DOCTOR
- **Precautions:** This requires a clinical dilated eye examination, tonometry (IOP test), and visual field test by an ophthalmologist. Early treatment with pressure-lowering drops is vital to prevent permanent peripheral vision loss.

SEE_DOCTOR`
      }
    }
  ],
  wound: [
    {
      id: 'wound-1',
      title: 'Surgical Incision Stitches',
      description: 'Clean post-op abdominal incision with secure horizontal stitches.',
      symptoms: 'Post-op abdominal incision, 5 days, showing mild redness but no swelling or discharge. Healing tracker scan.',
      image: svgTemplates.wound_incision,
      fileName: 'preset_surgical_stitches.png',
      fallbackResult: {
        rawResponse: `Surgical wound AI tracking shows a **Healthy Healing Incision** with no signs of clinical complications.

**Observations:**
- **Incision Line:** Well-approximated skin borders with neat, secure surgical sutures.
- **Erythema (Redness):** Minimal localized pink borders, perfectly normal for day 5 post-op.
- **Exudate:** Complete absence of yellow purulent discharge or swelling.

**Urgency & Care Guidelines:**
- **Urgency Level:** NORMAL
- **Precautions:** Keep the wound clean and completely dry. Change dressings exactly as instructed by your surgeon. Avoid heavy lifting or strain. Do not pick or scrub the stitches.

NORMAL`,
        details: {
          detectedCondition: 'Healthy Incision',
          urgencyLevel: 'NORMAL',
          bodyLocation: 'Abdomen / Post-Op',
          infectionRisk: 'Low (0-5%)',
          healingStage: 'Inflammatory-Proliferative Transition'
        }
      }
    },
    {
      id: 'wound-2',
      title: 'Infected Wound Alert',
      description: 'Swollen red incision showing active yellow purulent exudates.',
      symptoms: 'Abdominal surgical wound at day 7. Pain has increased, skin is hot, red spreading swelling, and yellow fluid leaking.',
      image: svgTemplates.wound_infected,
      fileName: 'preset_infected_wound.png',
      fallbackResult: {
        rawResponse: `🚨 **CRITICAL INFECTION WARNING** 🚨

Wound tracking AI indicates high-risk parameters matching an **Active Surgical Site Infection (SSI)**.

**Observations:**
- **Erythema (Redness):** Intense, spreading dark red borders, hot to the touch.
- **Exudate (Discharge):** Visible yellow-green purulent fluid (pus) leaking from suture gaps.
- **Swelling:** Spreading edema (swelling) across the margins.

**Urgency & Urgent Guidelines:**
- **Urgency Level:** EMERGENCY
- **Precautions:** Seek immediate medical attention or visit your surgeon/ER. This requires urgent wound cleaning, swab culture, and systemic antibiotics. Do not squeeze, pop, or scrub the pus out. Cover with a clean sterile dressing.

EMERGENCY`,
        details: {
          detectedCondition: 'Surgical Site Infection',
          urgencyLevel: 'EMERGENCY',
          bodyLocation: 'Abdomen / Post-Op',
          infectionRisk: 'High (Active Infection)',
          healingStage: 'Complicated / Delayed'
        }
      }
    },
    {
      id: 'wound-3',
      title: 'Healing Laceration Scar',
      description: 'Irregular skin laceration undergoing healthy scar tissue remodeling.',
      symptoms: 'Laceration on right thigh from a fall 2 weeks ago. Stitches were removed, skin is joined, slightly dark pink scar.',
      image: svgTemplates.wound_laceration,
      fileName: 'preset_laceration_scar.png',
      fallbackResult: {
        rawResponse: `Wound tracking AI indicates a **Healing Laceration** in the late proliferative / remodeling stage.

**Observations:**
- **Wound Closure:** 100% epithelialization achieved. Skin margins are fully joined.
- **Scar Tissue:** Light pinkish-dark color representing active capillary blood flow in the newly formed scar. No active inflammation.

**Urgency & Care Guidelines:**
- **Urgency Level:** NORMAL
- **Precautions:** Keep the scar protected from sunlight using sunscreen or clothing to prevent hyperpigmentation (darkening). Massage with pure aloe vera or medical silicone gel to promote smooth remodeling.

NORMAL`,
        details: {
          detectedCondition: 'Healing Laceration',
          urgencyLevel: 'NORMAL',
          bodyLocation: 'Right Thigh',
          infectionRisk: 'None (Closed)',
          healingStage: 'Remodeling / Scar Tissue'
        }
      }
    }
  ],
  medicine: [
    {
      id: 'med-1',
      title: 'Flagyl 400mg Verification (Real Image)',
      description: 'Real packaging scan of SANOFI Flagyl 400mg Metronidazole anti-infective pills.',
      symptoms: 'OCR Check on SANOFI Flagyl 400mg blister packaging.',
      image: '/demo_medicine.png',
      fileName: 'demo_medicine.png',
      fallbackResult: {
        rawResponse: `**PHARMACEUTICAL OCR & DRUG INTEGRITY REPORT**

Our packaging verification model has successfully identified and matched the label data.

**Identified Medication Details:**
- **Brand Name:** **Flagyl 400mg**
- **Active Ingredient:** **Metronidazole 400mg**
- **Manufacturer:** **SANOFI**
- **Classification:** Anti-amebic and Anti-infective agent.
- **Integrity Score:** **VERIFIED AUTHENTIC (98%)**

**Indications:**
Used for the treatment of anaerobic bacterial infections, amebiasis, giardiasis, trichomoniasis, and bacterial vaginosis.

**CRITICAL CLINICAL WARNINGS:**
- **NO ALCOHOL**: **Strictly avoid alcohol** during treatment and for at least 48 hours after the last dose. Mixing Metronidazole with alcohol triggers a severe disulfiram-like reaction (causing intense vomiting, rapid heart rate, throbbing headache, and flushing).
- **Gastric Protection**: Always take the tablet with or immediately after food to minimize stomach irritation.
- **Complete the Course**: Finish the entire prescribed duration even if symptoms resolve early, to prevent microbial resistance.

**Standard Dosage Information:**
- **Adult Amebiasis**: Typically 400mg to 800mg three times daily for 5-10 days, depending on severity and physician prescription.
`,
        details: {
          brandName: 'Flagyl 400mg (SANOFI)',
          activeIngredient: 'Metronidazole 400mg',
          authStatus: 'VERIFIED AUTHENTIC',
          counterfeitRisk: 'Low (0-2%)',
          usageIndication: 'Anti-amebic & Anti-infective agent'
        }
      }
    },
    {
      id: 'med-2',
      title: 'Suspicious Packaging Alert',
      description: 'Blurry, unlabeled medicine box showing signs of counterfeit risk.',
      symptoms: 'Found a blister pack with faint, smudged print, pill color is uneven, bought from a street vendor.',
      image: svgTemplates.med_blurry,
      fileName: 'preset_med_suspicious.png',
      fallbackResult: {
        rawResponse: `🚨 **HIGH COUNTERFEIT WARNING** 🚨

Pharmaceutical packaging AI has detected critical anomalies presenting a **High Counterfeit Risk**.

**Observations:**
- **Print Quality:** Smudged, faint text with poor font alignment.
- **Labeling:** Complete absence of lot numbers, manufacturing dates, and mandatory drug safety barcodes.
- **Pill Integrity:** Uneven coloring and crumbly edges.

**Urgency & Guidelines:**
- **Urgency Level:** EMERGENCY
- **Precautions:** **DO NOT CONSUME THIS MEDICINE.** Dispose of it safely. Consuming counterfeit medicines can lead to severe poisoning or treatment failure. Always buy medicines from licensed, verified pharmacies.

EMERGENCY`,
        details: {
          brandName: 'Unknown / Smudged Label',
          activeIngredient: 'Unverified paracetamol-like pill',
          authStatus: 'CRITICAL WARNING: FAKE SUSPECTED',
          counterfeitRisk: 'High (90%+ Anomaly Score)',
          usageIndication: 'DISCARD IMMEDIATELY'
        }
      }
    }
  ],
  lab: [
    {
      id: 'lab-1',
      title: 'Aman Care Hematology (Real Image)',
      description: 'Real patient laboratory report sheet for Abdullah (18y/M) showing high WBC 23.75.',
      image: '/demo_lab.jpg',
      fileName: 'demo_lab.jpg',
      fallbackResult: {
        rawResponse: `**CLINICAL HEMATOLOGY LABORATORY ANALYSIS**

This diagnostic assessment is based on the verified blood complete count from Aman Care Laboratories for patient **Abdullah** (18-year-old Male).

**Critical Biomarker Alerts:**
- **WBC (Total Leukocyte Count):** **23.75 x10^3/uL** (Reference Range: 4.0 - 11.0) — **CRITICAL ELEVATION (Leukocytosis)**. This is a severe increase.
- **Neutrophils:** **91%** (Reference Range: 40 - 75%) — **SEVERE ELEVATION (Neutrophilia)**. 
- **Lymphocytes:** **4%** (Reference Range: 20 - 45%) — **MARKED DEPRESSION (Lymphopenia)**.
- **PDW:** **19.4 fL** (Reference Range: 10 - 18) — **ELEVATED**.

**Clinical Interpretation:**
The combination of highly elevated WBC (23.75) and neutrophilic dominance (91%) with relative lymphopenia strongly correlates with an **Acute Systemic Bacterial Infection** or a severe acute inflammatory response. Immediate clinical correlation is required to identify the focal origin (e.g., respiratory, urinary, gastrointestinal, or abdominal).

**Urgent Precautions:**
- **Urgency Level:** **EMERGENCY**
- Monitor core body temperature every 4 hours. Watch for signs of high fever, chills, confusion, or rapid breathing (sepsis watch).
- Maintain robust oral hydration.
- Avoid rigorous physical exertion or exposure.
- Bring this exact laboratory sheet to a medical practitioner immediately.

**Suggested Pharmacotherapy Considerations:**
- **Antibiotic Therapy**: Broad-spectrum antibiotic coverage under direct physician guidelines (e.g., Ciprofloxacin, Amoxicillin-Clavulanate) may be indicated pending physical exam.
- **Antipyretics**: Paracetamol 500mg for fever control if temperature exceeds 38.5C (101.3F).
`,
        details: {
          reportCategory: 'Hematology / Aman Care CBC',
          detectedAnomalies: 'High WBC (23.75 x10^3/uL), Neutrophils 91%',
          urgencyAssessed: 'EMERGENCY',
          primaryBiomarker: 'WBC: 23.75, Neutrophils: 91%, Lymphocytes: 4%',
          clinicalCorrelation: 'Severe acute bacterial infection or acute systemic inflammatory flare-up.'
        }
      }
    },
    {
      id: 'lab-2',
      title: 'Lipid Cardiovascular Panel',
      description: 'Lipid score showing elevated LDL and total cholesterol.',
      image: svgTemplates.lab_lipid,
      fileName: 'preset_lipid_panel.png',
      fallbackResult: {
        rawResponse: `Clinical AI Lab Report analysis of your **Lipid Panel** indicates **Hypercholesterolemia (High Cholesterol)**.

**Biomarker Analysis:**
- **Total Cholesterol:** 260 mg/dL (Reference: <200) — **HIGH**.
- **LDL (Bad Cholesterol):** 185 mg/dL (Reference: <100) — **HIGH**. Increased cardiovascular risk.
- **HDL (Good Cholesterol):** 35 mg/dL (Reference: >40) — **LOW**.
- **Triglycerides:** 210 mg/dL (Reference: <150) — **HIGH**.

**Potential Causes:**
High dietary intake of saturated fats, sedentary lifestyle, genetic hyperlipidemia, or endocrine imbalances.

**Urgency & Actions:**
- **Urgency Level:** SEE_DOCTOR
- **Precautions:** Consult a physician or cardiologist to assess cardiovascular health and discuss lipid-lowering options (dietary changes, exercise, or statins). Adopt a Mediterranean diet rich in soluble fibers and omega-3.

SEE_DOCTOR`,
        details: {
          reportCategory: 'Cardiovascular Lipid Panel',
          detectedAnomalies: 'Hypercholesterolemia (High LDL)',
          urgencyAssessed: 'SEE DOCTOR',
          primaryBiomarker: 'LDL: 185 mg/dL',
          clinicalCorrelation: 'Increased risk of arterial plaque buildup (atherosclerosis).'
        }
      }
    }
  ]
}
