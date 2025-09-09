import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>printdata</h1>

    <div class="actions">
     
      <a routerLink="/barcode" class="link-btn">Go to Barcode Label</a>
    </div>
  `,
  styles: [`
    h1 {
      text-align: center;
      margin-bottom: 40px;
      color: #4a90e2;
    }
    .actions { display: flex; gap: 12px; justify-content: center; }
    button, .link-btn {
      display: inline-block;
      padding: 12px 24px;
      font-size: 16px;
      border-radius: 6px;
      border: none;
      background-color: #4a90e2;
      color: white;
      cursor: pointer;
      text-decoration: none;
      transition: background-color 0.3s ease;
    }
    button:hover, .link-btn:hover {
      background-color: #357ac9;
    }
  `]
})
export class Home {
  constructor(private router: Router) {}

  goToPrint() {
    this.router.navigate(['/print']);
  }
}
