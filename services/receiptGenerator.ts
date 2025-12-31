/**
 * Receipt/Invoice Generator for DogStay
 * 
 * Generates PDF receipts for bookings
 * Works in browser using jsPDF
 */

import { Booking, AppSettings } from '../types';
import { calculateTotal, calculateDays, formatDate } from './mockBackend';

// Types for receipt
interface ReceiptData {
  booking: Booking;
  settings: AppSettings;
  receiptNumber?: string;
  paymentMethod?: string;
  notes?: string;
}

interface ReceiptLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Generate unique receipt number
const generateReceiptNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `DS-${year}${month}${day}-${random}`;
};

// Calculate receipt lines from booking
const getReceiptLines = (booking: Booking): ReceiptLine[] => {
  const lines: ReceiptLine[] = [];
  const days = calculateDays(booking.checkIn, booking.checkOut);

  // Main accommodation line
  lines.push({
    description: `Проживание (${booking.dogName}, ${booking.breed})`,
    quantity: days,
    unitPrice: booking.pricePerDay,
    total: days * booking.pricePerDay
  });

  // Additional expenses
  if (booking.expenses && booking.expenses.length > 0) {
    booking.expenses.forEach(expense => {
      lines.push({
        description: expense.title,
        quantity: 1,
        unitPrice: expense.amount,
        total: expense.amount
      });
    });
  }

  // Legacy fields
  if (booking.diaperCost && booking.diaperCost > 0) {
    lines.push({
      description: 'Пелёнки/Памперсы',
      quantity: 1,
      unitPrice: booking.diaperCost,
      total: booking.diaperCost
    });
  }

  if (booking.damageCost && booking.damageCost > 0) {
    lines.push({
      description: 'Ущерб/Штраф',
      quantity: 1,
      unitPrice: booking.damageCost,
      total: booking.damageCost
    });
  }

  return lines;
};

/**
 * Generate receipt as HTML string (for preview/print)
 */
export const generateReceiptHTML = (data: ReceiptData): string => {
  const { booking, settings, paymentMethod = 'Наличные', notes } = data;
  const receiptNumber = data.receiptNumber || generateReceiptNumber();
  const lines = getReceiptLines(booking);
  const total = calculateTotal(booking);
  const today = new Date().toLocaleDateString('ru-RU');

  const linesHTML = lines.map(line => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${line.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${line.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${line.unitPrice.toLocaleString()} ₽</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${line.total.toLocaleString()} ₽</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Чек №${receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .receipt {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
      padding: 32px;
      text-align: center;
    }
    .header h1 { font-size: 24px; margin-bottom: 4px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .content { padding: 32px; }
    .meta { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f5f5f5;
    }
    .meta-item { }
    .meta-label { font-size: 12px; color: #888; text-transform: uppercase; }
    .meta-value { font-size: 16px; font-weight: 600; color: #333; }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .info-box {
      background: #f9fafb;
      padding: 16px;
      border-radius: 12px;
    }
    .info-box label { font-size: 12px; color: #888; display: block; margin-bottom: 4px; }
    .info-box span { font-size: 15px; font-weight: 500; color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th { 
      text-align: left; 
      padding: 12px 8px; 
      background: #f9fafb; 
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
    }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
    .total-row {
      background: #f97316;
      color: white;
      padding: 16px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
    }
    .total-label { font-size: 18px; font-weight: 500; }
    .total-value { font-size: 28px; font-weight: 700; }
    .footer {
      text-align: center;
      padding: 24px;
      background: #f9fafb;
      font-size: 13px;
      color: #888;
    }
    .notes {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 8px;
      padding: 12px;
      margin-top: 16px;
      font-size: 14px;
      color: #92400e;
    }
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${settings.hotelName || 'DogStay Hotel'}</h1>
      <p>Гостиница для собак</p>
    </div>
    
    <div class="content">
      <div class="meta">
        <div class="meta-item">
          <div class="meta-label">Чек №</div>
          <div class="meta-value">${receiptNumber}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Дата</div>
          <div class="meta-value">${today}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Оплата</div>
          <div class="meta-value">${paymentMethod}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <label>Питомец</label>
          <span>${booking.dogName}</span>
        </div>
        <div class="info-box">
          <label>Порода</label>
          <span>${booking.breed}</span>
        </div>
        <div class="info-box">
          <label>Заезд</label>
          <span>${formatDate(booking.checkIn)}</span>
        </div>
        <div class="info-box">
          <label>Выезд</label>
          <span>${formatDate(booking.checkOut)}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Услуга</th>
            <th style="text-align: center;">Кол-во</th>
            <th style="text-align: right;">Цена</th>
            <th style="text-align: right;">Сумма</th>
          </tr>
        </thead>
        <tbody>
          ${linesHTML}
        </tbody>
      </table>

      <div class="total-row">
        <span class="total-label">Итого к оплате:</span>
        <span class="total-value">${total.toLocaleString()} ₽</span>
      </div>

      ${notes ? `<div class="notes"><strong>Примечание:</strong> ${notes}</div>` : ''}
    </div>

    <div class="footer">
      <p>Спасибо, что выбрали ${settings.hotelName || 'нас'}!</p>
      <p style="margin-top: 8px;">Ждём вас снова 🐕</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Open receipt in new window for printing
 */
export const printReceipt = (data: ReceiptData): void => {
  const html = generateReceiptHTML(data);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Auto-print after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
};

/**
 * Download receipt as HTML file
 */
export const downloadReceiptHTML = (data: ReceiptData): void => {
  const html = generateReceiptHTML(data);
  const receiptNumber = data.receiptNumber || generateReceiptNumber();
  
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt-${receiptNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Generate receipt as PDF using browser print
 * This opens the receipt in a new tab where user can "Print to PDF"
 */
export const downloadReceiptPDF = (data: ReceiptData): void => {
  // For now, use the print method which allows "Save as PDF"
  printReceipt(data);
};

/**
 * Share receipt via Web Share API (mobile)
 */
export const shareReceipt = async (data: ReceiptData): Promise<boolean> => {
  if (!('share' in navigator)) {
    console.warn('Web Share API not supported');
    return false;
  }

  const { booking, settings } = data;
  const total = calculateTotal(booking);
  const receiptNumber = data.receiptNumber || generateReceiptNumber();

  try {
    await navigator.share({
      title: `Чек ${receiptNumber}`,
      text: `
${settings.hotelName || 'DogStay Hotel'}
Чек №${receiptNumber}

Питомец: ${booking.dogName}
Заезд: ${formatDate(booking.checkIn)}
Выезд: ${formatDate(booking.checkOut)}

Итого: ${total.toLocaleString()} ₽

Спасибо, что выбрали нас!
      `.trim()
    });
    return true;
  } catch (err) {
    console.error('Share failed:', err);
    return false;
  }
};

export default {
  generateReceiptHTML,
  printReceipt,
  downloadReceiptHTML,
  downloadReceiptPDF,
  shareReceipt,
  generateReceiptNumber
};
