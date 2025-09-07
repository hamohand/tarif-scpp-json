import {Component, OnInit} from '@angular/core';
import {Article} from "../objets/articles";
import {DataLoaderService} from "../../app/services/data-loader.service";
import {NgForOf} from "@angular/common";

@Component({
  selector: 'app-load-data01',
  standalone: true,
  imports: [
    NgForOf
  ],
  //templateUrl: './load-data01.component.html',
  template: `
    <h2>Liste des articles</h2>
    <ul>
      <li *ngFor="let article of articles">
        {{ article.article }} - {{ article.code }}
      </li>
    </ul>
  `,

  styleUrl: './load-data01.component.css'
})
export class LoadData01Component {
  articles: Article[] = [];

  constructor(private dataLoader: DataLoaderService) { }
}
