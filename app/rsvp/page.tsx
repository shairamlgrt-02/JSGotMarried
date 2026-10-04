import CodeGate from "@/components/public/CodeGate";
import { weddingInfo } from "@/lib/site-meta";

export const dynamic = "force-dynamic";

/**
 * The RSVP door is locked: `…/rsvp` asks for the invitation code (the last four characters of
 * the link the couple sent is enough) and hands the guest to their own personal page. A link that
 * already carries the code — `…/rsvp?code=JS-7KQF` — opens it in one tap.
 */
export default async function RsvpGatePage({ searchParams }: { searchParams?: { code?: string | string[] } }) {
  const raw = Array.isArray(searchParams?.code) ? searchParams.code[0] : searchParams?.code;
  return <CodeGate info={await weddingInfo()} initialCode={(raw || "").trim()} />;
}
