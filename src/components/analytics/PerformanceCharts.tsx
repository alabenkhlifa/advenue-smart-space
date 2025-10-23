import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignAnalytics, TimeOfDayAnalytics, MediaPerformance, VenuePerformance } from "@/lib/analytics";

interface PerformanceChartsProps {
  dailyData: CampaignAnalytics["dailyBreakdown"];
  hourlyData: TimeOfDayAnalytics[];
  mediaData: MediaPerformance[];
  venueData: VenuePerformance[];
}

export const PerformanceCharts = ({
  dailyData,
  hourlyData,
  mediaData,
  venueData,
}: PerformanceChartsProps) => {
  // Transform daily data for chart
  const dailyChartData = Object.entries(dailyData)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      impressions: data.impressions,
      scans: data.qrScans,
    }));

  // Transform hourly data for chart
  const hourlyChartData = hourlyData.map((data) => ({
    hour: `${data.hour}:00`,
    impressions: data.impressions,
    scans: data.qrScans,
  }));

  // Transform media data for chart (top 10)
  const mediaChartData = mediaData.slice(0, 10).map((media, index) => ({
    name: `Media ${index + 1}`,
    mediaId: media.mediaId,
    impressions: media.impressions,
    scans: media.qrScans,
    ctr: media.ctr,
  }));

  // Transform venue data for chart (top 10)
  const venueChartData = venueData.slice(0, 10).map((venue) => ({
    name: venue.venueName || `Venue ${venue.venueId.substring(0, 8)}`,
    impressions: venue.impressions,
    scans: venue.qrScans,
    ctr: venue.ctr,
  }));

  return (
    <div className="space-y-6">
      {/* Daily Performance Trend */}
      {dailyChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>Daily impressions and QR scans</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                />
                <YAxis className="text-xs" tick={{ fill: "currentColor" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Impressions"
                  dot={{ fill: "hsl(var(--primary))" }}
                />
                <Line
                  type="monotone"
                  dataKey="scans"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  name="QR Scans"
                  dot={{ fill: "hsl(var(--accent))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Media Performance Comparison */}
      {mediaChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Media Performance</CardTitle>
            <CardDescription>Top performing media files by engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mediaChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                />
                <YAxis className="text-xs" tick={{ fill: "currentColor" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="impressions"
                  fill="hsl(var(--primary))"
                  name="Impressions"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="scans"
                  fill="hsl(var(--accent))"
                  name="QR Scans"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Venue Performance */}
      {venueChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Venue Performance</CardTitle>
            <CardDescription>Top performing venues by impressions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={venueChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" tick={{ fill: "currentColor" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="impressions"
                  fill="hsl(var(--primary))"
                  name="Impressions"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="scans"
                  fill="hsl(var(--accent))"
                  name="QR Scans"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Hourly Performance Pattern */}
      {hourlyChartData.some((d) => d.impressions > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Time of Day Performance</CardTitle>
            <CardDescription>Hourly activity pattern</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="hour"
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                />
                <YAxis className="text-xs" tick={{ fill: "currentColor" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="impressions"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  name="Impressions"
                />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="hsl(var(--accent))"
                  fill="hsl(var(--accent))"
                  fillOpacity={0.3}
                  name="QR Scans"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
