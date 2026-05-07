import { getTodaysTopNews } from "@/lib/actions/articles";
import { TopNewsList } from "@/components/top-news/top-news-list";
import { format } from "date-fns";
import { toAppTime } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function TopNewsPage() {
  const todaysTopNews = await getTodaysTopNews();
  const todayFormatted = format(toAppTime(new Date()), "MMM d, yyyy");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Top News: {todayFormatted}
        </h2>
        <p className="text-muted-foreground">
          Today&apos;s featured articles for the newsletter
        </p>
      </div>

      <TopNewsList
        nonSponsoredItem={todaysTopNews.nonSponsored}
        sponsoredItem={todaysTopNews.sponsored}
      />
    </div>
  );
}
