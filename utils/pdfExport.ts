
import { jsPDF } from "jspdf";
import { Question } from "../types";

export const exportTestToPDF = async (questions: Question[], title: string) => {
  const doc = new jsPDF();
  
  try {
    // Load Roboto-Regular from CDN to support Vietnamese characters
    const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
    const response = await fetch(fontUrl);
    if (!response.ok) throw new Error("Failed to fetch font");
    
    const buffer = await response.arrayBuffer();
    
    // Convert ArrayBuffer to Base64 manually
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Font = btoa(binary);

    doc.addFileToVFS('Roboto-Regular.ttf', base64Font);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
  } catch (error) {
    console.error("Lỗi tải font tiếng Việt:", error);
    alert("Không thể tải font tiếng Việt. File PDF có thể bị lỗi hiển thị ký tự.");
  }
  
  // --- Header ---
  doc.setFontSize(18);
  doc.text(title, 105, 20, { align: "center" });
  
  doc.setFontSize(11);
  doc.text(`Tổng số câu hỏi: ${questions.length} câu - Thời gian: ${questions.length} phút`, 105, 28, { align: "center" });
  doc.text("Họ và tên: .......................................................................... Lớp: ...........", 105, 36, { align: "center" });
  
  doc.line(20, 40, 190, 40); // Separator line

  // --- 2-Column Layout Config ---
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const gutter = 10; // Gap between columns
  const colWidth = (pageWidth - (margin * 2) - gutter) / 2;
  
  let currentColumn = 0; // 0 = Left, 1 = Right
  
  const startY_Page1 = 50;
  const startY_PageN = margin; // Top margin for subsequent pages
  const maxY = pageHeight - margin;
  
  let y = startY_Page1; // Start Y position
  let isFirstPage = true;

  doc.setFontSize(10); // Smaller font to fit more

  const getX = (col: number) => margin + (col * (colWidth + gutter));

  questions.forEach((q, index) => {
    const qTitle = `Câu ${index + 1}: ${q.questionText}`;
    const titleLines = doc.splitTextToSize(qTitle, colWidth);
    
    // Calculate height needed for this question block
    // Line height ~5mm roughly for font size 10 with padding
    const lineHeight = 5; 
    const optionsHeight = q.options ? q.options.length * 5 : 12; // 5mm per option or 12mm for manual entry
    // Add extra space if there is a visual svg description (though we don't print the SVG, the text might be longer)
    const blockHeight = (titleLines.length * lineHeight) + optionsHeight + 4; // +4 for spacing after question

    // Check if we need to switch column or page
    if (y + blockHeight > maxY) {
      if (currentColumn === 0) {
        // Switch to right column
        currentColumn = 1;
        // FIX: If it's the first page, align with header offset. If it's later pages, align with top margin.
        y = isFirstPage ? startY_Page1 : startY_PageN;
      } else {
        // Add new page and reset to left column
        doc.addPage();
        isFirstPage = false;
        currentColumn = 0;
        y = startY_PageN; // Reset to top margin on new page (no header)
      }
    }

    // Draw Question Text
    const x = getX(currentColumn);
    doc.text(titleLines, x, y);
    y += titleLines.length * lineHeight;

    // Draw Options or Blank space
    if (q.options) {
      q.options.forEach((opt, i) => {
        const label = String.fromCharCode(65 + i); // A, B, C, D
        // Check if option text is too long
        const optText = `${label}. ${opt}`;
        const optLines = doc.splitTextToSize(optText, colWidth - 5); // Indent slightly
        doc.text(optLines, x + 3, y);
        y += optLines.length * 5;
      });
    } else {
      doc.text("Trả lời: ..............................................", x + 3, y);
      y += 12;
    }

    y += 6; // Spacing between questions
  });
  
  doc.save("Bai_tap_toan.pdf");
};
