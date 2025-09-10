import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const Logo = ({ className, size = "md", showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: {
      container: "h-8 w-8",
      icon: "h-4 w-4",
      text: "text-lg"
    },
    md: {
      container: "h-12 w-12",
      icon: "h-6 w-6", 
      text: "text-2xl"
    },
    lg: {
      container: "h-16 w-16",
      icon: "h-8 w-8",
      text: "text-3xl"
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden",
        sizeClasses[size].container
      )}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/10 rounded-full" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-white/10 rounded-full" />
        
        {/* Icon */}
        <Package className={cn("text-white relative z-10", sizeClasses[size].icon)} />
      </div>
      
      {showText && (
        <h1 className={cn(
          "font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent",
          sizeClasses[size].text
        )}>
          viaSetu
        </h1>
      )}
    </div>
  );
};

export default Logo;