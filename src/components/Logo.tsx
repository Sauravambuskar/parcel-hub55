import { cn } from "@/lib/utils";
interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}
const Logo = ({
  className,
  size = "md",
  showText = true
}: LogoProps) => {
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
  return <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("bg-secondary rounded-xl flex items-center justify-center shadow-glow relative overflow-hidden border-2 border-primary", sizeClasses[size].container)}>
        {/* Background Pattern */}
        
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/20 rounded-full" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-primary/20 rounded-full" />
        
        {/* Icon */}
        
      </div>
      
      {showText && <h1 className={cn("font-bold text-foreground", sizeClasses[size].text)}>
          Via<span className="text-primary">Setu.</span>
        </h1>}
    </div>;
};
export default Logo;