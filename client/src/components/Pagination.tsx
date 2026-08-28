import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /**
   * Build the URL for a page. When supplied, the controls render as real
   * anchors so crawlers can walk the whole list instead of seeing only the
   * first page. Omit it for admin screens, which are not indexed.
   */
  hrefForPage?: (page: number) => string;
}

const CONTROL_CLASS =
  "p-2 rounded-lg border border-border hover:border-green-accent transition-colors";
const DISABLED_CLASS = "p-2 rounded-lg border border-border opacity-30";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  hrefForPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  function control(target: number, disabled: boolean, label: string, icon: React.ReactNode) {
    if (disabled) {
      return (
        <span className={DISABLED_CLASS} aria-disabled="true" aria-label={label}>
          {icon}
        </span>
      );
    }
    if (hrefForPage) {
      return (
        <Link
          to={hrefForPage(target)}
          aria-label={label}
          className={CONTROL_CLASS}
          onClick={(e) => {
            e.preventDefault();
            onPageChange(target);
          }}
        >
          {icon}
        </Link>
      );
    }
    return (
      <button
        type="button"
        aria-label={label}
        onClick={() => onPageChange(target)}
        className={CONTROL_CLASS}
      >
        {icon}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      {control(prev, atStart, "Previous page", <ChevronLeft size={16} />)}
      <span className="text-sm text-text-secondary">
        Page <span className="text-white font-semibold">{page}</span> of{" "}
        {totalPages}
      </span>
      {control(next, atEnd, "Next page", <ChevronRight size={16} />)}
    </div>
  );
}
