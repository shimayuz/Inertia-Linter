import type { BarrierInfo } from '../types/inertia-buster'

const ACCESS_DISCLAIMER =
  'This is informational content derived from published guidelines, payer data, and pharmacy assistance resources. It does not constitute a recommendation. Access and formulary information changes frequently \u2014 verify with the patient\u2019s specific plan.'

export const ACCESS_BARRIERS: ReadonlyArray<BarrierInfo> = [
  {
    blockerId: 'arni-pa-denied',
    pillar: 'ARNI_ACEi_ARB',
    blockerCode: 'PA_DENIED',
    title: 'Prior Authorization Denied for ARNI',
    information: [
      'ARNI (sacubitril/valsartan) is the most commonly PA-denied heart failure medication due to its brand-name cost.',
      'Common denial reasons include missing documentation of ACEi/ARB trial, insufficient EF documentation, or formulary-preferred alternatives.',
      'PA denial does not eliminate the RAAS inhibition pillar: generic ACEi or ARB remains available with a lower evidence bar and no PA requirement in most plans.',
      'Appeal success rates for ARNI PAs are estimated at 40\u201360% when supported by specialist documentation and guideline citations.',
    ],
    practicalOptions: [
      'Appeal with HF specialist letter citing AHA Class I recommendation and patient-specific clinical rationale',
      'Bridge with generic ACEi (enalapril, lisinopril) or ARB (losartan, valsartan) at evidence-based doses during appeal',
      'Enroll in Novartis Entresto Patient Assistance Program (Together with Entresto) for eligible patients',
      'Request peer-to-peer review with the payer medical director',
    ],
    whenNotTo: [
      'Patient is already on maximally tolerated ACEi/ARB and clinically stable',
      'Denial is based on a genuine clinical contraindication documented by the payer',
    ],
    evidenceSource:
      'PARADIGM-HF (NEJM 2014), AHA/ACC/HFSA 2022 Guideline, ACC Expert Consensus Decision Pathway 2021',
    disclaimer: ACCESS_DISCLAIMER,
  },
  {
    blockerId: 'arni-step-therapy',
    pillar: 'ARNI_ACEi_ARB',
    blockerCode: 'STEP_THERAPY_REQUIRED',
    title: 'Step Therapy Required Before ARNI Approval',
    information: [
      'Many payers require a documented trial of ACEi or ARB before approving ARNI (sacubitril/valsartan).',
      'PARADIGM-HF itself required an ACEi/ARB run-in period before randomization, which provides some clinical rationale for step therapy.',
      'However, step therapy delays access to the superior agent and may result in avoidable HF hospitalizations during the mandatory trial period.',
      'Typical required trial duration is 30\u201390 days on ACEi/ARB before ARNI PA resubmission.',
    ],
    practicalOptions: [
      'Start ACEi or ARB at evidence-based dose immediately to satisfy step therapy requirement',
      'Document the trial period start date, dose, and tolerability in the medical record',
      'Resubmit PA with documentation once step therapy criterion is met',
      'Request step therapy exception if patient has prior documented ACEi/ARB use (may already qualify)',
    ],
    whenNotTo: [
      'Patient has prior documented ACEi/ARB use in their medical history (step therapy may already be satisfied)',
      'Patient was recently hospitalized for HF (some plans waive step therapy after hospitalization)',
    ],
    evidenceSource:
      'PARADIGM-HF (NEJM 2014), AHA/ACC/HFSA 2022 Guideline, IQVIA Prior Authorization Data 2023',
    disclaimer: ACCESS_DISCLAIMER,
  },
  {
    blockerId: 'sglt2i-pa-denied',
    pillar: 'SGLT2i',
    blockerCode: 'PA_DENIED',
    title: 'Prior Authorization Denied for SGLT2i',
    information: [
      'Generic dapagliflozin became available in 2024, reducing cost and PA requirements on many formularies.',
      'Some plans still require PA for SGLT2i when prescribed for HF rather than type 2 diabetes, particularly for HFpEF indications.',
      'HFpEF indication coverage varies by payer: some plans only cover SGLT2i for HFrEF or diabetes, not HFpEF.',
      'Denial rates have decreased substantially since generic availability but remain significant for non-preferred agents.',
    ],
    practicalOptions: [
      'Switch to generic dapagliflozin if the denied agent was brand empagliflozin (Jardiance)',
      'Appeal citing AHA/ACC 2022 (Class 2a for HFrEF/HFmrEF/HFpEF) and ESC 2023 (Class I for HFrEF, Class I for HFpEF)',
      'Apply for manufacturer copay assistance (Boehringer Ingelheim for empagliflozin, AstraZeneca for dapagliflozin)',
      'If denial is for HFpEF specifically, provide DELIVER (NEJM 2022) and EMPEROR-Preserved (NEJM 2021) trial citations',
    ],
    whenNotTo: [
      'Denial is for a type 2 diabetes indication (different PA pathway and coding)',
      'Patient has a clinical contraindication that the payer identified correctly',
    ],
    evidenceSource:
      'DAPA-HF (NEJM 2019), DELIVER (NEJM 2022), EMPEROR-Preserved (NEJM 2021), ACC ECDP SGLT2i 2024, FDA Generic Approval 2024',
    disclaimer: ACCESS_DISCLAIMER,
  },
  {
    blockerId: 'sglt2i-formulary-excluded',
    pillar: 'SGLT2i',
    blockerCode: 'FORMULARY_EXCLUDED',
    title: 'SGLT2i Not on Formulary',
    information: [
      'Some Medicaid managed care and state formularies still exclude SGLT2i or restrict coverage to diabetes-only indications.',
      'Generic dapagliflozin availability (2024) is expanding formulary inclusion, but uptake varies by plan and state.',
      'Formulary exclusion differs from PA denial: exclusion means the drug class itself is not covered, requiring a formulary exception process.',
      'The CMS IRA (Inflation Reduction Act) price negotiation may further affect SGLT2i coverage landscape for Medicare plans.',
    ],
    practicalOptions: [
      'Request a formulary exception citing Class I/2a guideline recommendation for HF',
      'Switch to a formulary-included SGLT2i agent if one is available on the plan',
      'Apply for manufacturer Patient Assistance Program (PAP) for patients meeting income criteria',
      'Explore state pharmaceutical assistance programs (SPAPs) for additional coverage',
    ],
    whenNotTo: [
      'A formulary-included SGLT2i alternative is already available on the patient\'s plan',
      'Patient is transitioning insurance plans and the new plan may cover the medication',
    ],
    evidenceSource:
      'ACC ECDP SGLT2i 2024, CMS Formulary Reference Files 2024, AHA/ACC/HFSA 2022 Guideline',
    disclaimer: ACCESS_DISCLAIMER,
  },
  {
    blockerId: 'mra-copay-high',
    pillar: 'MRA',
    blockerCode: 'COPAY_PROHIBITIVE',
    title: 'Prohibitive Copay for MRA',
    information: [
      'Spironolactone is available as a low-cost generic, often under $4/month through major pharmacy discount programs.',
      'Eplerenone, while also generic, typically has a higher copay ($15\u201350/month) and may not be on all discount programs.',
      'If the copay barrier is for eplerenone specifically, switching to spironolactone may resolve the cost issue for most patients.',
      'Gynecomastia risk with spironolactone (approximately 10% in men) is the primary clinical reason to prefer eplerenone.',
    ],
    practicalOptions: [
      'Switch from eplerenone to spironolactone if tolerated (lower cost, same mortality benefit)',
      'Enroll in $4 generic program at major pharmacy chains (Walmart, Costco, etc.) for spironolactone',
      'Use GoodRx or similar discount card for eplerenone if spironolactone is not tolerated',
      'Apply for NeedyMeds or RxAssist resources for additional assistance options',
    ],
    whenNotTo: [
      'Patient previously developed gynecomastia or breast tenderness on spironolactone (eplerenone switch was intentional)',
      'Patient requires specific eplerenone formulation due to drug interactions affecting spironolactone metabolism',
    ],
    evidenceSource:
      'RALES (NEJM 1999), EMPHASIS-HF (NEJM 2011), GoodRx Pricing Data, AHA/ACC/HFSA 2022 Guideline',
    disclaimer: ACCESS_DISCLAIMER,
  },
  {
    blockerId: 'generic-copay-prohibitive',
    pillar: 'ARNI_ACEi_ARB',
    blockerCode: 'COPAY_PROHIBITIVE',
    title: 'Prohibitive Copay for ARNI',
    information: [
      'Brand Entresto (sacubitril/valsartan) costs approximately $600/month without insurance coverage.',
      'Generic sacubitril/valsartan has begun to enter the market in some regions, which may substantially reduce out-of-pocket costs.',
      'Even with insurance, specialty tier copays for brand ARNI can exceed $100\u2013200/month depending on the plan.',
      'Novartis offers the Entresto Savings Program providing eligible commercially insured patients with reduced copays.',
    ],
    practicalOptions: [
      'Check availability of generic sacubitril/valsartan at patient\'s pharmacy',
      'Enroll in Novartis Entresto Savings Program (for commercially insured patients)',
      'Apply for Novartis Patient Assistance Foundation (for uninsured or underinsured patients)',
      'Explore Medicare Extra Help (Low-Income Subsidy) for eligible Medicare patients',
      'Contact state pharmaceutical assistance programs (SPAPs) for supplemental coverage',
    ],
    whenNotTo: [
      'Patient has already applied for all available assistance programs and been denied',
      'Generic ACEi/ARB at target dose is clinically appropriate and cost is the only barrier to ARNI',
    ],
    evidenceSource:
      'PARADIGM-HF (NEJM 2014), AHA/ACC/HFSA 2022 Guideline, Novartis Patient Assistance Program, Medicare.gov Extra Help',
    disclaimer: ACCESS_DISCLAIMER,
  },
  {
    blockerId: 'periop-sglt2i-hold',
    pillar: 'SGLT2i',
    blockerCode: 'PERIOP_HOLD',
    title: 'Perioperative SGLT2i Hold',
    information: [
      'ADA and AACE recommend holding SGLT2i at least 3 days before scheduled surgery due to euglycemic diabetic ketoacidosis (euDKA) risk.',
      'EuDKA risk with SGLT2i is estimated at 0.1\u20130.5% overall but is elevated during perioperative fasting and metabolic stress.',
      'The FDA issued a safety communication in 2020 recommending temporary discontinuation before scheduled surgery.',
      'Risk factors for perioperative euDKA include prolonged fasting, dehydration, acute illness, and reduced carbohydrate intake.',
    ],
    practicalOptions: [
      'Hold SGLT2i 3 days (72 hours) before scheduled surgery as recommended by ADA/AACE',
      'Restart SGLT2i when patient has resumed normal oral intake post-operatively',
      'Flag SGLT2i restart at post-operative follow-up visit to avoid unintentional permanent discontinuation',
      'Document hold reason and planned restart date in surgical and discharge documentation',
    ],
    whenNotTo: [
      'Minor outpatient procedures that do not require general anesthesia or fasting',
      'Procedures where oral intake continues throughout (e.g., local anesthesia only)',
      'Emergency surgery where the 3-day washout is not feasible (monitor for euDKA instead)',
    ],
    evidenceSource:
      'ADA Standards of Care 2024, FDA Safety Communication (March 2020), AACE Consensus Statement 2023, ACC ECDP SGLT2i 2024',
    disclaimer: ACCESS_DISCLAIMER,
  },
]
