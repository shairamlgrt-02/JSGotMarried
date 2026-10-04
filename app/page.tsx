import { redirect } from "next/navigation";
import Hub from "@/components/public/Hub";
import { cleanCode } from "@/lib/guests";
import { weddingInfo } from "@/lib/site-meta";

export const dynamic = "force-dynamic";

/**
 * The front door: a quiet hub with two links — the invitation preview and the code-locked RSVP —
 * and room left for the day-of games and raffles. The invitation itself never lives here, so a
 * link pasted into a group chat shows the design without the venue, the programme or the reply card.
 *
 * Links already sent as `…/?rsvp=JS-7KQF` keep working: they land on the household's own page.
 */
export default async function HomePage({ searchParams }: { searchParams?: { rsvp?: string | string[] } }) {
  const raw = Array.isArray(searchParams?.rsvp) ? searchParams.rsvp[0] : searchParams?.rsvp;
  const code = cleanCode(raw || "");
  if (code) redirect(`/${code}`);
  return <Hub info={await weddingInfo()} />;
}
