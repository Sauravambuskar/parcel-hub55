import { cn } from "@/lib/utils";
import logoAsset from "@/assets/viasetu-logo.png.asset.json";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Use white/inverted variant for dark backgrounds */
  variant?: "default" | "light";
  /** Kept for backwards compatibility; logo image always shows wordmark */
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-6 md:h-7",
  md: "h-8 md:h-9",
  lg: "h-10 md:h-12",
};

const Logo = ({ className, size = "md", variant = "default" }: LogoProps) => {
  return (
    <img
      src={logoAsset.url}
      alt="ViaSetu"
      width={400}
      height={120}
      decoding="async"
      loading="eager"
      className={cn(
        "w-auto select-none",
        sizeClasses[size],
        variant === "light" && "brightness-0 invert",
        className
      )}
      draggable={false}
    />
  );
};

export default Logo;
