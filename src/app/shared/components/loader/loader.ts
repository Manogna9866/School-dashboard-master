import { Component, inject } from '@angular/core';
import { LoaderService } from '../../../core/services/loader';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  imports: [CommonModule],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class LoaderComponent {
  loader = inject(LoaderService);
}
