import { Shield, Smartphone, Lock, CheckCircle, Fingerprint } from "lucide-react";

const SecureLoginIllustration = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative w-64 h-64 mx-auto">
        {/* Central phone */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            {/* Phone body */}
            <div className="w-28 h-48 bg-gradient-to-b from-muted to-muted/80 rounded-3xl border-4 border-border shadow-2xl">
              {/* Screen */}
              <div className="absolute inset-2 bg-background rounded-2xl overflow-hidden">
                {/* Status bar */}
                <div className="h-6 bg-muted/50 flex items-center justify-center">
                  <div className="w-16 h-1.5 bg-border rounded-full" />
                </div>
                
                {/* OTP Display */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-center gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div 
                        key={i} 
                        className="w-4 h-5 bg-primary/20 rounded border border-primary/30 flex items-center justify-center"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        <span className="text-[8px] font-bold text-primary">•</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Verify button */}
                  <div className="w-full h-6 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-[8px] text-primary-foreground font-medium">Verify</span>
                  </div>
                </div>
                
                {/* Fingerprint icon */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <Fingerprint className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating security elements */}
        <div className="absolute top-4 right-4 animate-bounce" style={{ animationDuration: '3s' }}>
          <div className="p-3 bg-success/10 rounded-xl border border-success/20 shadow-lg">
            <Shield className="h-6 w-6 text-success" />
          </div>
        </div>

        <div className="absolute bottom-8 left-2 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 shadow-lg">
            <Lock className="h-5 w-5 text-primary" />
          </div>
        </div>

        <div className="absolute top-12 left-0 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <div className="p-2 bg-accent/20 rounded-lg border border-accent/30 shadow-lg">
            <CheckCircle className="h-5 w-5 text-accent-foreground" />
          </div>
        </div>

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 256 256">
          <path
            d="M 200 40 Q 180 80 140 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="text-border"
          />
          <path
            d="M 40 180 Q 60 160 100 150"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="text-border"
          />
          <path
            d="M 30 80 Q 60 90 100 110"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="text-border"
          />
        </svg>
      </div>

      {/* Text label */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Secure OTP Authentication
      </p>
    </div>
  );
};

export default SecureLoginIllustration;
