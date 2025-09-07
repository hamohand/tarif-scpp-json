import { Routes } from '@angular/router';
import { SearchComponent } from './search/search.component';
import {ChapitresComponent} from "../assets/chapitres/chapitres.component";
import {SearchListComponent} from "./search-list/search-list.component";
import {LoadData01Component} from "../assets/load-data01/load-data01.component";
import {SearchListLotsComponent} from "./search-list-lots/search-list-lots.component";

export const routes: Routes = [
    // Article unique
//     { path: '', redirectTo: 'search', pathMatch: 'full' },
//     { path: 'search', component: SearchComponent },
//     { path: '**', redirectTo: 'search' }

    //Liste d'articles: examine par lots de 5 articles il attend 61s après chaque lot pour 'soulager le LLM'.
    { path: '', redirectTo: 'searchListLots', pathMatch: 'full' },
    { path: 'searchListLots', component: SearchListLotsComponent },
    { path: '**', redirectTo: 'searchListLots'}

    ///////////////////
    // Liste d'articles
    // { path: '', redirectTo: 'searchList', pathMatch: 'full' },
    // { path: 'searchList', component: SearchListComponent },
    // { path: '**', redirectTo: 'searchList' }
];