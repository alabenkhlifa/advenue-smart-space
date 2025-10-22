import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ContactCTA = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "advertiser",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({ name: "", email: "", role: "advertiser", message: "" });
  };

  return (
    <section id="contact" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Ready to{" "}
              <span className="gradient-primary bg-clip-text text-transparent">
                Get Started?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Join hundreds of advertisers and venue owners already using AdVenue
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="p-8 hover-lift border-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-6">Send Us a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="role">I am a...</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
                  >
                    <option value="advertiser">Advertiser</option>
                    <option value="venue">Venue Owner</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your needs..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                  />
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full group">
                  Send Message
                  <Send className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                </Button>
              </form>
              </div>
            </Card>

            {/* Contact Info & CTA */}
            <div className="space-y-6">
              <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 hover-lift hover-glow relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 animate-pulse-glow" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4">
                    Let's Transform Your Advertising
                  </h3>
                <p className="text-muted-foreground mb-6">
                  Whether you're looking to advertise or monetize your venue,
                  we're here to help you succeed.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3 group">
                    <Mail className="text-primary mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" size={20} />
                    <div>
                      <p className="font-semibold">Email</p>
                      <a
                        href="mailto:hello@advenue.com"
                        className="text-muted-foreground hover:text-primary transition-smooth"
                      >
                        hello@advenue.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 group">
                    <Phone className="text-primary mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" size={20} />
                    <div>
                      <p className="font-semibold">Phone</p>
                      <a
                        href="tel:+1234567890"
                        className="text-muted-foreground hover:text-primary transition-smooth"
                      >
                        +1 (234) 567-890
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 group">
                    <MapPin className="text-primary mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" size={20} />
                    <div>
                      <p className="font-semibold">Address</p>
                      <p className="text-muted-foreground">
                        123 Innovation Street
                        <br />
                        San Francisco, CA 94105
                      </p>
                    </div>
                  </div>
                </div>
                </div>
              </Card>

              <Card className="p-8 gradient-hero text-primary-foreground hover-lift shadow-glow relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/10 to-transparent pointer-events-none" />
                <div className="relative z-10">
                <h4 className="text-xl font-bold mb-2">Quick Stats</h4>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-3xl font-bold">500+</p>
                    <p className="text-sm opacity-90">Active Venues</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">1000+</p>
                    <p className="text-sm opacity-90">Campaigns</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">95%</p>
                    <p className="text-sm opacity-90">Success Rate</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">24/7</p>
                    <p className="text-sm opacity-90">Support</p>
                  </div>
                </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactCTA;
