import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildBaseSeoSlug,
  fetchSlugAvailability,
  isValidSeoSlug,
} from "../../lib/admin/productSlug";
import { useDebouncedValue } from "../useDebouncedValue";

export type SlugSource = "auto" | "manual";
export type SlugStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid";

const SLUG_CHECK_DELAY_MS = 300;

export function useProductSeoSlug({
  partNumber,
  manufacturer,
  productId,
  initialSlug = "",
  isEdit,
}: {
  partNumber: string;
  manufacturer: string;
  productId?: string;
  initialSlug?: string;
  isEdit: boolean;
}) {
  const [slugSource, setSlugSource] = useState<SlugSource>(
    isEdit ? "manual" : "auto",
  );
  const [seoSlug, setSeoSlug] = useState(initialSlug);
  const [status, setStatus] = useState<SlugStatus>("idle");

  const baseSlug = useMemo(
    () => buildBaseSeoSlug(manufacturer, partNumber),
    [manufacturer, partNumber],
  );

  const rawCandidate =
    slugSource === "auto" ? baseSlug : seoSlug.trim();

  const debouncedCandidate = useDebouncedValue(rawCandidate, SLUG_CHECK_DELAY_MS, {
    initial:
      slugSource === "auto" ? "" : isEdit ? initialSlug.trim() : "",
  });

  const requestId = useRef(0);
  const slugSourceRef = useRef(slugSource);
  slugSourceRef.current = slugSource;

  const resolveSlug = useCallback(
    async (candidate: string) => {
      if (!candidate) {
        setStatus("idle");
        setSeoSlug("");
        return;
      }
      if (!isValidSeoSlug(candidate)) {
        setStatus("invalid");
        setSeoSlug(candidate);
        return;
      }

      const id = ++requestId.current;
      setStatus("checking");
      try {
        const result = await fetchSlugAvailability(candidate, productId);
        if (id !== requestId.current) return;

        if (result.available) {
          setSeoSlug(candidate);
          setStatus("available");
          return;
        }

        const next = result.suggestion;
        if (slugSourceRef.current === "auto") {
          setSeoSlug(next);
          setStatus("available");
        } else {
          setSeoSlug(candidate);
          setStatus("taken");
        }
      } catch {
        if (id !== requestId.current) return;
        setStatus("invalid");
      }
    },
    [productId],
  );

  useEffect(() => {
    if (slugSource === "manual" && !debouncedCandidate) {
      setStatus("idle");
      return;
    }
    void resolveSlug(debouncedCandidate);
  }, [debouncedCandidate, slugSource, resolveSlug]);

  useEffect(() => {
    requestId.current += 1;
    setSlugSource(isEdit ? "manual" : "auto");
    setSeoSlug(initialSlug);
    setStatus(initialSlug ? "idle" : "idle");
  }, [productId, isEdit, initialSlug]);

  const regenerate = useCallback(() => {
    setSlugSource("auto");
  }, []);

  const canSubmit =
    !!seoSlug &&
    isValidSeoSlug(seoSlug) &&
    status !== "checking" &&
    status !== "invalid" &&
    status !== "taken" &&
    (status === "available" || (isEdit && seoSlug === initialSlug));

  return {
    seoSlug,
    setSeoSlug,
    slugSource,
    setSlugSource,
    status,
    regenerate,
    baseSlug,
    canSubmit,
  };
}
