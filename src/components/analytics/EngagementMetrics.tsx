import { EngagementMetrics as EngagementMetricsType, formatDuration } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, MousePointerClick, TrendingUp, MapPin, Clock, Calendar } from "lucide-react";

interface EngagementMetricsProps {
  metrics: EngagementMetricsType;
}

export const EngagementMetrics = ({ metrics }: EngagementMetricsProps) => {
  const formatHour = (hour: number | undefined) => {
    if (hour === undefined) return "N/A";
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {/* Total Impressions */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Impressions</p>
          </div>
          <p className="text-2xl font-bold text-primary">{metrics.totalImpressions.toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* Total QR Scans */}
      <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MousePointerClick className="h-4 w-4 text-accent" />
            <p className="text-xs text-muted-foreground">QR Scans</p>
          </div>
          <p className="text-2xl font-bold text-accent">{metrics.totalQRScans.toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* Click-Through Rate */}
      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-xs text-muted-foreground">CTR</p>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {metrics.overallCTR.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      {/* Average Duration */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-muted-foreground">Avg Duration</p>
          </div>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatDuration(metrics.avgDuration)}
          </p>
        </CardContent>
      </Card>

      {/* Total Reach */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <p className="text-xs text-muted-foreground">Total Reach</p>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {metrics.totalReach}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.totalVenues} venues
          </p>
        </CardContent>
      </Card>

      {/* Peak Performance */}
      <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <p className="text-xs text-muted-foreground">Peak Time</p>
          </div>
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {formatHour(metrics.peakHour)}
          </p>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {formatDate(metrics.peakDay)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
