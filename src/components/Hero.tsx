import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Modern restaurant with digital advertising screens"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/90 to-background/70" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
            <span className="text-primary font-semibold text-sm">
              Smart Indoor Advertising Platform
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up">
            Turn Screens Into{" "}
            <span className="gradient-primary bg-clip-text text-transparent">
              Revenue
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl animate-fade-in-up">
            Connect advertisers with high-quality venues for targeted digital
            advertising. AdVenue makes indoor advertising simple, profitable,
            and effective.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-in-up">
            <Button
              variant="hero"
              size="xl"
              onClick={() => scrollToSection("contact")}
              className="group"
            >
              For Advertisers
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="xl"
              onClick={() => scrollToSection("contact")}
              className="group"
            >
              For Venue Owners
              <Building2 className="ml-2" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border">
              <div className="flex items-center space-x-2 text-primary mb-1">
                <TrendingUp size={20} />
                <span className="text-2xl font-bold">500+</span>
              </div>
              <p className="text-sm text-muted-foreground">Active Venues</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border">
              <div className="flex items-center space-x-2 text-accent mb-1">
                <TrendingUp size={20} />
                <span className="text-2xl font-bold">95%</span>
              </div>
              <p className="text-sm text-muted-foreground">Campaign Success</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 text-primary mb-1">
                <TrendingUp size={20} />
                <span className="text-2xl font-bold">$2M+</span>
              </div>
              <p className="text-sm text-muted-foreground">Revenue Generated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
