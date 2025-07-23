import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  Mail, 
  HelpCircle,
  Star,
  Send
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Support = () => {
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [rating, setRating] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const commonIssues = [
    "Delivery Delayed",
    "Package Damaged",
    "Wrong Address",
    "Payment Issue",
    "Courier Contact",
    "Track Package",
    "Refund Request",
    "Other"
  ];

  const handleSubmitTicket = () => {
    if (!selectedIssue || !message) {
      toast({
        title: "Missing Information",
        description: "Please select an issue type and describe your problem",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Support Ticket Created",
      description: "We'll get back to you within 24 hours",
    });

    // Reset form
    setSelectedIssue('');
    setMessage('');
    setOrderId('');
  };

  const handleRatingSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Thank you for your feedback!",
      description: "Your rating helps us improve our service",
    });

    setRating(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-50">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Support & Help</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        {/* Quick Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Need Immediate Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-16 flex-col gap-2">
                <Phone className="h-5 w-5" />
                <span className="text-sm">Call Support</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-2">
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm">Live Chat</span>
              </Button>
            </div>
            <Button variant="outline" className="w-full h-12 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Email: support@setu.delivery</span>
            </Button>
          </CardContent>
        </Card>

        {/* Rate Your Experience */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Your Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-colors"
                >
                  <Star 
                    className={`h-8 w-8 ${
                      star <= rating 
                        ? 'fill-warning text-warning' 
                        : 'text-muted-foreground'
                    }`} 
                  />
                </button>
              ))}
            </div>
            <Button 
              onClick={handleRatingSubmit}
              disabled={rating === 0}
              className="w-full"
            >
              Submit Rating
            </Button>
          </CardContent>
        </Card>

        {/* Report an Issue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Report an Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Order ID (Optional)</label>
              <Input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter your order ID"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">What's the issue?</label>
              <div className="flex flex-wrap gap-2">
                {commonIssues.map((issue) => (
                  <Badge
                    key={issue}
                    variant={selectedIssue === issue ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    {issue}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Describe your problem</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please provide details about your issue..."
                rows={4}
              />
            </div>

            <Button 
              onClick={handleSubmitTicket}
              className="w-full flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Submit Support Ticket
            </Button>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "How can I track my package?",
              "What if my package is delayed?",
              "How do I change delivery address?",
              "What payment methods are accepted?",
              "How do I cancel an order?"
            ].map((faq, index) => (
              <button
                key={index}
                className="w-full text-left p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm"
              >
                {faq}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;