import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requireAuth, logout } from "@/lib/auth";
import {
  createCampaign,
  getAdvertiserCampaigns,
  updateCampaign,
  addMediaToCampaignWithBlob,
  removeMediaFromCampaign,
  validateMediaFile,
  Campaign,
  CampaignCategory,
} from "@/lib/campaigns";
import { getMediaFile, blobToDataUrl } from "@/lib/mediaStorage";
import { getCampaignAnalytics, formatDuration } from "@/lib/analytics";
import { getCampaignQRAnalytics, calculateScanConversionRate } from "@/lib/qrAnalytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Upload, Play, Pause, BarChart3, Image as ImageIcon, Video, X, QrCode } from "lucide-react";
import MediaThumbnail from "@/components/MediaThumbnail";

const AdvertiserDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleCreateCampaign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const campaign = createCampaign(
      user.id,
      formData.get("name") as string,
      formData.get("description") as string,
      parseFloat(formData.get("budget") as string) || undefined,
      (formData.get("targetUrl") as string) || undefined,
      (formData.get("category") as CampaignCategory) || undefined
    );

    setCampaigns([...campaigns, campaign]);
    setIsCreateDialogOpen(false);
    toast({
      title: "Campaign Created",
      description: `${campaign.name} has been created successfully.`,
    });
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
            <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
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
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero">
                    <Plus className="mr-2" size={18} />
                    New Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                    <DialogDescription>
                      Create a new advertising campaign to reach your target audience.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateCampaign} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Campaign Name *</Label>
                      <Input id="name" name="name" placeholder="Summer Sale 2025" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Promote our summer sale..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select name="category">
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Food">Food</SelectItem>
                          <SelectItem value="Clothing">Clothing</SelectItem>
                          <SelectItem value="Hotel">Hotel</SelectItem>
                          <SelectItem value="Entertainment">Entertainment</SelectItem>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Health">Health</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetUrl">Target URL (for QR codes)</Label>
                      <Input
                        id="targetUrl"
                        name="targetUrl"
                        type="url"
                        placeholder="https://example.com/landing-page"
                      />
                      <p className="text-xs text-muted-foreground">
                        Users who scan the QR code will be redirected to this URL
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget ($)</Label>
                      <Input
                        id="budget"
                        name="budget"
                        type="number"
                        placeholder="1000"
                        step="0.01"
                      />
                    </div>
                    <Button type="submit" variant="hero" className="w-full">
                      Create Campaign
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover-lift">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{campaign.name}</CardTitle>
                      <Badge
                        variant={campaign.status === "active" ? "default" : "secondary"}
                      >
                        {campaign.status}
                      </Badge>
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
                <Button variant="hero" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2" size={18} />
                  Create Campaign
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-3xl font-bold">Campaign Analytics</h2>

            {campaigns.map((campaign) => {
              const analytics = getCampaignAnalytics(campaign.id);
              const qrAnalytics = getCampaignQRAnalytics(campaign.id);
              const conversionRate = calculateScanConversionRate(campaign.id, analytics.totalImpressions);

              return (
                <Card key={campaign.id}>
                  <CardHeader>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription>{campaign.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Impression Analytics */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Impressions</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-1">Total Impressions</p>
                          <p className="text-3xl font-bold text-primary">
                            {analytics.totalImpressions}
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-1">Total Duration</p>
                          <p className="text-2xl font-bold text-accent">
                            {formatDuration(analytics.totalDuration)}
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-1">Screens</p>
                          <p className="text-3xl font-bold text-foreground">
                            {Object.keys(analytics.screenBreakdown).length}
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-1">Avg per Screen</p>
                          <p className="text-3xl font-bold text-foreground">
                            {Object.keys(analytics.screenBreakdown).length > 0
                              ? Math.round(
                                  analytics.totalImpressions /
                                    Object.keys(analytics.screenBreakdown).length
                                )
                              : 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Analytics */}
                    {campaign.targetUrl && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <QrCode className="text-primary" size={20} />
                          <h3 className="text-lg font-semibold">QR Code Scans</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground mb-1">Total Scans</p>
                            <p className="text-3xl font-bold text-primary">
                              {qrAnalytics.totalScans}
                            </p>
                          </div>
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground mb-1">Conversion Rate</p>
                            <p className="text-2xl font-bold text-primary">
                              {conversionRate.toFixed(2)}%
                            </p>
                          </div>
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground mb-1">Screens with Scans</p>
                            <p className="text-3xl font-bold text-foreground">
                              {Object.keys(qrAnalytics.screenBreakdown).length}
                            </p>
                          </div>
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground mb-1">Avg Scans/Screen</p>
                            <p className="text-3xl font-bold text-foreground">
                              {Object.keys(qrAnalytics.screenBreakdown).length > 0
                                ? Math.round(
                                    qrAnalytics.totalScans /
                                      Object.keys(qrAnalytics.screenBreakdown).length
                                  )
                                : 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdvertiserDashboard;
