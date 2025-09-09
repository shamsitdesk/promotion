import {
  Component,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import * as XLSX from 'xlsx';
import JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-barcode-label',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <div class="container">
    <h2>📦 Barcode Label Generator</h2>

    <div class="form-row">
      <label>
        <span>📁 Upload Excel (.xlsx/.xls)</span>
        <input type="file" accept=".xlsx,.xls" (change)="onFileChange($event)" />
      </label>

      <label class="select-all">
        <input type="checkbox" [(ngModel)]="selectAll" (change)="toggleSelectAll()" />
        click to view
      </label>

      <button type="button" (click)="printSelectedRows()">🖨️ Print Selected</button>
    </div>

    <div *ngIf="excelData.length; else noData">
      <table>
        <thead>
          <tr>
            <th>
              <input type="checkbox" [(ngModel)]="selectAll" (change)="toggleSelectAll()" />
            </th>
            <th *ngFor="let header of excelHeaders">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of excelData">
            <td><input type="checkbox" [(ngModel)]="row.selected" /></td>
            <td *ngFor="let header of excelHeaders">{{ row[header] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ng-template #noData>
      <p class="no-data">📤 Upload an Excel file to preview and select rows for printing.</p>
    </ng-template>
  </div>
  `,

  styles: [`
  .container { max-width: 1000px; margin: 30px auto; padding: 24px; border-radius: 12px; background: #f9f9f9; box-shadow: 0 0 10px rgba(0,0,0,0.05); font-family: 'Segoe UI', sans-serif; }
  h2 { text-align: center; color: #2c3e50; margin-bottom: 24px; }
  .form-row { display: flex; flex-wrap: wrap; gap: 20px; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  label { display: flex; flex-direction: column; font-weight: 500; color: #333; font-size: 14px; }
  input[type="text"], input[type="file"] { margin-top: 6px; padding: 8px; border-radius: 6px; border: 1px solid #ccc; min-width: 220px; }
  input[type="checkbox"] { margin-right: 6px; transform: scale(1.1); }
  button { background-color: #007bff; color: #fff; padding: 10px 18px; font-size: 15px; border: none; border-radius: 6px; cursor: pointer; transition: background-color 0.2s ease; }
  button:hover { background-color: #0056b3; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
  th { background-color: #007bff; color: white; font-weight: 600; }
  tr:nth-child(even) { background-color: #f2f2f2; }
  .select-all { display: flex; align-items: center; font-size: 14px; font-weight: 500; color: #444; }
  .no-data { text-align: center; color: #666; font-style: italic; margin-top: 30px; }
  `]
})
export class BarcodeLabelComponent implements AfterViewInit {
  selectAll: boolean = false;
  excelData: any[] = [];
  excelHeaders: string[] = [];

  ngAfterViewInit(): void {

  }
  ngOnInit(): void {
  }

  onFileChange(event: any): void {
    const target: DataTransfer = <DataTransfer>event.target;
    if (target.files.length !== 1) return;

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

      this.excelData = data.map((row: any) => {
        const start = row['start date'];
        const end = row['end date'];

        const formatDate = (val: any) => {
          if (!val) return '';
          if (val instanceof Date) return this.formatDate(val);
          if (typeof val === 'string') return val;
          // Excel serial number
          return this.formatDate(XLSX.SSF.parse_date_code(val));
        };

        return {
          ...row,
          'start date': formatDate(start),
          'end date': formatDate(end),
          selected: false
        };
      });

      this.excelHeaders = Object.keys(data[0] || {});
      this.selectAll = false;
    };
    reader.readAsBinaryString(target.files[0]);

  }

  private formatDate(dateObj: any): string {
    if (!dateObj) return '';
    if (typeof dateObj === 'object' && 'y' in dateObj) {
      const day = String(dateObj.d).padStart(2, '0');
      const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dateObj.m - 1];
      return `${day}-${month}`;
    }
    if (dateObj instanceof Date) {
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dateObj.getMonth()];
      return `${day}-${month}`;
    }
    return String(dateObj);
  }

  toggleSelectAll(): void {
    this.excelData.forEach(row => row.selected = this.selectAll);
  }

  private generateBarcodeBase64(value: string): string {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, value, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 12,
        width: 1.5,
        height: 50,
        margin: 0,
      });
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Barcode generation error:', e);
      return '';
    }
  }
printSelectedRows(): void {
  const selectedRows = this.excelData.filter(row => row.selected);
  if (!selectedRows.length) return;

  const style = `
    <style>
      @font-face {
        font-family: 'GE SS Two Medium';
        src: url('${window.location.origin}/assets/fonts/GE-SS-Two-Medium.woff2') format('woff2');
        font-weight: 700;
        font-style: normal;
      }
      @font-face {
        font-family: 'Bebas Neue';
        src: url('${window.location.origin}/assets/fonts/BebasNeue-Bold.woff2') format('woff2');
        font-weight: 700;
        font-style: normal;
      }

      @page { size: 7cm 13.5cm; margin: 0; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        font-family: 'Bebas Neue', Arial, sans-serif;
        font-weight: 700;
      }

      .page {
        width: 7cm;
        height: 13.5cm;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        page-break-after: always;
        position: relative;
      }

      .label {
        width: 7cm;
        height: 7.5cm;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        padding: 0.2cm 0.3cm 0.3cm 0.3cm;
        background: white;
        position: relative;
      }

      .price-line {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 0.1cm;
        width: 100%;
      }

      /* Actual price (above discounted price, left-aligned) */
      .original-price-container {
        display: flex;
        align-items: flex-end;
        justify-content: flex-start; /* left side */
        color: #000000ff;
        text-decoration: line-through;
        font-weight: 700;
        margin-bottom: 0.25cm; /* move slightly down */
        width: 100%;
      }
      .original-price-riyal { font-size: 24px; font-weight: 700; }
      .original-price-halala { font-size: 18px; font-weight: 700; }
      .original-halala-container { top: -2px; } /* slightly adjust vertical alignment */
      .original-price-symbol { font-size: 14px; font-weight: 700; }

      /* Discounted price centered */
      .discount-price {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        font-weight: 700;
        color: #000000ff;
        font-size: 60px;
        margin-bottom: 0.2cm;
      }
      .price-riyal { font-size: 60px; font-weight: 700; }
      .halala-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-left: 2px;
        position: relative;
        top: -10px;
      }
      .price-symbol { font-size: 16px; font-weight: 700; margin-bottom: 0; }
      .price-halala { font-size: 22px; font-weight: 700; }

      /* Date */
      .date-line {
        font-family: 'Bebas Neue', Arial, sans-serif;
        font-size: 13px;
        color: #000000ff;
        position: absolute;
        right: 0.2cm;
        bottom: 1cm;
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        text-align: center;
        font-weight: 700;
      }

      /* Barcode below price */
      .barcode {
        width: 6.5cm;
        height: 1.2cm;
        margin-top: 0.1cm;
      }
      .barcode svg {
        width: 100%;
        height: 100%;
      }

      .product { font-family: 'Bebas Neue', Arial, sans-serif; font-weight: 700; font-size: 18px; text-align: center; margin-top: 0.1cm; margin-bottom: 0.05cm; }
      .product-arabic { font-family: 'GE SS Two Medium', Arial, sans-serif; font-weight: 700; font-size: 17px; direction: rtl; text-align: center; margin-top: 0.05cm; margin-bottom: 0.05cm; }
    </style>
  `;

  const labels = selectedRows.map(row => {
    const code = String(row['item code'] ?? '');
    const startDate = row['start date'] ?? '';
    const endDate = row['end date'] ?? '';

    const discount = parseFloat(row['discount price']).toFixed(2).split(".");
    const riyal = discount[0];
    const halala = discount[1];

    const actual = parseFloat(row['price']).toFixed(2).split(".");
    const actualRiyal = actual[0];
    const actualHalala = actual[1];

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svg, code, {
      format: "CODE128",
      displayValue: true,
      fontSize: 14,
      width: 2,
      height: 60,
      margin: 0
    });
    const barcodeSVG = svg.outerHTML;

    return `
      <div class="page">
        <div class="label">
          <div class="price-line">
            <!-- Actual price (left-aligned above discounted) -->
            <div class="original-price-container">
              <span class="original-price-riyal">${actualRiyal}</span>
              <div class="original-halala-container">
                <span class="original-price-symbol">ريال</span>
                <span class="original-price-halala">${actualHalala}</span>
              </div>
            </div>

            <!-- Discounted price (centered) -->
            <div class="discount-price">
              <span class="price-riyal">${riyal}</span>
              <div class="halala-container">
                <span class="price-symbol">ريال</span>
                <span class="price-halala">${halala}</span>
              </div>
            </div>

            <!-- Barcode below -->
            <div class="barcode">${barcodeSVG}</div>
          </div>

          <div class="product-arabic">${row['arabic name']}</div>
          <div class="product">${row['item name']}</div>
          <div class="date-line">${startDate} - ${endDate}</div>
        </div>
      </div>
    `;
  }).join('');

  const html = `<html><head><meta charset="utf-8" />${style}</head><body>${labels}</body></html>`;

  const printWin = window.open('', '_blank');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();

    if (printWin.document.fonts && printWin.document.fonts.status !== 'loaded') {
      printWin.document.fonts.ready.then(() => {
        printWin.focus();
        printWin.print();
        printWin.close();
      }).catch(() => {
        console.warn('Font loading failed. Printing anyway.');
        printWin.focus();
        printWin.print();
        printWin.close();
      });
    } else {
      printWin.focus();
      printWin.print();
      printWin.close();
    }
  }
}





}
