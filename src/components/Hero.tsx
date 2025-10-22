import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { Link } from "react-router-dom";

const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 z-0 gradient-mesh" />
      
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Modern restaurant with digital advertising screens"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/98 via-background/95 to-primary/10" />
      </div>
      
      {/* Floating orbs for visual interest */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-glow/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
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
            <Link to="/register/advertiser">
              <Button
                variant="hero"
                size="xl"
                className="group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  For Advertisers
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-glow/0 via-primary-foreground/20 to-primary-glow/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </Button>
            </Link>
            <Link to="/register/screen-owner">
              <Button
                variant="outline"
                size="xl"
                className="group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  For Venue Owners
                  <Building2 className="ml-2 group-hover:rotate-12 transition-transform" />
                </span>
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-card/60 backdrop-blur-md rounded-xl p-5 border border-primary/20 hover-lift hover-glow group">
              <div className="flex items-center space-x-2 text-primary mb-1">
                <TrendingUp size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-2xl font-bold">500+</span>
              </div>
              <p className="text-sm text-muted-foreground">Active Venues</p>
            </div>
            <div className="bg-card/60 backdrop-blur-md rounded-xl p-5 border border-accent/20 hover-lift shadow-glow-accent group">
              <div className="flex items-center space-x-2 text-accent mb-1">
                <TrendingUp size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-2xl font-bold">95%</span>
              </div>
              <p className="text-sm text-muted-foreground">Campaign Success</p>
            </div>
            <div className="bg-card/60 backdrop-blur-md rounded-xl p-5 border border-primary/20 hover-lift hover-glow group col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 text-primary mb-1">
                <TrendingUp size={20} className="group-hover:scale-110 transition-transform" />
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
