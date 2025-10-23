import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { register, Venue } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Tv, Plus, Trash2 } from "lucide-react";

const ScreenOwnerRegister = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [venues, setVenues] = useState<Venue[]>([
    {
      id: crypto.randomUUID(),
      name: "",
      type: "",
      address: "",
      city: "",
      region: "",
      country: "",
      screenCount: 0,
      footTraffic: "",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleVenueChange = (index: number, field: keyof Venue, value: string | number) => {
    const newVenues = [...venues];
    newVenues[index] = { ...newVenues[index], [field]: value };
    setVenues(newVenues);
  };

  const addVenue = () => {
    setVenues([
      ...venues,
      {
        id: crypto.randomUUID(),
        name: "",
        type: "",
        address: "",
        city: "",
        region: "",
        country: "",
        screenCount: 0,
        footTraffic: "",
      },
    ]);
  };

  const removeVenue = (index: number) => {
    if (venues.length === 1) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must have at least one venue",
      });
      return;
    }
    setVenues(venues.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 8 characters",
      });
      setIsLoading(false);
      return;
    }

    // Validate venues
    const invalidVenues = venues.filter((v) => !v.name.trim());
    if (invalidVenues.length > 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "All venues must have a name",
      });
      setIsLoading(false);
      return;
    }

    try {
      const user = register({
        email: formData.email,
        password: formData.password,
        role: "screen-owner",
        name: formData.name,
        venues: venues,
      });

      toast({
        title: "Registration Successful",
        description: `Welcome to AdVenue, ${user.name}!`,
      });

      navigate("/dashboard/owner");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred during registration",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden py-12">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 gradient-mesh" />

      {/* Floating orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      {/* Back to Home */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center text-muted-foreground hover:text-primary transition-smooth"
      >
        <ArrowLeft className="mr-2" size={20} />
        Back to Home
      </Link>

      {/* Registration Card */}
      <Card className="relative z-10 w-full max-w-2xl mx-4 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Tv className="text-primary" size={32} />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center gradient-primary bg-clip-text text-transparent">
            Register as Screen Owner
          </CardTitle>
          <CardDescription className="text-center">
            Monetize your venue's screens with targeted advertising
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Jane Smith"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@venue.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Venues Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Venues</h3>
                <Button type="button" variant="outline" size="sm" onClick={addVenue}>
                  <Plus className="mr-2" size={16} />
                  Add Venue
                </Button>
              </div>

              {venues.map((venue, index) => (
                <Card key={venue.id} className="border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Venue {index + 1}</CardTitle>
                      {venues.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVenue(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Venue Name *</Label>
                        <Input
                          placeholder="Downtown Cafe"
                          value={venue.name}
                          onChange={(e) => handleVenueChange(index, "name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Venue Type</Label>
                        <Select
                          value={venue.type}
                          onValueChange={(value) => handleVenueChange(index, "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="restaurant">Restaurant</SelectItem>
                            <SelectItem value="cafe">Cafe</SelectItem>
                            <SelectItem value="gym">Gym/Fitness Center</SelectItem>
                            <SelectItem value="retail">Retail Store</SelectItem>
                            <SelectItem value="hotel">Hotel/Lobby</SelectItem>
                            <SelectItem value="mall">Shopping Mall</SelectItem>
                            <SelectItem value="office">Office Building</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          placeholder="123 Main St"
                          value={venue.address}
                          onChange={(e) => handleVenueChange(index, "address", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          placeholder="New York"
                          value={venue.city}
                          onChange={(e) => handleVenueChange(index, "city", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>District/Neighborhood</Label>
                        <Input
                          placeholder="LAC2, Ennasr, Menzah, etc."
                          value={venue.region}
                          onChange={(e) => handleVenueChange(index, "region", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                          placeholder="USA"
                          value={venue.country}
                          onChange={(e) => handleVenueChange(index, "country", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Number of Screens</Label>
                        <Input
                          type="number"
                          placeholder="1"
                          value={venue.screenCount || ""}
                          onChange={(e) =>
                            handleVenueChange(index, "screenCount", parseInt(e.target.value) || 0)
                          }
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Daily Foot Traffic</Label>
                        <Select
                          value={venue.footTraffic}
                          onValueChange={(value) => handleVenueChange(index, "footTraffic", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Estimate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-100">0 - 100 visitors/day</SelectItem>
                            <SelectItem value="100-500">100 - 500 visitors/day</SelectItem>
                            <SelectItem value="500-1000">500 - 1,000 visitors/day</SelectItem>
                            <SelectItem value="1000+">1,000+ visitors/day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Screen Owner Account"}
            </Button>
          </form>

          {/* Sign in link */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Are you an advertiser?{" "}
            <Link to="/register/advertiser" className="text-primary hover:underline font-medium">
              Register as Advertiser
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScreenOwnerRegister;
