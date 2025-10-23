import { useState } from "react";
import { MediaPerformance, formatDuration } from "@/lib/analytics";
import { MediaFile } from "@/lib/campaigns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MediaThumbnail from "@/components/MediaThumbnail";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface MediaPerformanceTableProps {
  mediaPerformance: MediaPerformance[];
  campaignMedia: MediaFile[];
}

type SortField = "impressions" | "scans" | "ctr" | "engagementScore";
type SortDirection = "asc" | "desc";

export const MediaPerformanceTable = ({
  mediaPerformance,
  campaignMedia,
}: MediaPerformanceTableProps) => {
  const [sortField, setSortField] = useState<SortField>("engagementScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedData = [...mediaPerformance].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    return (a[sortField] - b[sortField]) * multiplier;
  });

  const getMediaFile = (mediaId: string) => {
    return campaignMedia.find((m) => m.id === mediaId);
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {label}
      {sortField === field ? (
        sortDirection === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </button>
  );

  if (mediaPerformance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Media Performance</CardTitle>
          <CardDescription>No media performance data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media Performance Breakdown</CardTitle>
        <CardDescription>
          Detailed analytics for each media file (click headers to sort)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="pb-3 pr-4">Media</th>
                <th className="pb-3 pr-4">
                  <SortButton field="impressions" label="Impressions" />
                </th>
                <th className="pb-3 pr-4">
                  <SortButton field="scans" label="QR Scans" />
                </th>
                <th className="pb-3 pr-4">
                  <SortButton field="ctr" label="CTR" />
                </th>
                <th className="pb-3 pr-4">Avg Duration</th>
                <th className="pb-3">
                  <SortButton field="engagementScore" label="Score" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedData.map((media) => {
                const mediaFile = getMediaFile(media.mediaId);
                return (
                  <tr key={media.mediaId} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                          {mediaFile ? (
                            <MediaThumbnail
                              mediaId={mediaFile.id}
                              mediaName={mediaFile.name}
                              mediaType={mediaFile.type}
                              url={mediaFile.url}
                              storedInIndexedDB={mediaFile.storedInIndexedDB}
                              duration={mediaFile.duration}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              No preview
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate text-sm">
                            {mediaFile?.name || media.mediaId.substring(0, 12) + "..."}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {mediaFile?.type || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-semibold text-primary">
                        {media.impressions.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-semibold text-accent">
                        {media.qrScans.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {media.ctr.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm">
                      {formatDuration(media.avgDuration)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[100px] bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${Math.min(media.engagementScore, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {media.engagementScore.toFixed(0)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
