import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import * as Papa from 'papaparse';

@Injectable({
    providedIn: 'root'
})
export class DataLoaderService {

    constructor(private http: HttpClient) {
    }

    getData<T>(filePath: string): Observable<T[]> {
        return this.http.get(filePath, {responseType: 'text'})
            .pipe(
                map(csvData => {
                    // Détecter le délimiteur en fonction de l'extension du fichier
                    const delimiter = filePath.endsWith('.tsv') ? '\t' : ',';

                    const parsedData = Papa.parse<T>(csvData, {
                        header: true,
                        skipEmptyLines: true,
                        delimiter: delimiter, // Spécifier le délimiteur ici
                    });

                    if (parsedData.errors.length > 0) {
                        // S'il y a des erreurs, on les affiche et on retourne un tableau vide
                        console.error(parsedData.errors);
                        return [];
                    }

                    return parsedData.data;
                })
            );
    }
}

