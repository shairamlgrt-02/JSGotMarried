import Site from "@/components/public/Site";
import { DEMO_CODE } from "@/lib/db";

/** Perpetual self-test door: the full guest journey with throwaway demo data. */
export default function TestPage() {
  return <Site code={DEMO_CODE} />;
}
