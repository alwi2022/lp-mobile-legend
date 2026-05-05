import { PublicBracketPage } from "../../components/public/public-pages";
import { getPublicHomepageData } from "../../lib/public/homepage";

export const dynamic = "force-dynamic";

export default async function BracketPage() {
  const initialData = await getPublicHomepageData();

  return <PublicBracketPage initialData={initialData} />;
}
