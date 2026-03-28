import { notFound, redirect } from "next/navigation";

export default function Home() {
  if (process.env.HASH_SLUG) notFound();
  redirect("/drink");
}
