import { Component } from '@angular/core';
import {Article, articles} from "../objets/articles";
import {NgForOf} from "@angular/common";
import {SearchService} from "../../app/services/search.service";
import {ReactiveFormsModule} from "@angular/forms";
import {catchError, finalize, forkJoin, Observable, of} from "rxjs";

@Component({
  selector: 'app-search-list',
  standalone: true,
  imports: [
    NgForOf,
    ReactiveFormsModule
  ],
  templateUrl: './search-list.component.html',
  styleUrl: './search-list.component.css'
})
export class SearchListComponent {
  lesarticles: Article[] = articles;
  searchTerm: string = '';
  searchResults: string | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private searchService: SearchService) {}
  /**
   * Lance la recherche des codes pour tous les articles de la liste.
   */
  search(): void {
    // S'il n'y a pas d'articles, on ne fait rien.
    if (!this.lesarticles?.length) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    const searchRequests$ = this.lesarticles.map(article =>
        this.createArticleSearchObservable(article)
    );

    forkJoin(searchRequests$)
        .pipe(
            // isLoading sera mis à false à la fin, succès ou erreur.
            finalize(() => this.isLoading = false)
        )
        .subscribe({
          next: (results) => {
            // On met à jour le code de chaque article avec les résultats.
            results.forEach((code, index) => {
              this.lesarticles[index].code = code;
            });
            console.log("Toutes les recherches sont terminées.", this.lesarticles);
          },
          error: (err) => {
            // Ce bloc est une sécurité, les erreurs individuelles étant déjà traitées.
            this.error = 'Une erreur inattendue est survenue lors du traitement des recherches.';
            console.error(err);
          }
        });
  }

  /**
   * Crée un Observable pour la recherche du code d'un article.
   * Gère les erreurs individuelles et les articles sans titre.
   * @param article L'article pour lequel créer la requête de recherche.
   * @returns Un Observable qui émettra le code trouvé ou le code existant.
   */
  private createArticleSearchObservable(article: Article): Observable<string> {
    if (!article.article) {
      // S'il n'y a pas de titre, on retourne un Observable avec le code existant.
      return of(article.code);
    }

    return this.searchService.searchCodes(article.article).pipe(
        catchError(err => {
          console.error(err);
          // On définit un message d'erreur général seulement s'il n'y en a pas déjà un.
          if (!this.error) {
            this.error = 'Une erreur est survenue lors de la recherche. Veuillez réessayer.';
          }
          // Pour les requêtes échouées, on retourne le code original pour ne pas bloquer l'interface.
          return of(article.code);
        })
    );
  }



  //////////////////////////////////////////////////////////////////////////////////////////////////////
  //Version IA ****************************************************************************************
  /*
  search(): void {
    // On vérifie s'il y a des articles à traiter
    if (! This.lesarticles?.length) {
      return;
    }

    this.isLoading = true;
    this.error = null ;

    const searchRequests = this.lesarticles.map(article => {
      if (!article.articleTitle) {
        // S'il n'y a pas de titre, on retourne un Observable avec le code existant.
        return of(article.code);
      }
      return this.searchService.searchCodes(article.articleTitle).pipe(
          catchError(err => {
            console.error(`Erreur lors de la recherche pour "${article.articleTitle}":`, err);
            // On définit un message d'erreur général s'il n'y en a pas déjà un.
            if (!this.error) {
              this.error = 'Une erreur est survenue lors de la recherche. Veuillez réessayer.';
            }
            // Pour les requêtes échouées, on retourne le code original pour ne pas casser l'UI.
            return of(article.code);
          })
      );
    });

    forkJoin(searchRequests).subscribe({
      next: (results) => {
        // On met à jour le code de chaque article avec les résultats.
        results.forEach((code, index) => {
          this.lesarticles[index].code = code;
        });
        this.isLoading = false;
        console.log("Toutes les recherches sont terminées.", this.lesarticles);
      },
      error: (err) => {
        // Ce bloc d'erreur est une sécurité, car les erreurs individuelles sont déjà interceptées.
        this.error = 'Une erreur inattendue est survenue lors du traitement des recherches.';
        this.isLoading = false;
        console.error('Erreur inattendue dans forkJoin:', err);
      }
    });
  }*/
///////////////////////////////////////////////////////////
  /*search(): void {
    for (let i = 0; i < this.lesarticles.length; i++) {
      this.searchTerm = this.lesarticles[i].articleTitle;
      console.log("serchTerme "+i+" : "+ this.searchTerm);

      if (!this.searchTerm) {
        this.error = 'Veuillez entrer un terme de recherche';
        return;
      }

      this.isLoading = true;
      this.error = null;
      this.searchResults = null;

      this.searchService.searchCodes(this.searchTerm)
          .subscribe({
            next: (results) => {
              this.searchResults = results;
              this.lesarticles[i].code = results;
              console.log("serchTerme : "+ this.searchTerm," - ",'search resultats:', results);
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Error searching chapters:', err);
              this.error = 'Une erreur est survenue lors de la recherche. Veuillez réessayer.';
              this.isLoading = false;
            }
          });
    }

  }*/
}
