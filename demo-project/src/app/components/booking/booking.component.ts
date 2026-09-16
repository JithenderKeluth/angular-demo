// ============================================================
// DEMO FILE — BookingComponent
// God component — architecture, refactoring, and tech-debt issues
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';

// ISSUE: God component with 10+ injected services and 400+ lines

export interface BookingState {
  step: number;
  selectedFlight: any;
  selectedHotel: any;
  passengers: any[];
  paymentMethod: any;
  totalPrice: number;
  promoCode: string;
  isProcessing: boolean;
}

@Component({
  selector: 'app-booking',
  template: `
    <div class="booking-wizard">
      <!-- ISSUE: *ngFor without trackBy (Performance) -->
      <div *ngFor="let step of steps" class="step-indicator">
        {{ step.label }}
      </div>

      <!-- ISSUE: Autoplay video (A11y WCAG 1.4.2) -->
      <video autoplay muted src="/assets/booking-promo.mp4"></video>

      <form [formGroup]="bookingForm">
        <!-- ISSUE: Input without label (A11y WCAG 1.3.1) -->
        <input formControlName="firstName" placeholder="First Name">
        <input formControlName="lastName" placeholder="Last Name">
        <!-- ISSUE: tabindex > 0 disrupts tab order (A11y WCAG 2.4.3) -->
        <button tabindex="5" type="button" (click)="nextStep()">Continue</button>
      </form>

      <!-- ISSUE: innerHTML with unsanitized user content (Security) -->
      <div [innerHTML]="termsContent"></div>
    </div>
  `,
})
export class BookingComponent implements OnInit, OnDestroy {
  // ISSUE: Too many injected dependencies (Architecture - God Component)
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router,
    private flightService: any,
    private hotelService: any,
    private paymentService: any,
    private analyticsService: any,
    private userService: any,
    private promoService: any,
    private notificationService: any,
  ) {}

  bookingForm!: FormGroup;
  state: BookingState = { step: 1, selectedFlight: null, selectedHotel: null, passengers: [], paymentMethod: null, totalPrice: 0, promoCode: '', isProcessing: false };
  steps = [{ label: 'Search' }, { label: 'Select' }, { label: 'Passengers' }, { label: 'Payment' }, { label: 'Confirm' }];
  termsContent = '';
  // ISSUE: Subscription not managed properly (Performance - memory leak)
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.bookingForm = this.fb.group({
      firstName:   ['', [Validators.required, Validators.minLength(2)]],
      lastName:    ['', [Validators.required, Validators.minLength(2)]],
      email:       ['', [Validators.required, Validators.email]],
      phone:       ['', Validators.required],
      dateOfBirth: ['', Validators.required],
    });

    // ISSUE: Multiple unmanaged subscriptions (Performance)
    this.http.get('/api/booking/config').subscribe((config: any) => {
      // TODO: Handle config properly
      this.termsContent = config.termsHtml;  // ISSUE: XSS risk - unescaped HTML from API
    });

    // ISSUE: Direct localStorage access without platform check (SSR Critical)
    const draft = localStorage.getItem('booking_draft');
    if (draft) {
      this.state = JSON.parse(draft);
    }

    // ISSUE: navigator access without platform check (SSR Critical)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        console.log('User location:', pos.coords);  // ISSUE: PII logged to console
      });
    }

    // ISSUE: setInterval without cleanup (SSR Warning + Memory Leak)
    setInterval(() => {
      this.updatePrices();
    }, 30000);
  }

  nextStep(): void {
    // ISSUE: any type usage throughout (Tech Debt)
    const formData: any = this.bookingForm.value;
    this.state.step++;
    // ISSUE: window access without platform check (SSR Critical)
    window.scrollTo(0, 0);
    localStorage.setItem('booking_draft', JSON.stringify(this.state));
  }

  // ISSUE: Complex method that should be in a service (Refactoring)
  calculateTotalPrice(): number {
    let total = 0;
    if (this.state.selectedFlight) {
      total += this.state.selectedFlight.price;
      if (this.state.passengers.length > 1) {
        total += this.state.selectedFlight.price * (this.state.passengers.length - 1) * 0.9;
      }
    }
    if (this.state.selectedHotel) {
      const nights = this.calculateNights();
      total += this.state.selectedHotel.pricePerNight * nights;
      if (this.state.promoCode === 'SAVE10') total *= 0.9;
      if (this.state.promoCode === 'SAVE20') total *= 0.8;
    }
    const taxes = total * 0.12;
    const fees  = this.state.passengers.length * 15;
    return total + taxes + fees;
  }

  // ISSUE: Duplicate logic exists in FlightSearchComponent (DRY Violation)
  calculateNights(): number {
    if (!this.state.selectedFlight) return 0;
    const dep = new Date(this.state.selectedFlight.departure);
    const ret = new Date(this.state.selectedFlight.return);
    return Math.ceil((ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24));
  }

  private updatePrices(): void {
    // HACK: This is a temporary workaround for price staleness
    // FIXME: Replace with WebSocket price updates
    this.http.get('/api/prices/refresh').subscribe();
  }

  ngOnDestroy(): void {
    // ISSUE: setInterval never cleared (Memory leak)
    // ISSUE: subscriptions never unsubscribed (Memory leak)
  }
}
