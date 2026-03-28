import { notFound } from "next/navigation";
import BaristaView from "./[slug]/BaristaView";

export default function Page() {
  if (process.env.HASH_SLUG) notFound();
  return <BaristaView slug="" />;
}
