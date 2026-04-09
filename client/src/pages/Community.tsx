import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Rss,
  Trash2,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  imageUrl: string | null;
}

interface BookmarkItem {
  id: string;
  userId: string;
  title: string;
  url: string;
  description: string | null;
  source: string | null;
  imageUrl: string | null;
  createdAt: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ArticleCard({
  title,
  link,
  description,
  pubDate,
  source,
  imageUrl,
  isSaved,
  onSave,
  onUnsave,
  savePending,
}: FeedItem & { isSaved: boolean; onSave: () => void; onUnsave: () => void; savePending: boolean }) {
  return (
    <Card className="overflow-hidden border border-border bg-card/50 hover:bg-card transition-colors" data-testid={`card-article-${encodeURIComponent(link)}`}>
      {imageUrl && (
        <div className="h-32 sm:h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            data-testid={`img-article-${encodeURIComponent(link)}`}
          />
        </div>
      )}
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs font-normal" data-testid={`badge-source-${encodeURIComponent(link)}`}>
            <Rss className="h-3 w-3 mr-1" />
            {source}
          </Badge>
          {pubDate && (
            <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-date-${encodeURIComponent(link)}`}>
              <Calendar className="h-3 w-3" />
              {formatDate(pubDate)}
            </span>
          )}
        </div>

        <h3 className="font-serif text-lg font-bold leading-snug line-clamp-2" data-testid={`text-title-${encodeURIComponent(link)}`}>
          {title}
        </h3>

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-desc-${encodeURIComponent(link)}`}>
            {description}
          </p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            asChild
            data-testid={`button-read-${encodeURIComponent(link)}`}
          >
            <a href={link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Read Article
            </a>
          </Button>
          <Button
            variant={isSaved ? "default" : "outline"}
            size="sm"
            onClick={isSaved ? onUnsave : onSave}
            disabled={savePending}
            data-testid={`button-save-${encodeURIComponent(link)}`}
          >
            {isSaved ? <BookmarkCheck className="h-3.5 w-3.5 mr-1.5" /> : <Bookmark className="h-3.5 w-3.5 mr-1.5" />}
            {isSaved ? "Saved" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SavedCard({ bookmark, onDelete, deletePending }: { bookmark: BookmarkItem; onDelete: () => void; deletePending: boolean }) {
  return (
    <Card className="overflow-hidden border border-border bg-card/50 hover:bg-card transition-colors" data-testid={`card-bookmark-${bookmark.id}`}>
      {bookmark.imageUrl && (
        <div className="h-32 sm:h-48 overflow-hidden">
          <img
            src={bookmark.imageUrl}
            alt={bookmark.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          {bookmark.source && (
            <Badge variant="secondary" className="text-xs font-normal">
              <Rss className="h-3 w-3 mr-1" />
              {bookmark.source}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(bookmark.createdAt)}
          </span>
        </div>

        <h3 className="font-serif text-lg font-bold leading-snug line-clamp-2">
          {bookmark.title}
        </h3>

        {bookmark.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {bookmark.description}
          </p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            asChild
            data-testid={`button-read-bookmark-${bookmark.id}`}
          >
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Read Article
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={deletePending}
            className="text-destructive hover:text-destructive"
            data-testid={`button-delete-bookmark-${bookmark.id}`}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden border border-border">
          <Skeleton className="h-48 w-full" />
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Community() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"feed" | "saved">("feed");

  const { data: feedItems = [], isLoading: feedLoading } = useQuery<FeedItem[]>({
    queryKey: ["/api/community/feed"],
  });

  const { data: savedBookmarks = [], isLoading: bookmarksLoading } = useQuery<BookmarkItem[]>({
    queryKey: ["/api/bookmarks"],
  });

  const savedUrls = new Set(savedBookmarks.map((b) => b.url));

  const saveMutation = useMutation({
    mutationFn: async (item: FeedItem) => {
      const res = await apiRequest("POST", "/api/bookmarks", {
        title: item.title,
        url: item.link,
        description: item.description,
        source: item.source,
        imageUrl: item.imageUrl,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({ title: "Article Saved", description: "Added to your saved articles." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save article. Please try again.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/bookmarks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({ title: "Removed", description: "Article removed from saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove article.", variant: "destructive" });
    },
  });

  const handleUnsave = (link: string) => {
    const bookmark = savedBookmarks.find((b) => b.url === link);
    if (bookmark) deleteMutation.mutate(bookmark.id);
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-2xl">
          <h1 className="font-serif text-4xl font-bold mb-3" data-testid="text-community-title">Community Feed</h1>
          <p className="text-muted-foreground text-lg" data-testid="text-community-subtitle">
            Curated travel stories and tips from top travel blogs around the world.
          </p>
        </div>

        <div className="flex gap-2 border-b border-border pb-1">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-md ${
              activeTab === "feed"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("feed")}
            data-testid="tab-feed"
          >
            <Rss className="h-4 w-4 inline mr-1.5" />
            Latest Articles
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-md ${
              activeTab === "saved"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("saved")}
            data-testid="tab-saved"
          >
            <Bookmark className="h-4 w-4 inline mr-1.5" />
            Saved ({savedBookmarks.length})
          </button>
        </div>

        {activeTab === "feed" && (
          <>
            {feedLoading ? (
              <FeedSkeleton />
            ) : feedItems.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground" data-testid="text-feed-empty">
                <Rss className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No articles available</p>
                <p className="text-sm">Check back later for fresh travel content.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="grid-feed">
                {feedItems.map((item) => (
                  <ArticleCard
                    key={item.link}
                    {...item}
                    isSaved={savedUrls.has(item.link)}
                    onSave={() => saveMutation.mutate(item)}
                    onUnsave={() => handleUnsave(item.link)}
                    savePending={saveMutation.isPending || deleteMutation.isPending}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "saved" && (
          <>
            {bookmarksLoading ? (
              <FeedSkeleton />
            ) : savedBookmarks.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground" data-testid="text-saved-empty">
                <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No saved articles yet</p>
                <p className="text-sm">Save articles from the feed to read them later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="grid-saved">
                {savedBookmarks.map((bookmark) => (
                  <SavedCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    onDelete={() => deleteMutation.mutate(bookmark.id)}
                    deletePending={deleteMutation.isPending}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
