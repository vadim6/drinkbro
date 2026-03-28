import { notFound } from "next/navigation";
import BaristaView from "./BaristaView";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (process.env.HASH_SLUG && slug !== process.env.HASH_SLUG) notFound();
  return <BaristaView slug={slug} />;
}
