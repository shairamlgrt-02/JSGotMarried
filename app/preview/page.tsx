import Site from "@/components/public/Site";
import SocialShell from "@/components/public/SocialShell";
import { weddingInfo } from "@/lib/site-meta";

/**
 * The public preview of the invitation — safe to share with anyone.
 * Nothing private is here: the venue, the programme and the FAQ are not rendered, and the server
 * withholds those fields for this page anyway (see lib/invite-gate.ts).
 */
export const dynamic = "force-dynamic";

export default async function PreviewPage() {
  const info = await weddingInfo();
  return (
    <SocialShell info={info} active="program">
      <Site variant="preview" />
    </SocialShell>
  );
}
