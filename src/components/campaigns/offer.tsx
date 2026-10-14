import { Tag } from "lucide-react";
import { bdt } from "@/content/site";
import { offerNotes, type CampaignOffer, type CampaignOffers } from "@/lib/validation/coupon";
import { cn } from "@/lib/cn";

/** A fee. When a displayed coupon lowers it: the new price large and bold, the listed
 *  price small and struck through, and a pill with the saving. */
export function OfferPrice({
  listed,
  offer,
  size = "md",
  className,
}: {
  listed: number;
  /** A displayed offer, or an applied coupon quote: both carry these two. */
  offer?: Pick<CampaignOffer, "finalFee" | "discount"> | null;
  size?: "md" | "lg";
  className?: string;
}) {
  if (!offer) return <span className={cn("font-mono", className)}>{bdt(listed)}</span>;

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <span
        className={cn(
          "font-mono font-semibold tracking-tight text-accent-ink",
          size === "lg" ? "text-xl" : "text-base",
        )}
      >
        {bdt(offer.finalFee)}
      </span>
      <s className="font-mono text-xs text-muted decoration-muted">{bdt(listed)}</s>
      <span className="inline-flex h-5 items-center rounded-full bg-accent px-2 label-xs text-accent-fg">
        Save {bdt(offer.discount)}
      </span>
    </span>
  );
}

/** Who the advertised prices are for, and the code when the admin chose to show it. */
export function OfferNotes({ offers, className }: { offers?: CampaignOffers; className?: string }) {
  const notes = offerNotes(offers);
  if (notes.length === 0) return null;

  return (
    <ul className={cn("space-y-2", className)}>
      {notes.map((note) => (
        <li
          key={`${note.code ?? ""}|${note.message}`}
          className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-fg"
        >
          <Tag aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-ink" />
          <span>
            {note.message}
            {note.code && (
              <span className="text-muted">
                {" "}
                · Use code <span className="font-mono text-fg">{note.code}</span>
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
