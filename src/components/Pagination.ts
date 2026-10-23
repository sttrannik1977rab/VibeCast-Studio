/**
 * Компонент пагинации.
 * 
 * Отображает кнопки страниц и кнопку "Все".
 * Не рендерится, если всего одна страница.
 */

import { el } from "redom";

export interface PaginationOptions {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

export class Pagination {
    public el: HTMLElement;

    private totalPages: number;
    private currentPage: number;
    private onPageChange: (page: number) => void;

    constructor(options: PaginationOptions) {
        this.totalPages = Math.ceil(options.totalItems / options.itemsPerPage);
        this.currentPage = options.currentPage;
        this.onPageChange = options.onPageChange;

        this.el = this.createPagination();
    }

    private createPagination(): HTMLElement {
        if (this.totalPages <= 1) {
            return el('div');
        }

        const buttons: HTMLElement[] = [];

        for (let i = 1; i <= this.totalPages; i++) {
            const button = el('button.pagination__btn', {
                onclick: () => {
                    if (i !== this.currentPage) {
                        this.onPageChange(i);
                    }
                },
            }, String(i));

            if (i === this.currentPage) {
                button.classList.add('pagination__btn--active');
            }

            buttons.push(button);
        }

        const allBtn = el('button.pagination__btn.pagination__btn--all', {
            onclick: () => {
                if (this.currentPage !== 0) {
                    this.onPageChange(0);
                }
            },
        }, 'Все');

        if (this.currentPage === 0) {
            allBtn.classList.add('pagination__btn--active');
        }

        buttons.push(allBtn);

        return el('div.pagination', buttons);
    }
}