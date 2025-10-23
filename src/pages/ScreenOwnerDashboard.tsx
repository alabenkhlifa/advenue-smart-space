import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requireAuth, logout, Venue } from "@/lib/auth";
import { validateAndPairScreen, getOwnerScreens, unpairScreen, PairedScreen } from "@/lib/pairing";
import { getActiveCampaigns, updateScreenCampaignSettings, getScreenCampaignSettings, Campaign, CampaignCategory, ContentMode } from "@/lib/campaigns";
import { getScreenImpressions, calculateScreenRevenue } from "@/lib/analytics";
import { getOwnerCustomContent, CustomContent } from "@/lib/customContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Tv, TrendingUp, DollarSign, CheckCircle2, XCircle, Building2, FileImage, Youtube } from "lucide-react";
import MediaThumbnail from "@/components/MediaThumbnail";
import { CustomContentManager } from "@/components/CustomContentManager";
import { ContentAdsVisualization } from "@/components/ContentAdsVisualization";
import { Slider } from "@/components/ui/slider";

const ScreenOwnerDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [screens, setScreens] = useState<PairedScreen[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [customContent, setCustomContent] = useState<CustomContent[]>([]);
  const [isPairDialogOpen, setIsPairDialogOpen] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<PairedScreen | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [pairingData, setPairingData] = useState({ screenId: "", pairingCode: "", venueId: "" });
  const [isPairing, setIsPairing] = useState(false);
  const [activeTab, setActiveTab] = useState("screens");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const currentUser = requireAuth("screen-owner");
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setUser(currentUser);

    loadScreens(currentUser.id);
    loadCampaigns();
    loadCustomContent(currentUser.id);
  }, [navigate]);

  const loadScreens = (ownerId: string) => {
    const ownerScreens = getOwnerScreens(ownerId);
    setScreens(ownerScreens);
  };

  const loadCampaigns = () => {
    const activeCampaigns = getActiveCampaigns();
    setCampaigns(activeCampaigns);
  };

  const loadCustomContent = (ownerId: string) => {
    const content = getOwnerCustomContent(ownerId);
    setCustomContent(content);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handlePairScreen = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPairing(true);

    if (!pairingData.venueId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a venue for this screen",
      });
      setIsPairing(false);
      return;
    }

    const venue = (user.venues || []).find((v: Venue) => v.id === pairingData.venueId);

    const result = await validateAndPairScreen(
      pairingData.screenId,
      pairingData.pairingCode,
      user.id,
      venue?.name,
      pairingData.venueId
    );

    setIsPairing(false);

    if (result.success) {
      toast({
        title: "Screen Paired Successfully",
        description: `Screen ${pairingData.screenId} has been paired to ${venue?.name}.`,
      });
      setIsPairDialogOpen(false);
      setPairingData({ screenId: "", pairingCode: "", venueId: "" });
      loadScreens(user.id);
    } else {
      toast({
        variant: "destructive",
        title: "Pairing Failed",
        description: result.error,
      });
    }
  };

  const handleUnpairScreen = (screenId: string) => {
    const success = unpairScreen(screenId, user.id);
    if (success) {
      toast({
        title: "Screen Unpaired",
        description: "The screen has been removed from your account.",
      });
      loadScreens(user.id);
    }
  };

  const handleUpdateScreenSettings = (screenId: string, updates: any) => {
    const currentSettings = getScreenCampaignSettings(screenId);
    updateScreenCampaignSettings({
      ...currentSettings,
      ...updates,
    });

    toast({
      title: "Settings Updated",
      description: "Screen settings have been saved successfully.",
    });
  };

  const toggleCampaignSelection = (screenId: string, campaignId: string) => {
    const settings = getScreenCampaignSettings(screenId);
    const selected = settings.selectedCampaignIds.includes(campaignId);

    const newSelectedIds = selected
      ? settings.selectedCampaignIds.filter(id => id !== campaignId)
      : [...settings.selectedCampaignIds, campaignId];

    updateScreenCampaignSettings({
      ...settings,
      selectedCampaignIds: newSelectedIds,
    });

    toast({
      title: "Campaign Updated",
      description: selected ? "Campaign removed from screen" : "Campaign added to screen",
    });
  };

  const toggleCategorySelection = (screenId: string, category: CampaignCategory) => {
    const settings = getScreenCampaignSettings(screenId);
    const currentCategories = settings.selectedCategories || [];
    const isSelected = currentCategories.includes(category);

    const newCategories = isSelected
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];

    updateScreenCampaignSettings({
      ...settings,
      selectedCategories: newCategories.length > 0 ? newCategories : undefined,
    });

    toast({
      title: "Category Filter Updated",
      description: isSelected ? `Removed ${category} filter` : `Added ${category} filter`,
    });
  };

  const handleManageCampaigns = (screen: PairedScreen) => {
    setSelectedScreen(screen);
    setActiveTab("campaigns");
  };

  if (!user) return null;

  const venues = user.venues || [];
  const hasMultipleVenues = venues.length > 1;

  // Filter screens by selected venue
  const filteredScreens = selectedVenue
    ? screens.filter(screen => screen.venueId === selectedVenue.id)
    : screens;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              AdVenue
            </h1>
            <p className="text-sm text-muted-foreground">Screen Owner Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{user.name}</p>
              {hasMultipleVenues && selectedVenue && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 size={14} />
                  <span>{selectedVenue.name}</span>
                </div>
              )}
              {!hasMultipleVenues && venues[0] && (
                <p className="text-sm text-muted-foreground">{venues[0].name}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="screens">My Screens</TabsTrigger>
            <TabsTrigger value="my-content">My Content</TabsTrigger>
            <TabsTrigger value="campaigns">Available Campaigns</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="screens" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold">My Screens</h2>
                {hasMultipleVenues && (
                  <Select
                    value={selectedVenue?.id || "all"}
                    onValueChange={(value) => {
                      if (value === "all") {
                        setSelectedVenue(null);
                      } else {
                        const venue = venues.find((v: Venue) => v.id === value);
                        setSelectedVenue(venue || null);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Venues</SelectItem>
                      {venues.map((venue: Venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Dialog open={isPairDialogOpen} onOpenChange={setIsPairDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero">
                    <Plus className="mr-2" size={18} />
                    Pair New Screen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Pair a New Screen</DialogTitle>
                    <DialogDescription>
                      Enter the Screen ID and Pairing Code displayed on your TV screen.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePairScreen} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="venueSelect">Select Venue *</Label>
                      <Select
                        value={pairingData.venueId}
                        onValueChange={(value) =>
                          setPairingData({ ...pairingData, venueId: value })
                        }
                        required
                      >
                        <SelectTrigger id="venueSelect">
                          <SelectValue placeholder="Choose a venue" />
                        </SelectTrigger>
                        <SelectContent>
                          {venues.map((venue: Venue) => (
                            <SelectItem key={venue.id} value={venue.id}>
                              {venue.name}
                              {venue.type && ` (${venue.type})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="screenId">Screen ID *</Label>
                      <Input
                        id="screenId"
                        placeholder="SCR-XXXX-XXXX-XXXX"
                        value={pairingData.screenId}
                        onChange={(e) =>
                          setPairingData({ ...pairingData, screenId: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pairingCode">Pairing Code *</Label>
                      <Input
                        id="pairingCode"
                        placeholder="XXXXXXXX"
                        value={pairingData.pairingCode}
                        onChange={(e) =>
                          setPairingData({ ...pairingData, pairingCode: e.target.value })
                        }
                        required
                      />
                    </div>
                    <Button type="submit" variant="hero" className="w-full" disabled={isPairing}>
                      {isPairing ? "Pairing..." : "Pair Screen"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredScreens.map((screen) => {
                const settings = getScreenCampaignSettings(screen.screenId);
                const impressions = getScreenImpressions(screen.screenId);

                return (
                  <Card key={screen.screenId} className="hover-lift">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-mono">
                          {screen.screenId}
                        </CardTitle>
                        <Badge variant={screen.status === "online" ? "default" : "secondary"}>
                          {screen.status}
                        </Badge>
                      </div>
                      <CardDescription>{screen.venueName || "Unnamed Venue"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Impressions:</span>
                          <span className="font-bold text-primary">{impressions.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Active Campaigns:</span>
                          <span className="font-medium">
                            {settings.displayAll
                              ? campaigns.length
                              : settings.selectedCampaignIds.length}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Rotation Frequency</Label>
                        <Select
                          value={settings.rotationFrequency.toString()}
                          onValueChange={(value) =>
                            handleUpdateScreenSettings(screen.screenId, {
                              rotationFrequency: parseInt(value),
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 seconds</SelectItem>
                            <SelectItem value="10">10 seconds</SelectItem>
                            <SelectItem value="30">30 seconds</SelectItem>
                            <SelectItem value="60">1 minute</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Video Playback Mode</Label>
                        <Select
                          value={settings.videoPlaybackMode}
                          onValueChange={(value) =>
                            handleUpdateScreenSettings(screen.screenId, {
                              videoPlaybackMode: value as 'complete' | 'rotation' | 'smart',
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="smart">Smart (Recommended)</SelectItem>
                            <SelectItem value="complete">Always Complete</SelectItem>
                            <SelectItem value="rotation">Respect Timer</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {settings.videoPlaybackMode === 'smart' &&
                            'Loop short videos, play long ones completely'}
                          {settings.videoPlaybackMode === 'complete' &&
                            'Videos always play to end (ignores rotation timer)'}
                          {settings.videoPlaybackMode === 'rotation' &&
                            'Videos may be cut off if longer than rotation time'}
                        </p>
                      </div>

                      <div className="border-t pt-4 space-y-3">
                        <Label className="font-semibold">Content Display</Label>
                        <div className="space-y-2">
                          <Label className="text-sm">Display Mode</Label>
                          <Select
                            value={settings.contentMode || 'ads-only'}
                            onValueChange={(value) =>
                              handleUpdateScreenSettings(screen.screenId, {
                                contentMode: value as ContentMode,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ads-only">Ads Only</SelectItem>
                              <SelectItem value="custom-only">My Content Only</SelectItem>
                              <SelectItem value="mixed">Mixed (Ads + My Content)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {settings.contentMode === 'mixed' && (
                          <div className="space-y-3 pt-2">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Ads / Content Balance</Label>
                                <span className="text-xs font-medium text-primary">
                                  {settings.adsContentRatio ?? 50}% Ads
                                </span>
                              </div>
                              <Slider
                                value={[settings.adsContentRatio ?? 50]}
                                onValueChange={(value) =>
                                  handleUpdateScreenSettings(screen.screenId, {
                                    adsContentRatio: value[0],
                                  })
                                }
                                min={0}
                                max={100}
                                step={5}
                                className="w-full"
                              />
                            </div>
                            <ContentAdsVisualization adsPercentage={settings.adsContentRatio ?? 50} />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageCampaigns(screen)}
                        >
                          Manage Campaigns
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUnpairScreen(screen.screenId)}
                        >
                          Unpair
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredScreens.length === 0 && screens.length > 0 && (
              <Card className="p-12 text-center">
                <Tv className="mx-auto mb-4 text-muted-foreground" size={64} />
                <h3 className="text-xl font-semibold mb-2">No screens at this venue</h3>
                <p className="text-muted-foreground mb-4">
                  Pair a screen to this venue or select a different venue
                </p>
                <Button variant="hero" onClick={() => setIsPairDialogOpen(true)}>
                  <Plus className="mr-2" size={18} />
                  Pair Screen
                </Button>
              </Card>
            )}

            {screens.length === 0 && (
              <Card className="p-12 text-center">
                <Tv className="mx-auto mb-4 text-muted-foreground" size={64} />
                <h3 className="text-xl font-semibold mb-2">No screens paired yet</h3>
                <p className="text-muted-foreground mb-4">
                  Navigate to /screen on your Smart TV and pair it with your account
                </p>
                <Button variant="hero" onClick={() => setIsPairDialogOpen(true)}>
                  <Plus className="mr-2" size={18} />
                  Pair Your First Screen
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="my-content" className="space-y-6">
            <h2 className="text-3xl font-bold">My Content</h2>
            <CustomContentManager
              ownerId={user.id}
              customContent={customContent}
              onContentChange={() => loadCustomContent(user.id)}
            />

            {customContent.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Content on Screens</CardTitle>
                  <CardDescription>
                    Select which screens should display your custom content. Selecting content will automatically enable mixed mode (ads + custom content). You can adjust settings in the "My Screens" tab.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {screens.map((screen) => {
                    const settings = getScreenCampaignSettings(screen.screenId);
                    const selectedContentIds = settings.customContentIds || [];

                    return (
                      <div key={screen.screenId} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium font-mono">{screen.screenId}</p>
                            <p className="text-sm text-muted-foreground">{screen.venueName}</p>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                {settings.contentMode === 'ads-only' && 'Ads Only'}
                                {settings.contentMode === 'custom-only' && 'Custom Only'}
                                {settings.contentMode === 'mixed' && `Mixed (Ads + Content)`}
                              </Badge>
                            </div>
                          </div>
                          <Badge variant={screen.status === "online" ? "default" : "secondary"}>
                            {screen.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Select Content to Display</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {customContent.map((content) => {
                              const isSelected = selectedContentIds.includes(content.id);
                              return (
                                <div
                                  key={content.id}
                                  className={`flex items-center gap-3 p-3 rounded-md border transition-colors cursor-pointer ${
                                    isSelected ? 'bg-primary/10 border-primary' : 'bg-muted/30 hover:bg-muted/50'
                                  }`}
                                  onClick={() => {
                                    const newContentIds = isSelected
                                      ? selectedContentIds.filter(id => id !== content.id)
                                      : [...selectedContentIds, content.id];

                                    // Determine appropriate content mode based on selections
                                    const currentSettings = getScreenCampaignSettings(screen.screenId);
                                    let newContentMode = currentSettings.contentMode || 'ads-only';

                                    // If adding first custom content and mode is ads-only, switch to mixed
                                    if (newContentIds.length > 0 && newContentIds.length > selectedContentIds.length && newContentMode === 'ads-only') {
                                      newContentMode = 'mixed';
                                    }
                                    // If removing all custom content and mode is custom-only or mixed, switch to ads-only
                                    if (newContentIds.length === 0 && newContentMode !== 'ads-only') {
                                      newContentMode = 'ads-only';
                                    }

                                    handleUpdateScreenSettings(screen.screenId, {
                                      customContentIds: newContentIds,
                                      contentMode: newContentMode,
                                    });
                                  }}
                                >
                                  <Checkbox checked={isSelected} />
                                  {content.type === 'menu' ? (
                                    <FileImage className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <Youtube className="w-4 h-4 text-red-600" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{content.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {content.type === 'youtube-playlist' ? 'Playlist' : content.type === 'youtube-video' ? 'Video' : 'Menu'}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {customContent.length === 0 && (
              <Card className="p-12 text-center border-dashed">
                <FileImage className="mx-auto mb-4 text-muted-foreground" size={64} />
                <h3 className="text-xl font-semibold mb-2">No Custom Content Yet</h3>
                <p className="text-muted-foreground">
                  Upload your menus or add YouTube videos above to display your own content on your screens
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <h2 className="text-3xl font-bold">Available Campaigns</h2>

            {!selectedScreen && screens.length > 0 && (
              <Card className="p-8 text-center border-dashed">
                <Tv className="mx-auto mb-3 text-muted-foreground" size={48} />
                <h3 className="text-lg font-semibold mb-2">No Screen Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Go to "My Screens" tab and click "Manage Campaigns" on a screen to configure which campaigns to display
                </p>
                <Button variant="outline" onClick={() => setActiveTab("screens")}>
                  Go to My Screens
                </Button>
              </Card>
            )}

            {!selectedScreen && screens.length === 0 && (
              <Card className="p-8 text-center border-dashed">
                <Tv className="mx-auto mb-3 text-muted-foreground" size={48} />
                <h3 className="text-lg font-semibold mb-2">No Screens Paired</h3>
                <p className="text-muted-foreground mb-4">
                  Pair a screen first before managing campaigns
                </p>
                <Button variant="hero" onClick={() => {
                  setActiveTab("screens");
                  setIsPairDialogOpen(true);
                }}>
                  <Plus className="mr-2" size={18} />
                  Pair Your First Screen
                </Button>
              </Card>
            )}

            {selectedScreen && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <CardTitle>Managing: {selectedScreen.screenId}</CardTitle>
                  <CardDescription>
                    Select which campaigns to display on this screen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="displayAll">Display All Campaigns</Label>
                    <Switch
                      id="displayAll"
                      checked={getScreenCampaignSettings(selectedScreen.screenId).displayAll}
                      onCheckedChange={(checked) =>
                        handleUpdateScreenSettings(selectedScreen.screenId, {
                          displayAll: checked,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Filter by Category</Label>
                    <div className="flex flex-wrap gap-2">
                      {(['Food', 'Clothing', 'Hotel', 'Entertainment', 'Technology', 'Health', 'Other'] as CampaignCategory[]).map((category) => {
                        const settings = getScreenCampaignSettings(selectedScreen.screenId);
                        const isSelected = settings.selectedCategories?.includes(category) || false;

                        return (
                          <Badge
                            key={category}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => toggleCategorySelection(selectedScreen.screenId, category)}
                          >
                            {category}
                          </Badge>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click categories to filter campaigns. Leave empty to show all categories.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedScreen && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(() => {
                    const settings = getScreenCampaignSettings(selectedScreen.screenId);

                    // Filter campaigns by selected categories
                    let filteredCampaigns = campaigns;
                    if (settings.selectedCategories && settings.selectedCategories.length > 0) {
                      filteredCampaigns = campaigns.filter(c =>
                        c.category && settings.selectedCategories!.includes(c.category)
                      );
                    }

                    return filteredCampaigns.map((campaign) => {
                      const isSelected = settings.selectedCampaignIds.includes(campaign.id);

                      return (
                      <Card key={campaign.id} className="hover-lift">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{campaign.name}</CardTitle>
                            {selectedScreen && (
                              <Checkbox
                                checked={isSelected || settings.displayAll}
                                onCheckedChange={() =>
                                  toggleCampaignSelection(selectedScreen.screenId, campaign.id)
                                }
                                disabled={settings.displayAll}
                              />
                            )}
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
                        <CardContent>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Media Files:</span>
                            <span className="font-medium">{campaign.media.length}</span>
                          </div>
                          {campaign.media.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-4">
                              {campaign.media.slice(0, 3).map((media) => (
                                <MediaThumbnail
                                  key={media.id}
                                  mediaId={media.id}
                                  mediaName={media.name}
                                  mediaType={media.type}
                                  url={media.url}
                                  storedInIndexedDB={media.storedInIndexedDB}
                                  duration={media.duration}
                                  className="aspect-square"
                                />
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                    });
                  })()}
                </div>

                {(() => {
                  const settings = getScreenCampaignSettings(selectedScreen.screenId);
                  const hasCategories = settings.selectedCategories && settings.selectedCategories.length > 0;

                  let filteredCampaigns = campaigns;
                  if (hasCategories) {
                    filteredCampaigns = campaigns.filter(c =>
                      c.category && settings.selectedCategories!.includes(c.category)
                    );
                  }

                  if (filteredCampaigns.length === 0 && campaigns.length > 0 && hasCategories) {
                    return (
                      <Card className="p-12 text-center border-dashed">
                        <p className="text-lg font-semibold mb-2">No Campaigns Match Selected Categories</p>
                        <p className="text-muted-foreground">
                          No active campaigns found for the selected categories ({settings.selectedCategories!.join(', ')}). Try selecting different categories or clear the filter to see all campaigns.
                        </p>
                      </Card>
                    );
                  }

                  if (campaigns.length === 0) {
                    return (
                      <Card className="p-12 text-center">
                        <p className="text-lg font-semibold mb-2">No Active Campaigns</p>
                        <p className="text-muted-foreground">
                          There are no active campaigns available. Check back later or contact advertisers to create and activate campaigns.
                        </p>
                      </Card>
                    );
                  }

                  return null;
                })()}
              </>
            )}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Revenue Overview</h2>
              {hasMultipleVenues && (
                <Select
                  value={selectedVenue?.id || "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setSelectedVenue(null);
                    } else {
                      const venue = venues.find((v: Venue) => v.id === value);
                      setSelectedVenue(venue || null);
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Venues</SelectItem>
                    {venues.map((venue: Venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredScreens.map((screen) => {
                const revenue = calculateScreenRevenue(screen.screenId);
                const impressions = getScreenImpressions(screen.screenId);

                return (
                  <Card key={screen.screenId}>
                    <CardHeader>
                      <CardTitle className="text-lg font-mono">{screen.screenId}</CardTitle>
                      <CardDescription>{screen.venueName}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-primary/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="text-primary" size={20} />
                          <p className="text-sm text-muted-foreground">Estimated Revenue</p>
                        </div>
                        <p className="text-3xl font-bold text-primary">
                          ${revenue.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="text-accent" size={20} />
                          <p className="text-sm text-muted-foreground">Total Impressions</p>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {impressions.length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Calculation</CardTitle>
                <CardDescription>
                  Earnings are calculated at $0.01 per impression (demo rate)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-medium">Total Estimated Revenue:</span>
                    <span className="text-3xl font-bold text-primary">
                      $
                      {filteredScreens
                        .reduce(
                          (sum, screen) => sum + calculateScreenRevenue(screen.screenId),
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedVenue
                      ? `Based on impressions at ${selectedVenue.name}`
                      : "Based on all impressions across all screens"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ScreenOwnerDashboard;
