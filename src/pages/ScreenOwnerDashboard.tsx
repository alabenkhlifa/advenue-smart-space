import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requireAuth, logout } from "@/lib/auth";
import { validateAndPairScreen, getOwnerScreens, unpairScreen, PairedScreen } from "@/lib/pairing";
import { getActiveCampaigns, updateScreenCampaignSettings, getScreenCampaignSettings, Campaign } from "@/lib/campaigns";
import { getScreenImpressions, calculateScreenRevenue } from "@/lib/analytics";
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
import { LogOut, Plus, Tv, TrendingUp, DollarSign, CheckCircle2, XCircle } from "lucide-react";
import MediaThumbnail from "@/components/MediaThumbnail";

const ScreenOwnerDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [screens, setScreens] = useState<PairedScreen[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isPairDialogOpen, setIsPairDialogOpen] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<PairedScreen | null>(null);
  const [pairingData, setPairingData] = useState({ screenId: "", pairingCode: "" });
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
  }, [navigate]);

  const loadScreens = (ownerId: string) => {
    const ownerScreens = getOwnerScreens(ownerId);
    setScreens(ownerScreens);
  };

  const loadCampaigns = () => {
    const activeCampaigns = getActiveCampaigns();
    setCampaigns(activeCampaigns);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handlePairScreen = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPairing(true);

    const result = await validateAndPairScreen(
      pairingData.screenId,
      pairingData.pairingCode,
      user.id,
      user.venueName
    );

    setIsPairing(false);

    if (result.success) {
      toast({
        title: "Screen Paired Successfully",
        description: `Screen ${pairingData.screenId} has been paired to your account.`,
      });
      setIsPairDialogOpen(false);
      setPairingData({ screenId: "", pairingCode: "" });
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

  const handleManageCampaigns = (screen: PairedScreen) => {
    setSelectedScreen(screen);
    setActiveTab("campaigns");
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
            <p className="text-sm text-muted-foreground">Screen Owner Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.venueName}</p>
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
            <TabsTrigger value="campaigns">Available Campaigns</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="screens" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">My Screens</h2>
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
              {screens.map((screen) => {
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
                </CardContent>
              </Card>
            )}

            {selectedScreen && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns.map((campaign) => {
                    const settings = selectedScreen
                      ? getScreenCampaignSettings(selectedScreen.screenId)
                      : null;
                    const isSelected = settings
                      ? settings.selectedCampaignIds.includes(campaign.id)
                      : false;

                    return (
                      <Card key={campaign.id} className="hover-lift">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{campaign.name}</CardTitle>
                            {selectedScreen && (
                              <Checkbox
                                checked={isSelected || settings?.displayAll}
                                onCheckedChange={() =>
                                  toggleCampaignSelection(selectedScreen.screenId, campaign.id)
                                }
                                disabled={settings?.displayAll}
                              />
                            )}
                          </div>
                          <CardDescription className="line-clamp-2">
                            {campaign.description}
                          </CardDescription>
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
                  })}
                </div>

                {campaigns.length === 0 && (
                  <Card className="p-12 text-center">
                    <p className="text-lg font-semibold mb-2">No Active Campaigns</p>
                    <p className="text-muted-foreground">
                      There are no active campaigns available. Check back later or contact advertisers to create and activate campaigns.
                    </p>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <h2 className="text-3xl font-bold">Revenue Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {screens.map((screen) => {
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
                      {screens
                        .reduce(
                          (sum, screen) => sum + calculateScreenRevenue(screen.screenId),
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on all impressions across all screens
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
