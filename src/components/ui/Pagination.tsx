import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <button 
        className="pagination-btn" 
        disabled={currentPage <= 1} 
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft size={16} /> Trang trước
      </button>
      <span className="pagination-info">
        Trang {currentPage} / {totalPages}
      </span>
      <button 
        className="pagination-btn" 
        disabled={currentPage >= totalPages} 
        onClick={() => onPageChange(currentPage + 1)}
      >
        Sau <ChevronRight size={16} />
      </button>
    </div>
  );
}
