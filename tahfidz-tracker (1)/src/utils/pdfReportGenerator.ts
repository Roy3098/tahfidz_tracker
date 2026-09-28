import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Santri } from '../types';
import { parseHafalan } from './hafalanFormat';

export interface GeneratePdfOptions {
  santriList: Santri[];
  institutionName?: string;
  reportTitle?: string;
  monthName?: string;
  year?: number;
  filterLabel?: string;
  teacherName?: string;
}

export const generateMonthlyHafalanPdf = (options: GeneratePdfOptions): jsPDF => {
  const {
    santriList,
    institutionName = 'PROGRAM TAHFIDZ AL-QUR\'AN',
    reportTitle = 'LAPORAN REKAPITULASI HAFALAN SANTRI',
    monthName = new Date().toLocaleDateString('id-ID', { month: 'long' }),
    year = new Date().getFullYear(),
    filterLabel = 'Semua Santri',
    teacherName = 'Ustadz Pembina'
  } = options;

  // Initialize jsPDF (A4 Portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Calculate summary metrics
  const totalSantri = santriList.length;
  const totalJuz = santriList.reduce((acc, s) => acc + (s.totalJuzMemorized || 0), 0);
  const avgJuz = totalSantri > 0 ? (totalJuz / totalSantri).toFixed(2) : '0';
  const totalTargetJuz = santriList.reduce((acc, s) => acc + (s.targetJuz || 1), 0);
  const achievedTargetCount = santriList.filter(s => {
    const target = s.targetJuz || 1;
    return (s.totalJuzMemorized || 0) >= target;
  }).length;
  const totalProgressPercent = totalTargetJuz > 0 ? Math.min(100, Math.round((totalJuz / totalTargetJuz) * 100)) : 0;

  // Header Section (Dark Emerald accent)
  doc.setFillColor(16, 120, 85); // Emerald-700
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Institution title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(institutionName.toUpperCase(), pageWidth / 2, 11, { align: 'center' });

  // Report title
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(reportTitle.toUpperCase(), pageWidth / 2, 17, { align: 'center' });

  // Subtitle / Period
  doc.setFontSize(9);
  doc.setTextColor(220, 252, 231); // Light emerald
  doc.text(`Periode: ${monthName} ${year}  |  Filter: ${filterLabel}  |  Dicetak: ${currentDateFormatted}`, pageWidth / 2, 23, { align: 'center' });

  // Reset text color
  doc.setTextColor(30, 41, 59);

  // Summary Metrics Box
  let currentY = 34;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 18, 2, 2, 'FD');

  const colWidth = (pageWidth - 28) / 4;
  const statItems = [
    { label: 'Total Santri', val: `${totalSantri} Santri` },
    { label: 'Total Capaian', val: `${totalJuz.toFixed(1)} Juz` },
    { label: 'Rata-Rata Capaian', val: `${avgJuz} Juz / Santri` },
    { label: 'Capaian Target', val: `${achievedTargetCount}/${totalSantri} (${totalProgressPercent}%)` }
  ];

  statItems.forEach((item, index) => {
    const xPos = 14 + (index * colWidth) + (colWidth / 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, xPos, currentY + 6, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(item.val, xPos, currentY + 13, { align: 'center' });
  });

  currentY += 24;

  // Table Data Preparation
  const tableRows = santriList.map((student, index) => {
    const breakdown = parseHafalan(student.totalJuzMemorized);
    const target = student.targetJuz || 1;
    const percent = Math.min(100, Math.round((breakdown.decimalJuz / target) * 100));
    
    let lastSetorInfo = '-';
    if (student.terakhirSetor) {
      lastSetorInfo = `${student.terakhirSetor.surah} (${student.terakhirSetor.ayat || 'Ayat Lengkap'})`;
    } else if (student.hafalanList && student.hafalanList.length > 0) {
      const last = student.hafalanList[student.hafalanList.length - 1];
      lastSetorInfo = `${last.surahName}${last.ayatMulai ? ` (${last.ayatMulai}-${last.ayatSelesai})` : ''}`;
    }

    return [
      (index + 1).toString(),
      student.nama,
      student.kelompokNama || '-',
      student.gender === 'santriwan' ? 'Ikhwan' : 'Akhwat',
      `${target} Juz`,
      `${breakdown.decimalText} Juz`,
      `${breakdown.lembar} Lbr (${breakdown.halaman} Hal)`,
      `${percent}%`,
      lastSetorInfo
    ];
  });

  // Render Table with autoTable
  autoTable(doc, {
    startY: currentY,
    head: [[
      'No',
      'Nama Santri',
      'Halaqah',
      'Gender',
      'Target',
      'Capaian',
      'Rincian',
      'Progres',
      'Setoran Terakhir'
    ]],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [16, 120, 85], // Emerald-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 38 },
      2: { cellWidth: 26 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 24 },
      7: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
      8: { cellWidth: 28, fontSize: 7.5 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer page numbers
      const str = `Halaman ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      doc.text('Dokumen Resmi Laporan Bulanan Tahfidz Al-Qur\'an', 14, doc.internal.pageSize.getHeight() - 10);
    }
  });

  // Signature Block at end of document
  let finalY = (doc as any).lastAutoTable?.finalY || currentY + 80;
  
  // If remaining space on current page is too small (< 40mm), add a new page
  if (finalY + 45 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    finalY = 25;
  } else {
    finalY += 12;
  }

  const signColWidth = (pageWidth - 28) / 2;
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  // Left signature (Koordinator / Kepala)
  doc.text('Mengetahui,', 14 + (signColWidth / 2), finalY, { align: 'center' });
  doc.text('Kepala / Koordinator Tahfidz', 14 + (signColWidth / 2), finalY + 5, { align: 'center' });
  
  doc.setDrawColor(148, 163, 184);
  doc.line(14 + (signColWidth / 2) - 30, finalY + 28, 14 + (signColWidth / 2) + 30, finalY + 28);
  doc.setFont('helvetica', 'bold');
  doc.text('( ........................................... )', 14 + (signColWidth / 2), finalY + 33, { align: 'center' });

  // Right signature (Pengajar Halaqah)
  const rightX = 14 + signColWidth + (signColWidth / 2);
  doc.setFont('helvetica', 'normal');
  doc.text(`${filterLabel.includes('Halaqah') ? filterLabel : 'Halaqah Tahfidz'}, ${currentDateFormatted}`, rightX, finalY, { align: 'center' });
  doc.text('Pengajar / Musyrif Halaqah', rightX, finalY + 5, { align: 'center' });

  doc.line(rightX - 30, finalY + 28, rightX + 30, finalY + 28);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${teacherName} )`, rightX, finalY + 33, { align: 'center' });

  return doc;
};
