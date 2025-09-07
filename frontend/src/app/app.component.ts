import {Component, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {NgIf} from "@angular/common";

// @ts-ignore
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf],
  template: `
    <div class="container">
    <header>
      <h1>Universal Customs Tariff for International Trade</h1>
      <h2>Recherche multilingue de position - Multilingual position search - البحث عن المواقع متعدد اللغات</h2>
      
    </header>
    <main>
      <router-outlet></router-outlet>

    </main>
    <footer>
      <p>&copy; 2025 Enclume-Numérique</p>
    </footer>

    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 30px;
    }
    header {
      margin-bottom: 30px;
      border-bottom: 2px solid #e9ecef;
      padding-bottom: 15px;
      text-align: center;
    }
    header h1 {
      color: #349;
      font-weight: 600;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.05);
    }
    h2 {
      text-align: center;
      margin-bottom: 25px;
      color: #2c3e80;
    }
    main {
      min-height: 400px;
    }
    footer {
      margin-top: 30px;
      border-top: 2px solid #e9ecef;
      padding-top: 15px;
      text-align: center;
      color: #7f8c8d;
      font-size: 0.9rem;
    }
  `]
})
export class AppComponent {
  //title = 'Chapitres';
  //title = 'Positions-4';
  title = 'Positions-6';
  expired = false;

  constructor() {}

}
