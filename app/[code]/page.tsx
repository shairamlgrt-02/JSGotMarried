import Site from "@/components/public/Site";

/** Personal invitation links: jsgotmarried…/JS-7KQF unseals the private pages and the reply card. */
export default function InvitePage({ params }: { params: { code: string } }) {
  return <Site code={params.code} />;
}
