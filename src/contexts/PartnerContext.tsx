import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  vehicleType: string[];
  serviceAreas: string[];
  isVerified: boolean;
  rating: number;
  totalDeliveries: number;
}

interface PartnerContextType {
  partner: Partner | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updatePartner: (data: Partial<Partner>) => void;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export const usePartner = () => {
  const context = useContext(PartnerContext);
  if (context === undefined) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
};

interface PartnerProviderProps {
  children: ReactNode;
}

export const PartnerProvider = ({ children }: PartnerProviderProps) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email: string, password: string) => {
    // Mock authentication
    const mockPartner: Partner = {
      id: 'partner-1',
      name: 'Rajesh Kumar',
      email,
      phone: '+91 9876543210',
      companyName: 'Swift Logistics',
      vehicleType: ['bike', 'auto'],
      serviceAreas: ['411001', '411002', '411003'],
      isVerified: true,
      rating: 4.7,
      totalDeliveries: 1284
    };
    
    setPartner(mockPartner);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setPartner(null);
    setIsAuthenticated(false);
  };

  const updatePartner = (data: Partial<Partner>) => {
    if (partner) {
      setPartner({ ...partner, ...data });
    }
  };

  return (
    <PartnerContext.Provider value={{
      partner,
      isAuthenticated,
      login,
      logout,
      updatePartner
    }}>
      {children}
    </PartnerContext.Provider>
  );
};