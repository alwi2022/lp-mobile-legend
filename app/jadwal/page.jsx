import { PublicSchedulePage } from "../../components/public/public-pages";
import { getPublicHomepageData } from "../../lib/public/homepage";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const initialData = await getPublicHomepageData();

  return <PublicSchedulePage initialData={initialData} />;
}
