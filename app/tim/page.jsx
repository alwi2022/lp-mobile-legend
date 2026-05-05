import { PublicTeamsPage } from "../../components/public/public-pages";
import { getPublicHomepageData } from "../../lib/public/homepage";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const initialData = await getPublicHomepageData();

  return <PublicTeamsPage initialData={initialData} />;
}
