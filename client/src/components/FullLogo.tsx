import { Link } from "react-router-dom";
import { COMPANY } from "../lib/constants";
import { TimelessLogoFullMark } from "./TimelessLogoFullMark";

interface FullLogoProps {
  className?: string;
  linkToHome?: boolean;
}

export default function FullLogo({
  className,
  linkToHome = false,
}: FullLogoProps) {
  const mark = (
    <TimelessLogoFullMark
      className={className}
      aria-hidden={linkToHome ? undefined : true}
      aria-label={linkToHome ? COMPANY.name : undefined}
      role={linkToHome ? "img" : undefined}
    />
  );

  if (linkToHome) {
    return (
      <Link
        to="/"
        className="inline-flex shrink-0 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-green-accent"
      >
        {mark}
      </Link>
    );
  }

  return mark;
}
