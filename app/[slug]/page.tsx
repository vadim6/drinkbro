import { redirect } from "next/navigation";

export default async function SlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/drink/${slug}`);
}
