import { analyzeImage, analyzeText } from './groqApi'
import { saveResult, getApiKey } from './localStorage'

export const analyzeLabReport = async ({
  activeTab,
  reportType,
  manualParams,
  imageFile,
  presetData,
  customParams,
  customFile,
  forcePreset
}) => {
  const activeFile = customFile || imageFile
  const activeParams = customParams || manualParams

  if (activeTab !== 'manual' && !activeFile) {
    throw new Error('Please capture or upload a lab report photo to analyze.')
  }

  if (activeTab === 'manual' && activeParams.length === 0) {
    throw new Error('Please enter at least one lab parameter to analyze.')
  }

  // Preset simulated fallback mode if API keys are missing
  const activePreset = forcePreset || presetData
  const hasKey = getApiKey() || localStorage.getItem('visiondx_gemini_key')
  if (activePreset && activeFile && activeFile.name === activePreset.fileName && !hasKey) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const saved = saveResult('lab', activePreset.fallbackResult)
        resolve(saved)
      }, 1500)
    })
  }

  // Load active patient profile
  const profile = JSON.parse(localStorage.getItem('visiondx_user') || '{"name":"John Doe","age":"30","gender":"Male"}')

  let aiResponse = ''
  if (activeTab === 'manual') {
    const textPrompt = `You are an expert clinical pathologist AI assistant. A patient has manually logged their lab report results.
Patient Details:
- Name: ${profile.name}
- Age: ${profile.age} years
- Gender: ${profile.gender}
Report Type: ${reportType}

Entered Parameters:
${activeParams.map(p => `- ${p.name}: ${p.value} ${p.unit} (Ref Range: ${p.refRange || 'Not specified'})`).join('\n')}

Analyze these medical parameters:
1) Identify all abnormal/out-of-range values. Match them against the specified reference ranges.
2) In a section titled "**Diagnostics Interpretation**", explain what these abnormal values indicate in simple, patient-friendly terms, potential underlying causes, and suggested dietary/lifestyle modifications.
3) In a section titled "**Suggested Precautions & Early Care**", suggest generic early care precautions or nutritional advice to follow in the absence of a doctor.
4) End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`

    aiResponse = await analyzeText(textPrompt)
  } else {
    const visionPrompt = `You are an expert clinical pathologist AI assistant. Analyze this medical lab report image. Report Type specified by patient: "${reportType}".
Patient Profile context: Name: ${profile.name}, Age: ${profile.age}, Gender: ${profile.gender}.
1) Perform optical character recognition to extract key test parameters, patient results, and reference ranges.
2) Clearly identify and list all abnormal values (e.g., High/Low flags).
3) In a section titled "**Diagnostics Interpretation**", explain what these abnormal values indicate in simple, patient-friendly terms, potential underlying causes, and suggested dietary/lifestyle modifications.
4) In a section titled "**Suggested Precautions & Early Care**", suggest generic early care precautions or nutritional advice to follow in the absence of a doctor.
5) Provide clear clinical advice and determine medical urgency. End your response with exactly one of these urgency flags: NORMAL, SEE_DOCTOR, or EMERGENCY.`

    aiResponse = await analyzeImage(activeFile, visionPrompt)
  }

  let abnormalSummary = 'Analyzing parameters...'
  const lowerRes = aiResponse.toLowerCase()
  if (lowerRes.includes('normal') && !lowerRes.includes('abnormal') && !lowerRes.includes('high') && !lowerRes.includes('low')) {
    abnormalSummary = 'All Key Parameters Appear Within Normal Reference Ranges'
  } else {
    abnormalSummary = 'Abnormal Values / Out-of-Range Parameters Detected'
  }

  let urgency = 'SEE_DOCTOR'
  if (aiResponse.includes('EMERGENCY')) urgency = 'EMERGENCY'
  else if (aiResponse.includes('NORMAL')) urgency = 'NORMAL'

  const resultDetails = {
    patientName: profile.name,
    patientAge: `${profile.age} Years`,
    patientGender: profile.gender,
    reportCategory: reportType,
    parameterAssessment: abnormalSummary,
    assessedUrgency: urgency.replace('_', ' ')
  }

  // Add manual params data to history if entered manually, so we can re-render the table
  const resultData = {
    summary: `Lab Report Analysis (${reportType}): ${abnormalSummary}. Urgency: ${urgency.replace('_', ' ')}.`,
    rawResponse: aiResponse,
    details: resultDetails,
    loggedParameters: activeTab === 'manual' ? activeParams : null
  }

  const saved = saveResult('lab', resultData)
  return saved
}
