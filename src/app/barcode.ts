import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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

      <button type="button" (click)="printSelectedRows()" [disabled]="!excelData.length">
        🖨️ Print Selected
      </button>
    </div>

    <div *ngIf="excelData.length; else noData" class="table-container">
      <table>
        <thead>
          <tr>
            <th>
              <input type="checkbox" [(ngModel)]="selectAll" (change)="toggleSelectAll()" />
            </th>
            <th>#</th>
            <th *ngFor="let header of excelHeaders">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of pagedData; let i = index">
            <td><input type="checkbox" [(ngModel)]="row.selected" /></td>
            <td>{{ (currentPage - 1) * pageSize + i + 1 }}</td>
            <td *ngFor="let header of excelHeaders">{{ row[header] }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination controls -->
      <div class="pagination">
        <button (click)="prevPage()" [disabled]="currentPage === 1">⬅ Prev</button>
        <span>Page {{ currentPage }} / {{ totalPages }}</span>
        <button (click)="nextPage()" [disabled]="currentPage === totalPages">Next ➡</button>

        <span class="rows-label">Rows per page:</span>
        <select (change)="changePageSize($event)" [value]="pageSize">
          <option [value]="5">5</option>
          <option [value]="10">10</option>
          <option [value]="20">20</option>
          <option [value]="50">50</option>
        </select>
      </div>
    </div>

    <ng-template #noData>
      <p class="no-data">📤 Upload an Excel file to preview and select rows for printing.</p>
    </ng-template>
  </div>
  `,

  styles: [`
  .container { max-width: 1200px; margin: 30px auto; padding: 24px; border-radius: 12px;
    background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.08); font-family: 'Segoe UI', sans-serif; }
  h2 { text-align: center; color: #2c3e50; margin-bottom: 20px; font-size: 24px; }
  .form-row { display: flex; flex-wrap: wrap; gap: 20px; align-items: center;
    justify-content: space-between; margin-bottom: 20px; }
  label { display: flex; flex-direction: column; font-weight: 500; color: #333; font-size: 14px; }
  input[type="file"] { margin-top: 6px; padding: 8px; border-radius: 6px; border: 1px solid #ccc; min-width: 220px; }
  input[type="checkbox"] { transform: scale(1.1); cursor: pointer; }
  button { background-color: #007bff; color: #fff; padding: 10px 18px; font-size: 15px;
    border: none; border-radius: 6px; cursor: pointer; transition: background-color 0.2s ease; }
  button:disabled { background-color: #b5d3f6; cursor: not-allowed; }
  button:hover:enabled { background-color: #0056b3; }
  .table-container { overflow-x: auto; margin-top: 15px; border: 1px solid #ddd;
    border-radius: 8px; max-height: 400px; overflow-y: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { border: 1px solid #eee; padding: 10px 12px; text-align: left; }
  th { background-color: #007bff; color: white; font-weight: 600; position: sticky; top: 0; z-index: 1; }
  tr:nth-child(even) { background-color: #f9f9f9; }
  tr:hover { background-color: #f1f7ff; }
  .pagination { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 12px; font-size: 14px; }
  .pagination button { padding: 6px 12px; border-radius: 4px; }
  .rows-label { margin-left: 10px; }
  .no-data { text-align: center; color: #666; font-style: italic; margin-top: 30px; }
  `]
})
export class BarcodeLabelComponent implements OnInit {
  excelData: any[] = [];
  excelHeaders: string[] = [];
  selectAll = false;
  private isBrowser: boolean;

  // pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  get pagedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.excelData.slice(start, start + this.pageSize);
  }

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private cd: ChangeDetectorRef) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      sessionStorage.clear();
    }
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (this.isBrowser) {
      sessionStorage.clear();
    }
    this.excelData = [];
    this.excelHeaders = [];
    this.selectAll = false;
    this.currentPage = 1;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
        this.excelData = data.map((row: any) => ({ ...row, selected: false }));
        this.excelHeaders = Object.keys(data[0] || {});
        this.totalPages = Math.ceil(this.excelData.length / this.pageSize);

        if (this.isBrowser) {
          sessionStorage.setItem(
            'excelData',
            JSON.stringify({ data: this.excelData, headers: this.excelHeaders })
          );
        }

        this.cd.detectChanges();
      } catch (err) {
        console.error('❌ Error parsing Excel file:', err);
      }
    };
    reader.readAsBinaryString(file);
  }

  toggleSelectAll(): void {
    this.excelData.forEach(row => row.selected = this.selectAll);
    if (this.isBrowser) {
      sessionStorage.setItem('excelData', JSON.stringify({
        data: this.excelData,
        headers: this.excelHeaders
      }));
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  changePageSize(event: any) {
    this.pageSize = +event.target.value;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.excelData.length / this.pageSize);
  }

printSelectedRows(): void {
  const selectedRows = this.excelData.filter(row => row.selected);
  if (!selectedRows.length) return;

  const style = `
    <style>
      @page { size: 7cm 13.5cm; margin: 0; }
      body { margin:0; font-family: 'Bebas Neue', Arial, sans-serif; font-weight:700; }
      .page { width:7cm; height:13.5cm; display:flex; flex-direction:column; justify-content:flex-end; page-break-after:always; }
      .label { width:7cm; height:7.5cm; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; padding:0.2cm 0.3cm 0.3cm 0.3cm; background:white; position:relative; }

      .price-section { width:100%; display:flex; flex-direction:column; align-items:flex-start; margin-bottom:0.1cm; }

      /* Actual Price (left-aligned, smaller) */
      .actual-price-container { display:flex; justify-content:flex-start; align-items:baseline; gap:0.08em; margin-bottom:0.1cm; }
      .actual-riyal { font-size:54px; font-weight:700; text-decoration: line-through; text-decoration-thickness: 2px; }
      .actual-dot { font-size:24px; font-weight:700; }
      .actual-halala { font-size:36px; font-weight:700; text-decoration: line-through; text-decoration-thickness: 2px; }
      .actual-symbol { font-size:16px; font-weight:700; position:relative; top:-0.3em; }

      /* Discounted Price (centered, bigger) */
      .discount-price-container { display:flex; justify-content:center; align-items:baseline; gap:0.08em; margin-top:0.06cm; margin-bottom:0.12cm; }
      .discount-riyal { font-size:90px; font-weight:700; }
      .discount-dot { font-size:34px; font-weight:700; }
      .discount-halala { font-size:44px; font-weight:700; }
      .discount-symbol { font-size:18px; font-weight:700; position:relative; top:-0.5em; }

      .product-name { font-size:18px; font-weight:700; text-align:center; margin:0.05cm 0; }
      .product-name-ar { font-family:'GE SS Two Medium', Arial, sans-serif; font-size:17px; text-align:center; direction:rtl; margin:0.05cm 0; }

      .date-line { font-size:13px; position:absolute; right:0.2cm; bottom:1cm; writing-mode:vertical-rl; transform:rotate(180deg); text-align:center; font-weight:700; }

      .barcode { width:6.5cm; height:1cm; margin-top:0.1cm; }
      .barcode svg { width:100%; height:100%; }
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

    // Barcode generation
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

          <div class="price-section">

            <!-- Actual price (left, smaller, same structure as discounted) -->
            <div class="actual-price-container">
              <span class="actual-riyal">${actualRiyal}</span>
              <span class="actual-dot">.</span>
              <span class="actual-halala">${actualHalala}</span>
              <span class="actual-symbol">ريال</span>
            </div>

            <!-- Discounted price (centered, bigger) -->
            <div class="discount-price-container">
              <span class="discount-riyal">${riyal}</span>
              <span class="discount-dot">.</span>
              <span class="discount-halala">${halala}</span>
              <span class="discount-symbol">ريال</span>
            </div>

            <!-- Barcode below -->
            <div class="barcode">${barcodeSVG}</div>
          </div>

          <!-- Product names -->
          <div class="product-name-ar">${row['arabic name'] ?? ''}</div>
          <div class="product-name">${row['item name'] ?? ''}</div>

          <!-- Date -->
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