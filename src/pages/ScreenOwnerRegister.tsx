import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { register } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Tv } from "lucide-react";

const ScreenOwnerRegister = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    venueName: "",
    venueType: "",
    address: "",
    city: "",
    screenCount: "",
    footTraffic: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
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

    try {
      const user = register({
        email: formData.email,
        password: formData.password,
        role: "screen-owner",
        name: formData.name,
        venueName: formData.venueName,
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="venueName">Venue Name *</Label>
                <Input
                  id="venueName"
                  placeholder="Downtown Cafe"
                  value={formData.venueName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venueType">Venue Type *</Label>
                <Select
                  value={formData.venueType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, venueType: value })
                  }
                >
                  <SelectTrigger id="venueType">
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
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main St"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="screenCount">Number of Screens</Label>
                <Input
                  id="screenCount"
                  type="number"
                  placeholder="1"
                  value={formData.screenCount}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footTraffic">Daily Foot Traffic</Label>
                <Select
                  value={formData.footTraffic}
                  onValueChange={(value) =>
                    setFormData({ ...formData, footTraffic: value })
                  }
                >
                  <SelectTrigger id="footTraffic">
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
