import { Card } from "@/components/ui/card";
import {
  Target,
  BarChart3,
  Zap,
  Shield,
  Clock,
  DollarSign,
  Monitor,
  MapPin,
  Users,
} from "lucide-react";

const Features = () => {
  const advertiserFeatures = [
    {
      icon: Target,
      title: "Precise Targeting",
      description:
        "Reach your ideal audience with location-based targeting and demographic filters.",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description:
        "Track campaign performance with detailed insights and engagement metrics.",
    },
    {
      icon: Zap,
      title: "Instant Deployment",
      description:
        "Launch campaigns in minutes. Update content remotely in real-time.",
    },
    {
      icon: Shield,
      title: "Quality Venues",
      description:
        "Access premium locations with verified high-traffic venues.",
    },
  ];

  const venueFeatures = [
    {
      icon: DollarSign,
      title: "Passive Income",
      description:
        "Monetize existing screens and generate new revenue streams effortlessly.",
    },
    {
      icon: Monitor,
      title: "Easy Management",
      description:
        "Simple dashboard to manage content, schedules, and earnings.",
    },
    {
      icon: Clock,
      title: "Flexible Control",
      description:
        "Set your own rates, schedules, and content approval preferences.",
    },
    {
      icon: Users,
      title: "Premium Advertisers",
      description:
        "Connect with quality brands that enhance your venue's atmosphere.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="gradient-primary bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for both advertisers and venue owners
          </p>
        </div>

        {/* For Advertisers */}
        <div className="mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-primary/10 px-6 py-2 rounded-full border border-primary/20">
              <h3 className="text-2xl font-bold text-primary flex items-center">
                <Target className="mr-2" size={24} />
                For Advertisers
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advertiserFeatures.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-smooth hover:scale-105 bg-card border-border animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="gradient-primary w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="text-primary-foreground" size={24} />
                </div>
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* For Venue Owners */}
        <div>
          <div className="flex items-center justify-center mb-8">
            <div className="bg-accent/10 px-6 py-2 rounded-full border border-accent/20">
              <h3 className="text-2xl font-bold text-accent flex items-center">
                <MapPin className="mr-2" size={24} />
                For Venue Owners
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {venueFeatures.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-smooth hover:scale-105 bg-card border-border animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="gradient-accent w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="text-accent-foreground" size={24} />
                </div>
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
