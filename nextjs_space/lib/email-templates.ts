/**
 * Generate HTML email template for RFP Executive Summary
 * @param rfpTitle - Title of the RFP
 * @param sections - Object containing all summary sections
 * @param templateName - Template type (Concise, Executive, or Detailed)
 * @returns HTML string for email
 */
export function generateSummaryEmailHtml(
  rfpTitle: string,
  sections: {
    overview: string;
    goals: string;
    dates: string;
    budget: string;
    risks: string;
  },
  templateName: 'Concise' | 'Executive' | 'Detailed' = 'Executive'
): string {
  // Format content based on template type
  const formattedSections = formatContentForEmail(sections, templateName);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fyndr Executive Summary</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #4f46e5; padding: 24px 0;">
    <tr>
      <td align="center">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
          Fyndr Executive Summary
        </h1>
        <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">
          RFP Management System
        </p>
      </td>
    </tr>
  </table>
  
  <!-- Content Card -->
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 700px; background-color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- RFP Title -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h2 style="margin: 0; font-size: 28px; font-weight: 700; color: #111827;">
                ${escapeHtml(rfpTitle)}
              </h2>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">
                Template: ${templateName}
              </p>
            </td>
          </tr>
          
          <!-- Section 1: High-Level Overview -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 24px; margin-right: 8px;">📊</span>
                <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">
                  High-Level Overview
                </h3>
              </div>
              <div style="color: #374151; font-size: 15px; line-height: 1.6;">
                ${formattedSections.overview}
              </div>
            </td>
          </tr>
          
          <!-- Section 2: Goals & Requirements -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 24px; margin-right: 8px;">🎯</span>
                <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">
                  Goals & Requirements
                </h3>
              </div>
              <div style="color: #374151; font-size: 15px; line-height: 1.6;">
                ${formattedSections.goals}
              </div>
            </td>
          </tr>
          
          <!-- Section 3: Key Dates & Deadlines -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 24px; margin-right: 8px;">📅</span>
                <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">
                  Key Dates & Deadlines
                </h3>
              </div>
              <div style="color: #374151; font-size: 15px; line-height: 1.6;">
                ${formattedSections.dates}
              </div>
            </td>
          </tr>
          
          <!-- Section 4: Budget & Constraints -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 24px; margin-right: 8px;">💰</span>
                <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">
                  Budget & Constraints
                </h3>
              </div>
              <div style="color: #374151; font-size: 15px; line-height: 1.6;">
                ${formattedSections.budget}
              </div>
            </td>
          </tr>
          
          <!-- Section 5: Risks & Considerations -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 24px; margin-right: 8px;">⚠️</span>
                <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">
                  Risks & Considerations
                </h3>
              </div>
              <div style="color: #374151; font-size: 15px; line-height: 1.6;">
                ${formattedSections.risks}
              </div>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
  
  <!-- Footer -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 24px 0;">
    <tr>
      <td align="center">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Generated by <strong style="color: #4f46e5;">Fyndr</strong>
        </p>
        <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
          RFP Management System
        </p>
      </td>
    </tr>
  </table>
  
</body>
</html>
  `.trim();
}

/**
 * Format content for email based on template type
 * Converts bullet points and paragraphs to proper HTML
 */
function formatContentForEmail(
  sections: {
    overview: string;
    goals: string;
    dates: string;
    budget: string;
    risks: string;
  },
  templateName: 'Concise' | 'Executive' | 'Detailed'
): {
  overview: string;
  goals: string;
  dates: string;
  budget: string;
  risks: string;
} {
  const formatText = (text: string): string => {
    // Escape HTML
    text = escapeHtml(text);
    
    // Check if content has bullet points
    if (text.includes('•')) {
      // Convert bullet points to HTML list
      const lines = text.split('\n').filter(line => line.trim());
      const listItems = lines
        .map(line => line.trim())
        .filter(line => line.startsWith('•'))
        .map(line => `<li style="margin-bottom: 8px;">${line.substring(1).trim()}</li>`)
        .join('');
      
      if (listItems) {
        return `<ul style="margin: 0; padding-left: 20px;">${listItems}</ul>`;
      }
    }
    
    // Convert paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    if (paragraphs.length > 1) {
      return paragraphs
        .map(p => `<p style="margin: 0 0 12px 0;">${p.trim()}</p>`)
        .join('');
    }
    
    // Single paragraph
    return `<p style="margin: 0;">${text}</p>`;
  };
  
  return {
    overview: formatText(sections.overview),
    goals: formatText(sections.goals),
    dates: formatText(sections.dates),
    budget: formatText(sections.budget),
    risks: formatText(sections.risks),
  };
}

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param text - Text to escape
 * @returns Escaped HTML string
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
