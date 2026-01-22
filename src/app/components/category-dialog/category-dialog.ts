import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/category.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { CATEGORY_ICONS, AVAILABLE_ICON_NAMES } from '../../core/utils/icon-utils';

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './category-dialog.html',
  styleUrl: './category-dialog.scss'
})
export class CategoryDialogComponent implements OnInit {
  @Input() category: Category | null = null;
  @Input() nextOrder: number = 0;
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);

  form!: FormGroup;
  loading = false;
  faTimes = faTimes;
  faSpinner = faSpinner;

  iconList = AVAILABLE_ICON_NAMES;
  categoryIcons = CATEGORY_ICONS;

  ngOnInit() {
    this.form = this.fb.group({
      name: [this.category?.name || '', Validators.required],
      icon: [this.category?.icon || 'tag'],
      order: [this.category?.order ?? this.nextOrder]
    });
  }

  selectIcon(iconName: string) {
    this.form.patchValue({ icon: iconName });
  }

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;

    try {
      if (this.category?.id) {
        await this.categoryService.updateCategory(this.category.id, this.form.value);
      } else {
        await this.categoryService.addCategory(this.form.value);
      }
      this.close.emit();
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  cancel() {
    this.close.emit();
  }
}
