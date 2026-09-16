// ============================================================
// DEMO FILE — FlightSearchComponent
// Mixed SSR + performance + documentation issues
// ============================================================

import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // ISSUE: Reads window.history without platform guard (SSR Critical)
    const lastSearch = window.sessionStorage.getItem('last_flight_search');
    if (lastSearch) this.search = JSON.parse(lastSearch);
  }

  searchFlights(): void {
    // ISSUE: No catchError handler (API Mapping)
    this.http.post<Flight[]>('/api/flights/search', this.search).subscribe(flights => {
      this.results = flights;
      sessionStorage.setItem('last_flight_search', JSON.stringify(this.search));
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
  }
}
