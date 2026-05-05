import { getPublicHomepageData } from "../lib/public/homepage";
import { PublicHomePage } from "../components/public/public-pages";

export const dynamic = "force-dynamic";

export default async function Page() {
  const initialData = await getPublicHomepageData();

  return <PublicHomePage initialData={initialData} />;
}
