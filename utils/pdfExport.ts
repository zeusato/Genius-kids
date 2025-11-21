
import { jsPDF } from "jspdf";
import { Question } from "../types";

// Helper to extract SVG dimensions
const getSvgDimensions = (svgString: string): { width: number, height: number } => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');

  if (!svg) return { width: 200, height: 200 };

  // Try to get width/height from attributes
  const widthAttr = svg.getAttribute('width');
  const heightAttr = svg.getAttribute('height');

  if (widthAttr && heightAttr) {
    return {
      width: parseFloat(widthAttr),
      height: parseFloat(heightAttr)
    };
  }

  // Try to get from viewBox
  const viewBox = svg.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.split(/\s+|,/);
    if (parts.length === 4) {
      return {
        width: parseFloat(parts[2]),
        height: parseFloat(parts[3])
      };
    }
  }

  return { width: 200, height: 200 };
};

// Helper function to convert SVG string to PNG data URL with proper aspect ratio
const svgToPngDataUrl = async (svgString: string): Promise<{ dataUrl: string, width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    const dimensions = getSvgDimensions(svgString);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Use original SVG dimensions for canvas
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
      const dataUrl = canvas.toDataURL('image/png');
      URL.revokeObjectURL(url);
      resolve({ dataUrl, width: dimensions.width, height: dimensions.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };

    img.src = url;
  });
};

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

  // Pre-convert all SVGs to images with their dimensions
  const svgImages: ({ dataUrl: string, width: number, height: number } | null)[] = await Promise.all(
    questions.map(async (q) => {
      if (q.visualSvg) {
        try {
          return await svgToPngDataUrl(q.visualSvg);
        } catch (error) {
          console.error('Failed to convert SVG:', error);
          return null;
        }
      }
      return null;
    })
  );

  for (let index = 0; index < questions.length; index++) {
    const q = questions[index];
    const svgImage = svgImages[index];

    const qTitle = `Câu ${index + 1}: ${q.questionText}`;
    const titleLines = doc.splitTextToSize(qTitle, colWidth);

    // Calculate height needed for this question block
    const lineHeight = 5;

    // Calculate SVG height in PDF (mm) while maintaining aspect ratio
    let svgHeightInPdf = 0;
    let svgWidthInPdf = 0;
    if (svgImage) {
      const maxWidthInPdf = colWidth * 0.9; // Max width for image
      const aspectRatio = svgImage.height / svgImage.width;
      svgWidthInPdf = maxWidthInPdf;
      svgHeightInPdf = maxWidthInPdf * aspectRatio;

      // Cap height if too tall
      const maxHeightInPdf = 50;
      if (svgHeightInPdf > maxHeightInPdf) {
        svgHeightInPdf = maxHeightInPdf;
        svgWidthInPdf = maxHeightInPdf / aspectRatio;
      }
    }

    const optionsHeight = q.options ? q.options.length * 5 : 12;
    const blockHeight = (titleLines.length * lineHeight) + svgHeightInPdf + optionsHeight + 4;

    // Check if we need to switch column or page
    if (y + blockHeight > maxY) {
      if (currentColumn === 0) {
        // Switch to right column
        currentColumn = 1;
        y = isFirstPage ? startY_Page1 : startY_PageN;
      } else {
        // Add new page and reset to left column
        doc.addPage();
        isFirstPage = false;
        currentColumn = 0;
        y = startY_PageN;
      }
    }

    // Draw Question Text
    const x = getX(currentColumn);
    doc.text(titleLines, x, y);
    y += titleLines.length * lineHeight;

    // Draw SVG Image if exists with proper aspect ratio
    if (svgImage) {
      try {
        // Center the image if it's narrower than column width
        const imageX = x + (colWidth * 0.9 - svgWidthInPdf) / 2;
        doc.addImage(svgImage.dataUrl, 'PNG', imageX, y, svgWidthInPdf, svgHeightInPdf);
        y += svgHeightInPdf + 3; // Move down after image with small gap
      } catch (error) {
        console.error('Failed to add image to PDF:', error);
      }
    }

    // Draw Options or Blank space
    if (q.options) {
      q.options.forEach((opt, i) => {
        const label = String.fromCharCode(65 + i); // A, B, C, D
        const optText = `${label}. ${opt}`;
        const optLines = doc.splitTextToSize(optText, colWidth - 5);
        doc.text(optLines, x + 3, y);
        y += optLines.length * 5;
      });
    } else {
      doc.text("Trả lời: ..............................................", x + 3, y);
      y += 12;
    }

    y += 6; // Spacing between questions
  }

  doc.save("Bai_tap_toan.pdf");
};
