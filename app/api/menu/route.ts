import { menu } from "@/lib/menu";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(menu);
}
