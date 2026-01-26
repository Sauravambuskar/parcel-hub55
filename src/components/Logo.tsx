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
      text: "text-4xl md:text-5xl"
    }
  };
  return <div className={cn("flex items-center", className)}>
      {showText && <h1 className={cn("font-bold text-foreground", sizeClasses[size].text)}>
          Via<span className="bg-primary text-primary-foreground px-1 rounded">Setu.</span>
        </h1>}
    </div>;
};
export default Logo;