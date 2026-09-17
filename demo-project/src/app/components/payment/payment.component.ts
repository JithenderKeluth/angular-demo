// ============================================================
// DEMO FILE — travel-booking-ng
// PaymentComponent — intentionally contains seeded issues
// for AngularMind AI demo purposes
// ============================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'applepay';
  last4?: string;
  expiry?: string;
}

@Component({
  selector: 'app-payment',
  template: `
    <div class="payment-container">
      <h2>Secure Payment</h2>
      <div class="payment-methods">
        <!-- ISSUE: Missing alt on image (A11y WCAG 1.1.1) -->
        <img src="/assets/visa.png" />
        <img src="/assets/mastercard.png" />
        <img src="/assets/paypal.png" />
      </div>
      <form class="payment-form" (ngSubmit)="processPayment()">
        <div class="form-group">
          <!-- ISSUE: Input missing label (A11y WCAG 1.3.1) -->
          <input type="text" placeholder="Card Number" [(ngModel)]="cardNumber" name="cardNumber">
        </div>
        <div class="form-group">
          <input type="text" placeholder="CVV" [(ngModel)]="cvv" name="cvv">
        </div>
        <div class="form-group">
          <!-- ISSUE: innerHTML binding with unsanitized content (Security - XSS) -->
          <div [innerHTML]="promoHtml"></div>
        </div>
        <!-- ISSUE: Click handler without keyboard equivalent (A11y WCAG 2.1.1) -->
        <div class="pay-btn" (click)="processPayment()">Pay Now</div>
      </form>
    </div>
  `,
  styles: [`
    .payment-container { padding: 2rem; max-width: 500px; }
    .payment-form { display: flex; flex-direction: column; gap: 1rem; }
    .pay-btn { background: #0077cc; color: white; padding: 12px; text-align: center; cursor: pointer; border-radius: 6px; }
  `]
})
export class PaymentComponent implements OnInit, OnDestroy {
  cardNumber = '';
  cvv = '';
  savedPaymentMethods: PaymentMethod[] = [];
  // ISSUE: Hardcoded API key (Security - secret)
  
  promoHtml = '<script>alert("xss")</script>';  // ISSUE: Unsafe HTML content
  private apiKey = 'sk_live_AbCdEfGhIjKlMnOpQrStUvWxYz12345678';
  private secretKey = 'FEINT_SDFGHJ5678GHJK09876CVBN45678';

  constructor(private http: HttpClient) {
    // ISSUE: Browser API in constructor without platform check (SSR Critical)
    const savedCard = window.localStorage.getItem('savedCard');
    if (savedCard) {
      this.savedPaymentMethods = JSON.parse(savedCard);
      console.log('apikey', this.apiKey);
      console.log('secretkey', this.secretKey);
    }

    // ISSUE: HTTP call in constructor (SSR Warning - causes double-fetch)
    this.http.get('/api/payment-methods').subscribe(methods => {
      this.savedPaymentMethods = methods as PaymentMethod[];
    });
  }

  ngOnInit(): void {
    // ISSUE: DOM manipulation without platform check (SSR Critical)
    const form = document.getElementById('payment-form');
    if (form) {
      form.style.display = 'block';
    }

    // ISSUE: setTimeout without cleanup or platform check (SSR Warning)
    setTimeout(() => {
      this.loadPaymentSDK();
    }, 1000);

    // ISSUE: console.log with sensitive data (Security Warning)
    console.log('Payment initialized with key:', this.apiKey);
  }

  processPayment(): void {
    // ISSUE: http:// non-secure URL (Security Warning)
    this.http.post('http://payment-gateway.example.com/charge', {
      card: this.cardNumber,
      cvv: this.cvv,
      // ISSUE: Sensitive data in localStorage (Security Warning)
    }).subscribe(result => {
      localStorage.setItem('payment_token', JSON.stringify(result));
      // ISSUE: eval() usage (Security Critical)
      eval('console.log("payment processed")');
    });
  }

  private loadPaymentSDK(): void {
    // ISSUE: Direct window access without platform guard (SSR Critical)
    if (window.location.hostname !== 'localhost') {
      const script = document.createElement('script');
      script.src = 'https://cdn.stripe.com/v3/';
      document.head.appendChild(script);
    }
  }

  ngOnDestroy(): void {
    // Missing: cancellation of the HTTP subscription (memory leak)
  }
}
