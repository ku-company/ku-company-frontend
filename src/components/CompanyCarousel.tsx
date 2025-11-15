"use client";

import { useMemo, useState } from "react";
import type { TopCompany } from "@/api/home";
import CompanyCard from "./CompanyCard";

type Props = {
  companies: TopCompany[];
};

const VISIBLE_COUNT = 3;

function getVisibleCompanies(list: TopCompany[], start: number) {
  if (list.length === 0) return [];
  const result: TopCompany[] = [];
  for (let i = 0; i < Math.min(VISIBLE_COUNT, list.length); i += 1) {
    const item = list[(start + i) % list.length];
    if (item) result.push(item);
  }
  return result;
}

export default function CompanyCarousel({ companies }: Props) {
  const [index, setIndex] = useState(0);
  const total = companies.length;
  const canSlide = total > VISIBLE_COUNT;

  const visibleCompanies = useMemo(() => getVisibleCompanies(companies, index), [companies, index, companies.length]);

  const go = (direction: "prev" | "next") => {
    if (!canSlide) return;
    setIndex((prev) => {
      if (direction === "prev") {
        return prev === 0 ? total - 1 : prev - 1;
      }
      return prev === total - 1 ? 0 : prev + 1;
    });
  };

  const gridCols =
    visibleCompanies.length === 1 ? "grid-cols-1" : visibleCompanies.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-3";

  return (
    <div className="relative">
      <div className={`grid gap-5 ${gridCols}`}>
        {visibleCompanies.map((company) => (
          <CompanyCard key={`${company.id}-${company.user_id ?? "n"}`} company={company} />
        ))}
      </div>

      {canSlide && (
        <>
          <button
            type="button"
            onClick={() => go("prev")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white text-emerald-700 shadow ring-1 ring-emerald-100 hover:bg-emerald-50"
            aria-label="Previous companies"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go("next")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white text-emerald-700 shadow ring-1 ring-emerald-100 hover:bg-emerald-50"
            aria-label="Next companies"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
