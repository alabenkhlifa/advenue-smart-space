import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { requireAuth } from "@/lib/auth";
import {
  getCampaignById,
  updateCampaign,
  createEmptyWeeklySchedule,
  Campaign,
  CampaignCategory,
  WeeklySchedule,
} from "@/lib/campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import WeeklyScheduleCalendar from "@/components/WeeklyScheduleCalendar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar as CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";

const EditCampaignPage = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [user, setUser] = useState<any>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(
    createEmptyWeeklySchedule()
  );

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const currentUser = requireAuth("advertiser");
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setUser(currentUser);

    // Load campaign data
    if (campaignId) {
      const existingCampaign = getCampaignById(campaignId);
      if (!existingCampaign) {
        toast({
          variant: "destructive",
          title: "Campaign Not Found",
          description: "The campaign you're trying to edit doesn't exist.",
        });
        navigate("/dashboard/advertiser");
        return;
      }

      // Check if user owns this campaign
      if (existingCampaign.advertiserId !== currentUser.id) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have permission to edit this campaign.",
        });
        navigate("/dashboard/advertiser");
        return;
      }

      setCampaign(existingCampaign);

      // Populate scheduling state
      const hasScheduling = Boolean(
        existingCampaign.startDate || existingCampaign.endDate || existingCampaign.weeklySchedule
      );
      setEnableScheduling(hasScheduling);
      setStartDate(existingCampaign.startDate ? new Date(existingCampaign.startDate) : undefined);
      setEndDate(existingCampaign.endDate ? new Date(existingCampaign.endDate) : undefined);
      setWeeklySchedule(existingCampaign.weeklySchedule || createEmptyWeeklySchedule());
    }
  }, [campaignId, navigate]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!campaign) return;

    const formData = new FormData(e.currentTarget);

    updateCampaign(campaign.id, {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      budget: parseFloat(formData.get("budget") as string) || undefined,
      targetUrl: (formData.get("targetUrl") as string) || undefined,
      category: (formData.get("category") as CampaignCategory) || undefined,
      startDate: enableScheduling && startDate ? startDate.getTime() : undefined,
      endDate: enableScheduling && endDate ? endDate.getTime() : undefined,
      weeklySchedule: enableScheduling ? weeklySchedule : undefined,
    });

    toast({
      title: "Campaign Updated",
      description: "Your campaign has been updated successfully.",
    });

    navigate("/dashboard/advertiser");
  };

  const handleCancel = () => {
    navigate("/dashboard/advertiser");
  };

  if (!user || !campaign) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">Edit Campaign</h1>
              <p className="text-sm text-muted-foreground">
                Update your campaign settings
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Basic information about your advertising campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Summer Sale 2025"
                    defaultValue={campaign.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={campaign.category}>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Promote our summer sale with exclusive discounts..."
                  rows={4}
                  defaultValue={campaign.description}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetUrl">Target URL (for QR codes)</Label>
                  <Input
                    id="targetUrl"
                    name="targetUrl"
                    type="url"
                    placeholder="https://example.com/landing-page"
                    defaultValue={campaign.targetUrl}
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
                    min="0"
                    step="10"
                    defaultValue={campaign.budget}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Campaign Scheduling</CardTitle>
                  <CardDescription>
                    Set specific dates and times when your campaign should run
                  </CardDescription>
                </div>
                <Switch
                  id="enable-scheduling"
                  checked={enableScheduling}
                  onCheckedChange={setEnableScheduling}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {enableScheduling ? (
                <>
                  {/* Date Range */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Date Range (Optional)</h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        Set a start and end date for your campaign. Leave empty to run indefinitely.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm">Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start text-left font-normal h-11 hover:bg-background hover:text-foreground"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? (
                                format(startDate, "PPP")
                              ) : (
                                <span className="text-muted-foreground">
                                  Pick a start date
                                </span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start text-left font-normal h-11 hover:bg-background hover:text-foreground"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? (
                                format(endDate, "PPP")
                              ) : (
                                <span className="text-muted-foreground">
                                  Pick an end date
                                </span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                              disabled={(date) =>
                                startDate ? date < startDate : false
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Schedule */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Time-of-Day Schedule (Optional)</h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        Select specific days and times when your ad should display. Leave empty to run 24/7.
                      </p>
                    </div>
                    <WeeklyScheduleCalendar
                      value={weeklySchedule}
                      onChange={setWeeklySchedule}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-12 px-4 bg-muted/30 rounded-lg border border-dashed">
                  <CalendarIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Scheduling Set</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Your campaign will run 24/7 with no time restrictions. Enable scheduling above to set specific dates and times.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end sticky bottom-0 bg-background py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              size="lg"
            >
              Cancel
            </Button>
            <Button type="submit" variant="hero" size="lg">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditCampaignPage;
