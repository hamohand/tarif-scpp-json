import {Component, OnInit} from '@angular/core';
import {ChapitresService} from '../../app/services/chapitres.service';
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-chapitres',
  standalone: true,
  imports: [
    NgIf,
    NgForOf
  ],
  templateUrl: './chapitres.component.html',
  styleUrl: './chapitres.component.css'
})
export class ChapitresComponent implements OnInit{
  chapitres: any[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private chapitresService: ChapitresService) {}

  ngOnInit(): void {
    this.loadChapitres();
  }

  loadChapitres(): void {
    this.isLoading = true;
    this.error = null;

    this.chapitresService.getAllChapitres()
        .subscribe({
          next: (chapitres: any[]) => {
            this.chapitres = chapitres;
            console.log('chapitres loaded:', chapitres);
            this.isLoading = false;
          },
          error: (err: any) => {
            console.error(err);
            this.error = 'Une erreur est survenue lors du chargement des chapitres. Veuillez réessayer.';
            this.isLoading = false;
          }
        });
  }
}
