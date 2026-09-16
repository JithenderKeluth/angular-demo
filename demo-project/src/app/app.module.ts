import { NgModule }            from '@angular/core';
import { BrowserModule }        from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule }     from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { BookingComponent }     from './components/booking/booking.component';
import { HotelListComponent }   from './components/hotel-list/hotel-list.component';
import { FlightSearchComponent} from './components/flight-search/flight-search.component';
import { PaymentComponent }     from './components/payment/payment.component';

const routes: Routes = [
  { path: '',         component: FlightSearchComponent },
  { path: 'hotels',   component: HotelListComponent },
  { path: 'booking',  component: BookingComponent },
  { path: 'payment',  component: PaymentComponent },
];

@NgModule({
  declarations: [BookingComponent, HotelListComponent, FlightSearchComponent, PaymentComponent],
  imports: [BrowserModule, FormsModule, ReactiveFormsModule, HttpClientModule, RouterModule.forRoot(routes)],
  bootstrap: [],
})
export class AppModule {}
