import { PublicStreamsPage } from "../../components/public/public-pages";
import { getPublicHomepageData } from "../../lib/public/homepage";

export const dynamic = "force-dynamic";

export default async function StreamsPage() {
  const initialData = await getPublicHomepageData();

  return <PublicStreamsPage initialData={initialData} />;
}
