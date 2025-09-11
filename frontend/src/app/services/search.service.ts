import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = '/api/recherche';
    private conversionApiUrl = '/api/conversion';

    constructor(private http: HttpClient) { }
  /**
   * Search for chapters based on a search term
   * @param searchTerm The term to search for
   * @returns An Observable with the search results as a string
   */
  searchCodes(searchTerm: string): Observable<string> {
   // return this.http.get(`${this.apiUrl}/chapitres`, {
    //return this.http.get(`${this.apiUrl}/positions4`, {
    return this.http.get(`${this.apiUrl}/positions6`, {
      params: { termeRecherche: searchTerm },
      responseType: 'text'
    });
  }

    /**
     * Converts a spreadsheet file (Excel, ODS) to a text format (CSV/TSV).
     * @param file The file to convert.
     * @param outputFormat The desired output format ('csv' or 'tsv').
     * @returns An Observable with the converted file content as a string.
     */
    convertFile(file: File): Observable<string> {
        const formData = new FormData();
        formData.append('file', file, file.name);

        // Le paramètre 'outputFormat' n'est plus nécessaire, le backend le gère.
        return this.http.post(`${this.conversionApiUrl}/convert`, formData, {
            responseType: 'text'
        });
    }

}
