"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const CurrencyContext = createContext<any>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState("PKR");
  
  // Default/Fallback rates (agar live API fail ho jaye)
  const [rates, setRates] = useState<{ [key: string]: number }>({
    PKR: 1,
    USD: 0.0036,
    EUR: 0.0033,
  });

  const symbols: { [key: string]: string } = {
    PKR: "Rs. ",
    USD: "$",
    EUR: "€",
  };

  // Fetch live exchange rates from a free API on mount
  useEffect(() => {
    const fetchLiveRates = async () => {
      try {
        // Free open-source currency exchange rate API based on USD or PKR
        const res = await axios.get("https://open.er-api.com/v6/latest/PKR");
        if (res.data && res.data.rates) {
          const apiRates = res.data.rates;
          setRates({
            PKR: 1,
            USD: apiRates.USD || 0.0036,
            EUR: apiRates.EUR || 0.0033,
          });
        }
      } catch (err) {
        console.error("Failed to fetch live exchange rates, using fallback rates:", err);
      }
    };

    fetchLiveRates();
  }, []);

  const convertPrice = (priceInPKR: number) => {
    const rate = rates[currency] || 1;
    const converted = priceInPKR * rate;
    return `${symbols[currency]}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, rates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}