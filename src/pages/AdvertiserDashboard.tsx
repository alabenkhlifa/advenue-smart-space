import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requireAuth, logout } from "@/lib/auth";
import {
  getAdvertiserCampaigns,
  updateCampaign,
  addMediaToCampaignWithBlob,
  removeMediaFromCampaign,
  validateMediaFile,
  formatWeeklySchedule,
  Campaign,
} from "@/lib/campaigns";
import { getMediaFile, blobToDataUrl } from "@/lib/mediaStorage";
import {
  getCampaignAnalytics,
  formatDuration,
  getMediaPerformance,
  getVenuePerformance,
  getHourlyAnalytics,
  getEngagementMetrics,
} from "@/lib/analytics";
import { getCampaignQRAnalytics } from "@/lib/qrAnalytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Upload, Play, Pause, BarChart3, X, QrCode, Calendar as CalendarIcon, Pencil } from "lucide-react";
import MediaThumbnail from "@/components/MediaThumbnail";
import { format } from "date-fns";
import { DateRangeFilter } from "@/components/analytics/DateRangeFilter";
import { EngagementMetrics } from "@/components/analytics/EngagementMetrics";
import { PerformanceCharts } from "@/components/analytics/PerformanceCharts";
import { MediaPerformanceTable } from "@/components/analytics/MediaPerformanceTable";
import { VenueInsights } from "@/components/analytics/VenueInsights";
import { ExportButton } from "@/components/analytics/ExportButton";

const AdvertiserDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>();
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>();

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDateRangeChange = (startDate: Date | undefined, endDate: Date | undefined) => {
    setDateRangeStart(startDate);
    setDateRangeEnd(endDate);
  };

  useEffect(() => {
    const currentUser = requireAuth("advertiser");
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setUser(currentUser);
    loadCampaigns(currentUser.id);
  }, [navigate]);

  const loadCampaigns = (advertiserId: string) => {
    const userCampaigns = getAdvertiserCampaigns(advertiserId);
    setCampaigns(userCampaigns);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCreateCampaign = () => {
    navigate("/dashboard/advertiser/create-campaign");
  };

  const handleEditCampaign = (campaignId: string) => {
    navigate(`/dashboard/advertiser/edit-campaign/${campaignId}`);
  };

  const handleMediaUpload = async (campaignId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateMediaFile(file);

      if (!validation.valid) {
        toast({
          variant: "destructive",
          title: "Invalid File",
          description: validation.error,
        });
        failCount++;
        continue;
      }

      try {
        // Use IndexedDB for storage
        await addMediaToCampaignWithBlob(campaignId, file);
        successCount++;
      } catch (error: any) {
        failCount++;

        // Check for storage quota exceeded
        if (error.name === 'QuotaExceededError' ||
            (error.message && error.message.includes('quota'))) {
          toast({
            variant: "destructive",
            title: "Storage Quota Exceeded",
            description: "Your browser storage is full. Please delete some existing media files to upload new ones.",
          });
          break; // Stop trying to upload more files
        } else {
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: `Failed to upload ${file.name}`,
          });
        }
      }
    }

    setUploadingMedia(false);
    loadCampaigns(user.id);

    if (successCount > 0) {
      toast({
        title: "Media Uploaded",
        description: `Successfully uploaded ${successCount} file(s).${failCount > 0 ? ` ${failCount} failed.` : ''}`,
      });
    }
  };

  const handleDeleteMedia = async (campaignId: string, mediaId: string, mediaName: string) => {
    if (window.confirm(`Delete "${mediaName}"?`)) {
      const success = await removeMediaFromCampaign(campaignId, mediaId);

      if (success) {
        loadCampaigns(user.id);
        toast({
          title: "Media Deleted",
          description: `"${mediaName}" has been removed.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: "Could not delete the media file.",
        });
      }
    }
  };

  const toggleCampaignStatus = (campaign: Campaign) => {
    const newStatus = campaign.status === "active" ? "paused" : "active";
    updateCampaign(campaign.id, { status: newStatus });
    loadCampaigns(user.id);
    toast({
      title: "Campaign Updated",
      description: `Campaign is now ${newStatus}.`,
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              AdVenue
            </h1>
            <p className="text-sm text-muted-foreground">Advertiser Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.companyName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">My Campaigns</h2>
              <Button variant="hero" onClick={handleCreateCampaign}>
                <Plus className="mr-2" size={18} />
                New Campaign
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover-lift">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{campaign.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditCampaign(campaign.id)}
                          title="Edit campaign"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Badge
                          variant={
                            campaign.status === "active" ? "success" :
                            campaign.status === "paused" ? "warning" :
                            "secondary"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {campaign.description}
                    </CardDescription>
                    {campaign.category && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {campaign.category}
                        </Badge>
                      </div>
                    )}

                    {/* Scheduling Summary */}
                    {(campaign.startDate || campaign.endDate || campaign.weeklySchedule) && (
                      <div className="mt-3 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CalendarIcon size={14} className="text-primary mt-0.5 flex-shrink-0" />
                          <div className="text-xs space-y-1">
                            {(campaign.startDate || campaign.endDate) && (
                              <div className="font-medium text-foreground">
                                {campaign.startDate && format(new Date(campaign.startDate), "MMM d, yyyy")}
                                {campaign.startDate && campaign.endDate && " - "}
                                {campaign.endDate && format(new Date(campaign.endDate), "MMM d, yyyy")}
                              </div>
                            )}
                            {campaign.weeklySchedule && (
                              <div className="text-muted-foreground">
                                {formatWeeklySchedule(campaign.weeklySchedule)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {campaign.targetUrl && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <QrCode size={16} className="text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Target URL:</p>
                          <a
                            href={campaign.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline truncate block"
                          >
                            {campaign.targetUrl}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Media Files:</span>
                      <span className="font-medium">{campaign.media.length}</span>
                    </div>

                    {campaign.media.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Uploaded Media</span>
                          <span>{campaign.media.length} file(s)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {campaign.media.map((media) => (
                            <div
                              key={media.id}
                              className="aspect-square relative"
                              title={media.name}
                            >
                              <MediaThumbnail
                                mediaId={media.id}
                                mediaName={media.name}
                                mediaType={media.type}
                                url={media.url}
                                storedInIndexedDB={media.storedInIndexedDB}
                                duration={media.duration}
                                className="w-full h-full"
                              />
                              {/* Delete Button - Always Visible */}
                              <button
                                onClick={() => handleDeleteMedia(campaign.id, media.id, media.name)}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform active:scale-95"
                                title="Delete media"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor={`upload-${campaign.id}`}>
                        <div className="flex items-center justify-center p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                          <Upload className="mr-2" size={18} />
                          <span>Upload Media</span>
                        </div>
                      </Label>
                      <Input
                        id={`upload-${campaign.id}`}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleMediaUpload(campaign.id, e.target.files)}
                        disabled={uploadingMedia}
                      />
                    </div>

                    <Button
                      variant={campaign.status === "active" ? "outline" : "hero"}
                      className="w-full"
                      onClick={() => toggleCampaignStatus(campaign)}
                    >
                      {campaign.status === "active" ? (
                        <>
                          <Pause className="mr-2" size={18} />
                          Pause Campaign
                        </>
                      ) : (
                        <>
                          <Play className="mr-2" size={18} />
                          Activate Campaign
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {campaigns.length === 0 && (
              <Card className="p-12 text-center">
                <BarChart3 className="mx-auto mb-4 text-muted-foreground" size={64} />
                <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first campaign to start advertising
                </p>
                <Button variant="hero" onClick={handleCreateCampaign}>
                  <Plus className="mr-2" size={18} />
                  Create Campaign
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-3xl font-bold">Campaign Analytics</h2>
              <DateRangeFilter onDateRangeChange={handleDateRangeChange} />
            </div>

            {campaigns.map((campaign) => {
              const analytics = getCampaignAnalytics(campaign.id, dateRangeStart, dateRangeEnd);
              const engagement = getEngagementMetrics(campaign.id, dateRangeStart, dateRangeEnd);
              const mediaPerf = getMediaPerformance(campaign.id, dateRangeStart, dateRangeEnd);
              const venuePerf = getVenuePerformance(campaign.id, dateRangeStart, dateRangeEnd);
              const hourlyData = getHourlyAnalytics(campaign.id, dateRangeStart, dateRangeEnd);

              return (
                <div key={campaign.id} className="space-y-6">
                  {/* Campaign Header */}
                  <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                          <CardTitle className="text-2xl">{campaign.name}</CardTitle>
                          <CardDescription className="mt-1">{campaign.description}</CardDescription>
                          {campaign.category && (
                            <Badge variant="outline" className="mt-2">
                              {campaign.category}
                            </Badge>
                          )}
                        </div>
                        <ExportButton campaignId={campaign.id} campaignName={campaign.name} />
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Engagement Metrics - Overview */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Overview</h3>
                    <EngagementMetrics metrics={engagement} />
                  </div>

                  {/* Performance Charts */}
                  {engagement.totalImpressions > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
                      <PerformanceCharts
                        dailyData={analytics.dailyBreakdown}
                        hourlyData={hourlyData}
                        mediaData={mediaPerf}
                        venueData={venuePerf}
                      />
                    </div>
                  )}

                  {/* Media Performance Table */}
                  {mediaPerf.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Media Performance</h3>
                      <MediaPerformanceTable
                        mediaPerformance={mediaPerf}
                        campaignMedia={campaign.media}
                      />
                    </div>
                  )}

                  {/* Venue Insights */}
                  {venuePerf.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Location Insights</h3>
                      <VenueInsights venuePerformance={venuePerf.slice(0, 10)} />
                    </div>
                  )}

                  {/* Legacy District/City Breakdown (if venue data not available) */}
                  {venuePerf.length === 0 && Object.keys(analytics.regionBreakdown).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance by District</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(analytics.regionBreakdown)
                            .sort(([, a], [, b]) => b.impressions - a.impressions)
                            .map(([district, data]) => (
                              <div key={district} className="bg-muted/30 rounded-lg p-4 border">
                                <h4 className="font-semibold text-foreground mb-2">{district}</h4>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Impressions</p>
                                    <p className="font-bold text-primary">{data.impressions}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">QR Scans</p>
                                    <p className="font-bold text-accent">{data.qrScans}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Duration</p>
                                    <p className="font-bold text-foreground">{formatDuration(data.duration)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}

            {campaigns.length === 0 && (
              <Card className="p-12 text-center">
                <BarChart3 className="mx-auto mb-4 text-muted-foreground" size={64} />
                <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground">
                  Create your first campaign to see analytics
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdvertiserDashboard;
