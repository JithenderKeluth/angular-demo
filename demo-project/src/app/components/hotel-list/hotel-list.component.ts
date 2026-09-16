// ============================================================
// DEMO FILE — HotelListComponent
// Seeded with performance and accessibility issues for demo
// ============================================================

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Hotel {
  id: string;
  name: string;
  city: string;
  price: number;
  rating: number;
  lat: number;
  lng: number;
  images: string[];
  amenities: string[];
}

@Component({
  selector: 'app-hotel-list',
  template: `
    <div class="hotel-list">
      <div class="filters">
        <!-- ISSUE: Multiple function calls in template (Performance) -->
        <span>Showing {{ getFilteredHotels().length }} of {{ hotels.length }} hotels</span>
        <!-- ISSUE: Non-HTTPS URL in template (Security) -->
        <img src="http://cdn.example.com/filter-icon.png" />
      </div>

      <!-- ISSUE: *ngFor without trackBy (Performance) -->
      <div *ngFor="let hotel of hotels" class="hotel-card">
        <!-- ISSUE: Function call in template — runs on every CD cycle (Performance) -->
        <div class="distance">{{ calculateDistance(hotel.lat, hotel.lng) }}km from center</div>
        <!-- ISSUE: Image missing alt attribute (A11y) -->
        <img [src]="hotel.images[0]" class="hotel-image">
        <h3>{{ hotel.name }}</h3>
        <p>{{ hotel.city }}</p>
        <!-- ISSUE: Dynamic price calculation in template (Performance) -->
        <div class="price">{{ formatPrice(hotel.price) }}</div>
        <!-- ISSUE: *ngFor without trackBy on inner array (Performance) -->
        <div *ngFor="let amenity of hotel.amenities" class="amenity-tag">
          {{ amenity }}
        </div>
        <!-- ISSUE: Click on non-interactive element, no keyboard handler (A11y) -->
        <div class="book-btn" (click)="bookHotel(hotel)">Book Now</div>
      </div>

      <!-- ISSUE: No live region for dynamic content updates (A11y) -->
      <div *ngIf="loading" class="loading-spinner">Loading...</div>
    </div>
  `,
})
export class HotelListComponent implements OnInit {
  hotels: Hotel[] = [];
  loading = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loading = true;
    // ISSUE: No error handling on HTTP observable (API Mapping)
    this.http.get<Hotel[]>('/api/hotels').subscribe(hotels => {
      this.hotels = hotels;
      this.loading = false;
    });
    // ISSUE: Subscription not stored for cleanup (Performance - memory leak)
  }

  // ISSUE: Called on every change detection cycle from template (Performance Critical)
  getFilteredHotels(): Hotel[] {
    return this.hotels.filter(h => h.rating > 3.5);
  }

  // ISSUE: Heavy computation called from template on every CD cycle (Performance Critical)
  calculateDistance(lat: number, lng: number): number {
    const userLat = 51.5074;
    const userLng = -0.1278;
    const R = 6371;
    const dLat = (lat - userLat) * Math.PI / 180;
    const dLon = (lng - userLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }

  // ISSUE: Called in template on every CD cycle (Performance)
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(price);
  }

  bookHotel(hotel: Hotel): void {
    // TODO: Implement booking flow
    // FIXME: This needs proper error handling
    window.location.href = `/booking/${hotel.id}`;  // ISSUE: window.location without platform check (SSR)
  }
}
