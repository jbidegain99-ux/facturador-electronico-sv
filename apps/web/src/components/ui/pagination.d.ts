import * as React from 'react';
interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    showing: number;
    onPageChange: (page: number) => void;
}
export declare function Pagination({ page, totalPages, total, showing, onPageChange }: PaginationProps): React.JSX.Element;
export {};
//# sourceMappingURL=pagination.d.ts.map