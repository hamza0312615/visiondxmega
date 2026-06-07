import { analyzeText } from '../utils/groqApi';

const WASENDER_URL = 'https://wasenderapi.com/api/send-message';
const WASENDER_TOKEN = '87aff4ff36918379d775c07af06aaceadb5315fb3972a60974eb5b8d6b680144';

export async function generateCHWReportText(patient, records, workerName) {
  if (!records || records.length === 0) return 'No diagnostic data recorded.';

  // Format records to be easily parsed by AI
  const recordsText = records.map((r, i) => {
    return `
Scan ${i + 1}: ${r.moduleName}
Severity: ${r.riskLevel.toUpperCase()}
Summary: ${r.summary}
Details: ${JSON.stringify(r.data?.details || {})}
`;
  }).join('\n');

  const prompt = `You are generating a final clinical handoff report for a Community Health Worker (CHW).
The CHW name is: ${workerName}
Patient Profile: ${JSON.stringify(patient)}

The CHW performed the following diagnostic scans on the patient in the field:
${recordsText}

Your task is to generate a professional, structured clinical summary intended to be sent via WhatsApp to a supervising doctor or hospital triage desk.
Requirements:
1. Start with 🏥 *VISIONDX CHW FIELD REPORT* 🏥
2. Include Patient Demographics (Name, Age, Gender, Contact)
3. Provide a brief clinical synthesis of the findings.
4. List the primary abnormal findings or critical alerts.
5. End with an overall urgency assessment (e.g. 🔴 HIGH URGENCY, 🟡 MODERATE URGENCY, 🟢 LOW URGENCY).
Make it concise and easy to read on a mobile phone. Do not include introductory/outro conversational text (like "Here is the report"). Just the raw WhatsApp text.`;

  try {
    const aiResponse = await analyzeText(prompt);
    return aiResponse;
  } catch (error) {
    console.error("Error generating report with Groq:", error);
    // Fallback static report generator
    let highestRisk = 'normal';
    if (records.some(r => r.riskLevel === 'warning')) highestRisk = 'warning';
    if (records.some(r => r.riskLevel === 'critical')) highestRisk = 'critical';

    const urgencyIcons = { normal: '🟢 LOW', warning: '🟡 MODERATE', critical: '🔴 HIGH' };

    return `🏥 *VISIONDX CHW FIELD REPORT* 🏥

*Patient:* ${patient.name}
*Age/Gender:* ${patient.age} / ${patient.gender}
*Contact:* ${patient.phone || 'N/A'}
*Worker ID:* ${workerName}

*Clinical Findings:*
${records.map(r => `- ${r.moduleName}: ${r.summary}`).join('\n')}

*Urgency Assessment:* ${urgencyIcons[highestRisk]} URGENCY
*(Auto-generated fallback report due to AI generation error)*`;
  }
}

export async function sendWhatsAppReport(patient, reportText) {
  const targetPhone = patient.phone; // Assuming patient.phone is in format +92 305 2353337 or similar
  
  if (!targetPhone) {
    throw new Error("Patient phone number is missing.");
  }

  const payload = {
    to: targetPhone,
    text: reportText
  };

  try {
    const response = await fetch(WASENDER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WASENDER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to send WhatsApp message via WaSender.');
    }

    return await response.json();
  } catch (error) {
    console.error("WhatsApp sending error:", error);
    throw error;
  }
}
