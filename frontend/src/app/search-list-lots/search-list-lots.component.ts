import { Component } from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import {Article} from "../../assets/objets/articles";
import {SearchService} from "../services/search.service";
import * as Papa from "papaparse";
import {bufferCount, catchError, concatMap, delay, finalize, forkJoin, from, Observable, of, reduce, tap} from "rxjs";

@Component({
  selector: 'app-search-list-lots',
  standalone: true,
    imports: [
        NgForOf,
        NgIf
    ],
  templateUrl: './search-list-lots.component.html',
  styleUrl: './search-list-lots.component.css'
})
export class SearchListLotsComponent {
    lesarticles: Article[] = [];
    fileName: string = '';
    isLoading: boolean = false;
    error: string | null = null;
    isSearchComplete: boolean = false;

    completedCount: number = 0;
    totalCount: number = 0;

    // Réglages basés sur votre analyse : 5 requêtes par minute
    private readonly BATCH_SIZE = 5;
    private readonly DELAY_BETWEEN_BATCHES = 61000; // 61 secondes

    constructor(private searchService: SearchService) {}

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        this.fileName = file.name;
        this.isLoading = true;
        this.lesarticles = [];
        this.error = null;
        this.isSearchComplete = false;
        this.completedCount = 0;
        this.totalCount = 0;

        const reader = new FileReader();
        reader.onload = () => {
            const fileContent = reader.result as string;
            //const delimiter = file.name.toLowerCase().endsWith('.tsv') ? '\t' : ',';
            Papa.parse<Article>(fileContent, {
                header: true,
                skipEmptyLines: true,
                transformHeader: header => header.toLowerCase().trim(),
                //delimiter: delimiter,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        this.error = `Erreur d'analyse : ${results.errors[0].message}`;
                    } else {
                        this.lesarticles = results.data;
                        this.totalCount = this.lesarticles.length;
                    }
                    this.isLoading = false;
                },
                error: (err: any) => {
                    this.error = `Erreur de lecture du fichier : ${err.message}`;
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
     * Lance la recherche en respectant une limite de 5 requêtes par minute.
     */
    search(): void {
        if (!this.lesarticles?.length) return;

        this.isLoading = true;
        this.error = null;
        this.isSearchComplete = false;
        this.completedCount = 0;

        from(this.lesarticles).pipe(
            // 1. Crée des paquets de 5 articles
            bufferCount(this.BATCH_SIZE),

            // 2. Traite chaque paquet l'un après l'autre
            concatMap((batchOfArticles, index) => {
                console.log(`Traitement du paquet n°${index + 1} (${batchOfArticles.length} articles)...`);

                // Crée les requêtes pour le paquet en cours
                const searchRequests$ = batchOfArticles.map(article =>
                    this.createArticleSearchObservable(article).pipe(
                        tap(() => this.completedCount++)
                    )
                );

                // Exécute les requêtes du paquet en parallèle et, une fois terminées,
                // attend 61 secondes avant de laisser concatMap passer au paquet suivant.
                return forkJoin(searchRequests$).pipe(
                    tap(() => {
                        // Ce log est important pour savoir que le système est en pause
                        if ((index + 1) * this.BATCH_SIZE < this.totalCount) {
                            console.log(`Paquet n°${index + 1} traité. Pause de 61 secondes avant le prochain...`);
                        }
                    }),
                    delay(this.DELAY_BETWEEN_BATCHES)
                );
            }),

            // 3. Rassemble les résultats de tous les paquets
            reduce((acc, batchResults) => acc.concat(batchResults), [] as string[]),

            // 4. Se déclenche quand TOUT est terminé
            finalize(() => {
                this.isLoading = false;
                this.isSearchComplete = true;
            })
        ).subscribe({
            next: (allResults) => {
                allResults.forEach((code, index) => {
                    if (this.lesarticles[index]) {
                        this.lesarticles[index].code = code;
                    }
                });
                console.log("Traitement de tous les paquets terminé.", this.lesarticles);
            },
            error: (err) => {
                this.error = 'Une erreur majeure est survenue pendant le traitement des paquets.';
                console.error('Erreur dans le flux principal:', err);
            }
        });
    }

    private createArticleSearchObservable(article: Article): Observable<string> {
        if (!article.article || !article.article.trim()) {
            return of(article.code || '').pipe(delay(0));
        }
        return this.searchService.searchCodes(article.article).pipe(
            catchError(err => {
                console.error(`Erreur API pour l'article "${article.article}":`, err);
                if (!this.error) {
                    this.error = 'Certaines requêtes ont échoué. Les codes originaux sont conservés.';
                }
                return of(article.code || '');
            })
        );
    }

    saveAndDownload(): void {
        if (!this.lesarticles?.length) return;
        const tsvContent = Papa.unparse(this.lesarticles, { delimiter: "\t", header: true });
        const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `resultat-${this.fileName}`;
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

