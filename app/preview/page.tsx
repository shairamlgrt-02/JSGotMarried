import Site from "@/components/public/Site";

/**
 * The public preview of the invitation — safe to share with anyone.
 *
 * Nothing private is here: the venue, the programme and the FAQ are not rendered, and the server
 * withholds those fields for this page anyway (see lib/invite-gate.ts), so they are not merely
 * hidden in the markup. Signed-in in the binder? You see the finished site instead, with a note.
 */
export default function PreviewPage() {
  return <Site variant="preview" />;
}
