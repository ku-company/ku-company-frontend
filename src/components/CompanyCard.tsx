import Image from "next/image";
import Link from "next/link";

type Company = {
  id: string;
  name: string;
  number: string;
  logo: string;    // Path to logo image inside /public
  accent?: string; 
};

export default function CompanyCard({ company }: { company: Company }) {
  return (
    <div className="group relative rounded-2xl border bg-white shadow-sm overflow-hidden">
      {/* Image container: fixed height, relative for Next.js Image with 'fill' */}
      <div className={`relative h-48 ${company.accent ?? "bg-gray-50"} overflow-hidden`}>
        {/* Next.js Image with 'fill' makes it cover the parent container.
            'object-contain' keeps aspect ratio so the logo never overflows.
            'p-6' adds padding so the logo doesn't stick to the edges. */}
        <Image
          src={company.logo}
          alt={company.name}
          fill
          className="object-contain p-6"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>

      {/* Company name and "View More" link below the image */}
      <div className="p-4">
        <div className="font-semibold text-gray-800 truncate">{company.name}</div>
        <Link
          href={`/company/${company.id}`}
          className="mt-2 inline-block text-xs text-emerald-700 hover:underline"
        >
          VIEW MORE   
        </Link>
      </div>
    </div>
  );
}
