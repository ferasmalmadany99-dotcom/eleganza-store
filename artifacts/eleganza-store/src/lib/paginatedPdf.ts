import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type PaginatedPdfOptions = {
  pages: string[];
  fileName: string;
  direction: "ltr" | "rtl";
  backgroundColor?: string;
};

export async function downloadPaginatedPdf({ pages, fileName, direction, backgroundColor = "#fffaf3" }: PaginatedPdfOptions) {
  const renderRoot = document.createElement("div");
  renderRoot.style.cssText = "position:fixed;left:-100000px;top:0;width:794px;height:1123px;pointer-events:none;overflow:hidden;";
  document.body.appendChild(renderRoot);

  try {
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const fontFamily = direction === "rtl" ? "'Noto Naskh Arabic','Noto Kufi Arabic','Arial',sans-serif" : "Arial,sans-serif";

    for (const [index, pageMarkup] of pages.entries()) {
      const page = document.createElement("div");
      page.dir = direction;
      page.innerHTML = pageMarkup;
      page.style.cssText = `box-sizing:border-box;width:794px;height:1123px;overflow:hidden;background:${backgroundColor};color:#312b25;font-family:${fontFamily};direction:${direction};unicode-bidi:isolate;`;
      renderRoot.appendChild(page);
      await document.fonts?.ready;
      const canvas = await html2canvas(page, { scale: 2, backgroundColor, useCORS: true });
      if (index > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageWidth, pageHeight);
      page.remove();
    }

    pdf.save(fileName);
  } finally {
    renderRoot.remove();
  }
}