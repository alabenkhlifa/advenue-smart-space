import { VenuePerformance, formatDuration } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp } from "lucide-react";

interface VenueInsightsProps {
  venuePerformance: VenuePerformance[];
}

export const VenueInsights = ({ venuePerformance }: VenueInsightsProps) => {
  if (venuePerformance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Venue Insights</CardTitle>
          <CardDescription>No venue data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Venue Performance</CardTitle>
        <CardDescription>
          Where your ads are getting the most traction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {venuePerformance.map((venue, index) => (
            <div
              key={venue.venueId}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              {/* Rank Badge */}
              <div className="flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                      : index === 1
                      ? "bg-gray-400/20 text-gray-600 dark:text-gray-400"
                      : index === 2
                      ? "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
              </div>

              {/* Venue Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-foreground truncate">
                      {venue.venueName || `Venue ${venue.venueId.substring(0, 8)}`}
                    </h4>
                    {(venue.city || venue.region) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {[venue.city, venue.region].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                  {venue.ctr > 0 && (
                    <Badge
                      variant={venue.ctr > 5 ? "default" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      <TrendingUp className="h-3 w-3" />
                      {venue.ctr.toFixed(2)}% CTR
                    </Badge>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Impressions</p>
                    <p className="text-lg font-bold text-primary">
                      {venue.impressions.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">QR Scans</p>
                    <p className="text-lg font-bold text-accent">
                      {venue.qrScans.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatDuration(venue.duration)}
                    </p>
                  </div>
                </div>

                {/* Performance Bar */}
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span>Engagement</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (venue.impressions / venuePerformance[0].impressions) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {venuePerformance.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No venue data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
