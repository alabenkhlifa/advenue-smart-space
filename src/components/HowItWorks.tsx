import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserPlus, Search, Rocket, TrendingUp } from "lucide-react";

const HowItWorks = () => {
  const advertiserSteps = [
    {
      icon: UserPlus,
      title: "Create Account",
      description: "Sign up and set up your advertiser profile in minutes",
    },
    {
      icon: Search,
      title: "Find Venues",
      description: "Browse and select from our curated network of quality venues",
    },
    {
      icon: Rocket,
      title: "Launch Campaign",
      description: "Upload content, set your budget, and go live instantly",
    },
    {
      icon: TrendingUp,
      title: "Track Results",
      description: "Monitor performance and optimize with real-time analytics",
    },
  ];

  const venueSteps = [
    {
      icon: UserPlus,
      title: "Register Venue",
      description: "List your venue and describe your screen locations",
    },
    {
      icon: Search,
      title: "Get Matched",
      description: "Our platform connects you with relevant advertisers",
    },
    {
      icon: Rocket,
      title: "Approve Content",
      description: "Review and approve ads that fit your venue's atmosphere",
    },
    {
      icon: TrendingUp,
      title: "Earn Revenue",
      description: "Get paid automatically as ads run on your screens",
    },
  ];

  const scrollToContact = () => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            How{" "}
            <span className="gradient-primary bg-clip-text text-transparent">
              AdVenue
            </span>{" "}
            Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in four simple steps
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Advertisers Flow */}
          <div>
            <div className="bg-primary/10 inline-block px-6 py-2 rounded-full border border-primary/20 mb-8">
              <h3 className="text-xl font-bold text-primary">
                For Advertisers
              </h3>
            </div>

            <div className="space-y-6">
              {advertiserSteps.map((step, index) => (
                <Card
                  key={index}
                  className="p-6 flex items-start space-x-4 hover-lift hover-glow animate-slide-in-right group border-primary/20"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-glow group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center mb-2">
                      <step.icon className="text-primary mr-2 group-hover:scale-110 transition-transform" size={22} />
                      <h4 className="text-lg font-semibold group-hover:text-primary transition-colors">{step.title}</h4>
                    </div>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </Card>
              ))}
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full mt-6"
              onClick={scrollToContact}
            >
              Start Advertising
              <ArrowRight className="ml-2" />
            </Button>
          </div>

          {/* Venue Owners Flow */}
          <div>
            <div className="bg-accent/10 inline-block px-6 py-2 rounded-full border border-accent/20 mb-8">
              <h3 className="text-xl font-bold text-accent">
                For Venue Owners
              </h3>
            </div>

            <div className="space-y-6">
              {venueSteps.map((step, index) => (
                <Card
                  key={index}
                  className="p-6 flex items-start space-x-4 hover-lift shadow-glow-accent animate-slide-in-right group border-accent/20"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full gradient-accent flex items-center justify-center text-accent-foreground font-bold text-lg shadow-glow-accent group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center mb-2">
                      <step.icon className="text-accent mr-2 group-hover:scale-110 transition-transform" size={22} />
                      <h4 className="text-lg font-semibold group-hover:text-accent transition-colors">{step.title}</h4>
                    </div>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </Card>
              ))}
            </div>

            <Button
              variant="accent"
              size="lg"
              className="w-full mt-6"
              onClick={scrollToContact}
            >
              List Your Venue
              <ArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
