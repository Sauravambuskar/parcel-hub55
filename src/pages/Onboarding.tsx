import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, MapPin, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      icon: Package,
      title: "Send Anything, Anywhere",
      description: "From documents to packages, send items from Pune to anywhere in India with trusted courier partners"
    },
    {
      icon: MapPin,
      title: "Compare & Choose",
      description: "View multiple courier options with real-time pricing, delivery times, and ratings to pick the best fit"
    },
    {
      icon: Clock,
      title: "Track in Real-Time",
      description: "Get live updates on your package location and delivery status from pickup to doorstep"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/');
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  const currentSlideData = slides[currentSlide];
  const IconComponent = currentSlideData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Setu
          </h1>
          <Button variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
        </div>

        {/* Slide Content */}
        <Card className="text-center">
          <CardContent className="p-8 space-y-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto shadow-lg">
              <IconComponent className="h-12 w-12 text-white" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{currentSlideData.title}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {currentSlideData.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dots Indicator */}
        <div className="flex justify-center space-x-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            className="flex items-center gap-2"
          >
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;