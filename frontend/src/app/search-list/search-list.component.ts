import {Component} from '@angular/core';
import {Article} from "../../assets/objets/articles";
import {NgForOf, NgIf} from "@angular/common";
import {SearchService} from "../services/search.service";
import {ReactiveFormsModule} from "@angular/forms";
import {catchError, finalize, Observable, of, from, concatMap, toArray} from "rxjs";
import * as Papa from "papaparse";

@Component({
  selector: 'app-search-list',
  standalone: true,
  imports: [
    NgForOf,
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './search-list.component.html',
  styleUrl: './search-list.component.css'
})
export class SearchListComponent {
  lesarticles: Article[] = [];
  fileName: string = ''; // Pour afficher le nom du fichier chargé
  isLoading: boolean = false;
  error: string | null = null;
  isSearchComplete: boolean = false;

  constructor(private searchService: SearchService) {}

  /**
   * Gère la sélection d'un fichier par l'utilisateur.
   * @param event L'événement du champ de saisie de fichier.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    this.fileName = file.name;
    this.isLoading = true;
    // Réinitialiser les données et l'état précédents
    this.lesarticles = [];
    this.error = null;
    this.isSearchComplete = false;

    const reader = new FileReader();

    reader.onload = () => {
      const fileContent = reader.result as string;
      const delimiter = file.name.toLowerCase().endsWith('.tsv') ? '\t' : ',';

      Papa.parse<Article>(fileContent, {
        header: true,
        skipEmptyLines: true,
        delimiter: delimiter,
        complete: (results) => {
          if (results.errors.length > 0) {
            this.error = `Erreur lors de l'analyse du fichier : ${results.errors[0].message}`;
            this.lesarticles = [];
          } else {
            this.lesarticles = results.data;
          }
          this.isLoading = false;
        },
        error: (err: any) => {
          this.error = `Une erreur est survenue lors de la lecture du fichier : ${err.message}`;
          this.isLoading = false;
        }
      });
    };

    reader.onerror = () => {
      this.error = "Impossible de lire le fichier sélectionné.";
      this.isLoading = false;
    };

    reader.readAsText(file, 'UTF-8');
  }

  /**
   * Lance la recherche des codes pour tous les articles de la liste de manière séquentielle.
   */
  search(): void {
    if (!this.lesarticles?.length) {
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.isSearchComplete = false;

    from(this.lesarticles).pipe(
        concatMap(article => this.createArticleSearchObservable(article)),
        toArray(),
        finalize(() => {
          this.isLoading = false;
          this.isSearchComplete = true;
        })
    ).subscribe({
      next: (results) => {
        results.forEach((code, index) => {
          if (this.lesarticles[index]) {
            this.lesarticles[index].code = code;
          }
        });
      },
      error: (err) => {
        this.error = 'Une erreur inattendue est survenue lors du traitement des recherches.';
      }
    });
  }

  /**
   * Crée un Observable pour la recherche du code d'un article.
   */
  private createArticleSearchObservable(article: Article): Observable<string> {
    if (!article.article) {
      return of(article.code);
    }

    return this.searchService.searchCodes(article.article).pipe(
        catchError(err => {
          if (!this.error) {
            this.error = 'Une erreur est survenue lors de la recherche. Veuillez réessayer.';
          }
          return of(article.code);
        })
    );
  }

  /**
   * Convertit les données mises à jour en format TSV et déclenche le téléchargement.
   */
  saveAndDownload(): void {
    if (!this.lesarticles?.length) {
      return;
    }

    const tsvContent = Papa.unparse(this.lesarticles, {
      delimiter: "\t",
      header: true,
    });

    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `resultat-${this.fileName}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
/**
 * ### Le Problème : Exécution Parallèle avec `forkJoin`
 * Le comportement que vous décrivez est typique d'un serveur qui reçoit trop de requêtes simultanées. Voici ce qui se passe :
 * 1. **est Parallèle`forkJoin`** : L'opérateur attend que vous lui donniez une liste d'Observables (vos requêtes de recherche). Dès qu'il s'abonne, il lance **toutes les requêtes en même temps**, en parallèle. `forkJoin`
 * 2. **Surcharge du Serveur** : Si vous avez 3, 5 ou 10 articles, votre application envoie 3, 5 ou 10 requêtes HTTP au serveur backend _exactement au même moment_. De nombreux serveurs ou API sont configurés avec des mécanismes de protection (appelés "rate limiting" ou limitation de débit) pour éviter d'être surchargés. Lorsqu'ils détectent un afflux soudain de requêtes depuis la même source, ils peuvent en rejeter certaines, ce qui provoque les erreurs que vous observez.
 *
 * Une recherche unique fonctionne bien car elle n'active pas ces protections. C'est le volume soudain de requêtes qui pose problème.
 * ### La Solution : Exécution Séquentielle avec `concatMap`
 * Pour résoudre ce problème, nous devons cesser d'envoyer toutes les requêtes en même temps. À la place, nous allons les exécuter les unes après les autres : envoyer une requête, attendre sa réponse, puis envoyer la suivante. C'est ce qu'on appelle une exécution **séquentielle**.
 * L'opérateur RxJS parfait pour cela est `concatMap`.
 * Voici comment nous pouvons modifier votre code pour utiliser cette stratégie :
 * 1. Nous utiliserons `from(this.lesarticles)` pour créer un flux (Observable) qui émettra chaque article de votre liste, un par un.
 * 2. Nous utiliserons l'opérateur sur ce flux. `pipe`
 * 3. À l'intérieur de , nous utiliserons `concatMap`. Pour chaque article reçu, `concatMap` appellera et attendra que cette requête soit terminée avant de passer à l'article suivant. `pipe``createArticleSearchObservable`
 * 4. Enfin, nous utiliserons l'opérateur `toArray` pour collecter tous les résultats individuels dans un seul tableau, afin d'obtenir un comportement final similaire à . `forkJoin`
 */