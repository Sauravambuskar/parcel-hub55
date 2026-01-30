import warehouseBg from "@/assets/warehouse-bg.jpg";
import parcelsBg from "@/assets/parcels-bg.jpg";
import logisticsBg from "@/assets/logistics-bg.jpg";
import shippingBg from "@/assets/shipping-bg.jpg";

type BackgroundVariant = "warehouse" | "parcels" | "logistics" | "shipping";

interface PageBackgroundProps {
  variant?: BackgroundVariant;
  opacity?: number;
  children?: React.ReactNode;
}

const backgrounds: Record<BackgroundVariant, string> = {
  warehouse: warehouseBg,
  parcels: parcelsBg,
  logistics: logisticsBg,
  shipping: shippingBg,
};

const PageBackground = ({ 
  variant = "warehouse", 
  opacity = 0.6,
  children 
}: PageBackgroundProps) => {
  return (
    <>
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgrounds[variant]})` }}
      />
      
      {/* Dark overlay for readability */}
      <div 
        className="fixed inset-0 bg-black" 
        style={{ opacity }}
      />
      
      {/* Gradient overlay for depth */}
      <div className="fixed inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      
      {/* Content */}
      {children}
    </>
  );
};

export default PageBackground;