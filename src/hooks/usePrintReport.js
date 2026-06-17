import { formatTime } from '../utils/localStorage'

function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

export function usePrintReport() {
  const printReport = (moduleName, data) => {
    if (!data) return
    
    const profile = JSON.parse(localStorage.getItem('visiondx_user') || '{"name":"Abdullah","age":"18","gender":"Male"}')
    const patientName = profile.name || 'Abdullah'
    const patientAge = profile.age || '18'
    const patientGender = profile.gender || 'Male'
    
    // Create print container
    const printDiv = document.createElement('div')
    printDiv.id = 'visiondx-print-root'
    printDiv.style.position = 'absolute'
    printDiv.style.left = '-9999px'
    printDiv.style.top = '-9999px'
    
    // Add custom printing styles to head
    const styleEl = document.createElement('style')
    styleEl.id = 'visiondx-print-styles'
    styleEl.innerHTML = `
      #visiondx-print-root {
        display: none !important;
      }
      @media print {
        body > *:not(#visiondx-print-root) {
          display: none !important;
        }
        #visiondx-print-root {
          position: static !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          display: block !important;
          background: white !important;
          color: black !important;
          font-family: system-ui, -apple-system, sans-serif !important;
          padding: 20px !important;
        }
        .print-header {
          border-bottom: 2px solid #00d4aa !important;
          padding-bottom: 15px !important;
          margin-bottom: 20px !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
        }
        .print-title {
          font-size: 24px !important;
          font-weight: 800 !important;
          color: #011627 !important;
        }
        .print-subtitle {
          font-size: 11px !important;
          color: #707070 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }
        .patient-details-grid {
          display: grid !important;
          grid-template-columns: 1fr 1fr 2fr !important;
          gap: 15px !important;
          background: #f4f6f8 !important;
          border: 1px solid #e1e4e6 !important;
          padding: 15px !important;
          border-radius: 12px !important;
          margin-bottom: 25px !important;
          font-size: 13px !important;
        }
        .detail-label {
          color: #707070 !important;
          font-weight: bold !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          margin-bottom: 3px !important;
        }
        .detail-value {
          font-weight: 600 !important;
          color: #011627 !important;
        }
        .print-badge {
          display: inline-block !important;
          padding: 5px 12px !important;
          border-radius: 9999px !important;
          font-size: 12px !important;
          font-weight: bold !important;
          border: 1px solid !important;
          margin-bottom: 20px !important;
        }
        .badge-red {
          background-color: #ffeef0 !important;
          border-color: #ffc1c8 !important;
          color: #ff3860 !important;
        }
        .badge-yellow {
          background-color: #fffbeb !important;
          border-color: #fef08a !important;
          color: #ca8a04 !important;
        }
        .badge-green {
          background-color: #ecfdf5 !important;
          border-color: #a7f3d0 !important;
          color: #059669 !important;
        }
        .print-body {
          font-size: 14px !important;
          line-height: 1.6 !important;
          color: #2c3e50 !important;
          white-space: pre-wrap !important;
        }
        .print-footer {
          border-top: 1px solid #e1e4e6 !important;
          margin-top: 40px !important;
          padding-top: 15px !important;
          font-size: 10px !important;
          color: #707070 !important;
          display: flex !important;
          justify-content: space-between !important;
        }
      }
    `
    
    document.head.appendChild(styleEl)
    
    // Determine urgency level and badge
    const responseText = (data.rawResponse || data.summary || '').toUpperCase()
    let urgencyClass = 'badge-green'
    let urgencyLabel = 'Normal / Good Status'
    if (responseText.includes('EMERGENCY') || responseText.includes('HIGH') || responseText.includes('DANGEROUS') || responseText.includes('SEVERE')) {
      urgencyClass = 'badge-red'
      urgencyLabel = 'High Urgency / Attention Required'
    } else if (responseText.includes('SEE_DOCTOR') || responseText.includes('MEDIUM') || responseText.includes('MODERATE')) {
      urgencyClass = 'badge-yellow'
      urgencyLabel = 'Medium Urgency / Monitor Closely'
    }
    
    // Format date
    const formattedDate = new Date(data.timestamp || Date.now()).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
    
    // Render HTML inside print container
    printDiv.innerHTML = `
      <div class="print-header">
        <div>
          <div class="print-title">✚ VisionDX Clinical AI</div>
          <div class="print-subtitle">Autonomous Diagnostic Triage Platform • Pakistan</div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #707070;">
          <div>Report Ref: VDX-${Math.floor(100000 + Math.random() * 900000)}</div>
          <div>Date: ${new Date().toLocaleDateString()}</div>
        </div>
      </div>
      
      <div class="patient-details-grid">
        <div>
          <div class="detail-label">Patient Name</div>
          <div class="detail-value">${escapeHTML(String(patientName))}</div>
        </div>
        <div>
          <div class="detail-label">Age / Gender</div>
          <div class="detail-value">${escapeHTML(String(patientAge))}y / ${escapeHTML(String(patientGender))}</div>
        </div>
        <div>
          <div class="detail-label">Diagnostic Module</div>
          <div class="detail-value" style="color: #00d4aa; text-transform: uppercase;">${escapeHTML(String(moduleName))}</div>
        </div>
      </div>
      
      <div class="print-badge ${urgencyClass}">
        Urgency Level: ${escapeHTML(String(urgencyLabel))}
      </div>
      
      <div style="font-size: 11px; color: #707070; margin-bottom: 10px;">Scanned on ${escapeHTML(String(formattedDate))}</div>
      
      <div class="print-body">${escapeHTML(String(data.rawResponse || data.summary || ''))}</div>
      
      <div class="print-footer">
        <div>Validated by: VisionDX Autonomous Triage Suite</div>
        <div>Disclaimer: For educational purposes only. Always consult a certified primary care doctor.</div>
      </div>
    `
    
    document.body.appendChild(printDiv)
    
    // Print
    window.print()
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(printDiv)
      document.head.removeChild(styleEl)
    }, 1000)
  }
  
  return { printReport }
}
