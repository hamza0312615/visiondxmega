export const labTemplates = {
  'General / Complete Blood Count (CBC)': [
    { name: 'Hemoglobin', value: '13.5', unit: 'g/dL', refRange: '12.0 - 16.0' },
    { name: 'White Blood Cell (WBC)', value: '7.5', unit: 'x10^3/uL', refRange: '4.0 - 11.0' },
    { name: 'Red Blood Cell (RBC)', value: '4.8', unit: 'x10^6/uL', refRange: '4.2 - 5.4' },
    { name: 'Platelet Count', value: '250', unit: 'x10^3/uL', refRange: '150 - 450' }
  ],
  'Lipid Panel / Cholesterol': [
    { name: 'Total Cholesterol', value: '210', unit: 'mg/dL', refRange: '< 200' },
    { name: 'HDL (Good) Cholesterol', value: '45', unit: 'mg/dL', refRange: '> 40' },
    { name: 'LDL (Bad) Cholesterol', value: '135', unit: 'mg/dL', refRange: '< 100' },
    { name: 'Triglycerides', value: '160', unit: 'mg/dL', refRange: '< 150' }
  ],
  'Blood Sugar / HbA1c / Diabetes Panel': [
    { name: 'Fasting Blood Sugar', value: '98', unit: 'mg/dL', refRange: '70 - 99' },
    { name: 'Post-Prandial Glucose', value: '145', unit: 'mg/dL', refRange: '< 140' },
    { name: 'HbA1c (Glycated Hb)', value: '6.1', unit: '%', refRange: '< 5.7' }
  ],
  'Liver Function Test (LFT)': [
    { name: 'Bilirubin Total', value: '0.9', unit: 'mg/dL', refRange: '0.2 - 1.2' },
    { name: 'SGOT / AST', value: '38', unit: 'U/L', refRange: '8 - 48' },
    { name: 'SGPT / ALT', value: '42', unit: 'U/L', refRange: '7 - 56' },
    { name: 'Alkaline Phosphatase', value: '90', unit: 'U/L', refRange: '44 - 147' }
  ],
  'Kidney Function Test (KFT / Electrolytes)': [
    { name: 'Serum Creatinine', value: '1.1', unit: 'mg/dL', refRange: '0.6 - 1.2' },
    { name: 'Blood Urea Nitrogen (BUN)', value: '16', unit: 'mg/dL', refRange: '7 - 20' },
    { name: 'Serum Sodium', value: '140', unit: 'mEq/L', refRange: '135 - 145' },
    { name: 'Serum Potassium', value: '4.2', unit: 'mEq/L', refRange: '3.5 - 5.0' }
  ]
}
