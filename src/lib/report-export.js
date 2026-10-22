"use client";

function fileName(report, ext) {
    const base = `${report.title} ${report.from} to ${report.to}`.replace(/[^\w\- ]+/g, "").replace(/\s+/g, "_");
    return `${base}.${ext}`;
}

function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}

export async function exportExcel(report) {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    wb.created = new Date();

    // Summary sheet
    const summary = wb.addWorksheet("Summary");
    summary.addRow([report.title]).font = { bold: true, size: 14 };
    if (report.subtitle) summary.addRow([report.subtitle]);
    summary.addRow([`Period: ${report.from} to ${report.to}`]);
    summary.addRow([]);
    for (const s of report.summary) summary.addRow([s.label, s.value]);
    summary.getColumn(1).width = 28;
    summary.getColumn(2).width = 16;

    // One sheet per table (Excel sheet names: max 31 chars, unique)
    const used = new Set(["Summary"]);
    for (const table of report.tables) {
        let name = table.title.replace(/[\\/*?:[\]]/g, "").slice(0, 31) || "Sheet";
        while (used.has(name)) name = `${name.slice(0, 28)}_${used.size}`;
        used.add(name);

        const ws = wb.addWorksheet(name);
        ws.columns = table.columns.map((c) => ({ header: c.label, key: c.key, width: Math.max(12, c.label.length + 4) }));
        ws.getRow(1).font = { bold: true };
        ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2FF" } };
        table.rows.forEach((r) => ws.addRow(r));
        ws.columns.forEach((col) => {
            let max = col.width;
            col.eachCell({ includeEmpty: false }, (cell) => {
                max = Math.max(max, Math.min(60, String(cell.value ?? "").length + 2));
            });
            col.width = max;
        });
        ws.views = [{ state: "frozen", ySplit: 1 }];
    }

    const buffer = await wb.xlsx.writeBuffer();
    download(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileName(report, "xlsx"));
}

export async function exportPDF(report) {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text(report.title, 40, 40);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text([report.subtitle, `Period: ${report.from} to ${report.to}`].filter(Boolean).join("   ·   "), 40, 58);
    doc.setTextColor(0);

    autoTable(doc, {
        startY: 72,
        head: [["Metric", "Value"]],
        body: report.summary.map((s) => [s.label, String(s.value)]),
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229] },
        tableWidth: 300,
    });

    for (const table of report.tables) {
        const y = doc.lastAutoTable.finalY + 28;
        doc.setFontSize(12);
        doc.text(table.title, 40, y);
        autoTable(doc, {
            startY: y + 8,
            head: [table.columns.map((c) => c.label)],
            body: table.rows.length
                ? table.rows.map((r) => table.columns.map((c) => String(r[c.key] ?? "")))
                : [[{ content: "No data", colSpan: table.columns.length }]],
            theme: "striped",
            styles: { fontSize: 8, cellPadding: 4 },
            headStyles: { fillColor: [79, 70, 229] },
        });
    }

    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated ${new Date().toLocaleString("en-IN")}  ·  Page ${i} of ${pages}`, 40, doc.internal.pageSize.getHeight() - 20);
    }

    doc.save(fileName(report, "pdf"));
}