import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ HttpClientModule,RouterOutlet, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'train-booking';
  numOfSeats: number = 0; // Input for number of seats to book
  isLoading: boolean = true; // Loading state for all API calls
  seatsArrayLeft: number[] = []; // Array to store seat statuses for left side
  seatsArrayRight: number[] = []; // Array to store seat statuses for right side

  http: any;
  constructor(http: HttpClient) { 
    this.http = http;
  };

  ngOnInit(): void {
    this.getCurrentBookedSeat(); // Fetch the current seat statuses when the component loads
  }

  // Fetch current seat status from the backend
  getCurrentBookedSeat(): void {
    this.http.get(`${environment.apiUrl}/seats`).subscribe(
      (backendSeatData:any) => {
        this.seatsArrayLeft = [];
        this.seatsArrayRight = [];
        this.isLoading = false;

        // Fill seatsArrayLeft and seatsArrayRight based on row logic
        for (let i = 0; i < 80; i += 7) {
          this.seatsArrayLeft.push(...backendSeatData.slice(i, i + 4)); // First 4 seats for left
          this.seatsArrayRight.push(...backendSeatData.slice(i + 4, i + 7)); // Next 3 seats for right
        }
      },
      (error:any) => {
        console.error('Error fetching seat data:',error.error.message);
        this.isLoading = false;
      }
    );
  }

  // Frontend Validation for number of seats to book
  bookSeatsValidation(): boolean {
    if (this.numOfSeats < 1) {
      alert('Please enter a valid number of seats to book.');
      return false;
    }
    if (this.numOfSeats > 7) {
      alert('You can book up to 7 seats at a time.');
      return false;
    }
    return true;
  }

  // Book seats through the backend after validation
  bookSeats() {
    if (this.bookSeatsValidation()) {
      this.http.post(`${environment.apiUrl}/book`, { numOfSeats: this.numOfSeats }).subscribe(
        (response: any) => {
          alert(`Seats booked: ${response.bookedSeats.join(', ')}`);
          this.isLoading = false;
          this.getCurrentBookedSeat(); // Refresh the seat statuses after booking
        },
        (error:any) => {
          alert(error.error.message);
          console.error('Error booking seats:', error);
        }
      );
    }
  }

  // Vacate all seats through the backend
  vacateAllSeats() {
    this.http.post(`${environment.apiUrl}/vacate`, {}).subscribe(
      () => {
        alert('All seats have been vacated.');
        this.getCurrentBookedSeat(); // Refresh the seat statuses after vacating
      },
      (error : any) => {
        alert(error.error.message);
        console.error('Error vacating seats:', error);
      }
    );
  }
}