import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="p-2 rounded-lg border border-border hover:border-green-accent disabled:opacity-30 disabled:cursor-default transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-text-secondary">
        Page <span className="text-white font-semibold">{page}</span> of{" "}
        {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="p-2 rounded-lg border border-border hover:border-green-accent disabled:opacity-30 disabled:cursor-default transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
