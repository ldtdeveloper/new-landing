"use client";

import { useEffect, useState } from "react";

const API_BASE = "https://api.voicequik.com";

type Plan = {
  id: number;
  name: string;
  description?: string;
  price?: number;
  is_active: boolean;
  is_trial?: boolean;
  wallet_credits?: number;
  features?: string[];
  code?: string;
};

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function selectPlanById(planId: number) {
  if (typeof window !== "undefined" && (window as any).selectPlanById) {
    (window as any).selectPlanById(planId);
  }
}

export function PricingPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchPlans() {
      try {
        const response = await fetch(`${API_BASE}/api/plans/public`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Failed to fetch plans");
        const data: Plan[] = await response.json();
        if (!cancelled) {
          const list = Array.isArray(data) ? data : [];
          const active = list.filter((p) => p.is_active);
          setPlans(active);
          setError(null);
          // Expose for script.js selectPlanById(planId) and register modal
          if (typeof window !== "undefined") (window as any).allPlans = list;
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load plans. Please refresh the page.");
          setPlans([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="col-span-full text-center text-gray-400 py-12">Loading plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const activePlans = plans.filter((p) => p.is_active);
  const totalCards = activePlans.length + 1;

  const gridClass =
    totalCards <= 4
      ? totalCards === 1
        ? "grid grid-cols-1 gap-6 md:gap-8"
        : totalCards === 2
          ? "grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8"
          : totalCards === 3
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
      : "flex flex-wrap justify-center items-start gap-6 md:gap-8";

  const cardWidthClass = totalCards > 4 ? "w-full max-w-[320px] flex-shrink-0" : "w-full max-w-full";

  return (
    <div className={gridClass}>
      {activePlans.map((plan, index) => {
        const isPopular = index === 1;
        const isCustomPrice = !plan.price || plan.price === 0;
        const isTrial = !!plan.is_trial;
        const cardClass = isTrial
          ? "rounded-2xl border border-gray-200 bg-white/70 p-5 md:p-6 flex flex-col"
          : "glass-card rounded-2xl p-6 md:p-8 card-hover flex flex-col";
        const popularClass = isPopular && !isTrial ? " border-2 border-purple-300 relative popular-glow" : "";

        return (
          <div key={plan.id} className={`${cardClass}${popularClass} ${cardWidthClass}`}>
            {isPopular && !isTrial && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg">
                  Most Popular
                </span>
              </div>
            )}
            <div className={`text-center mb-6 ${isPopular && !isTrial ? "mt-2" : ""}`}>
              <h3 className="text-2xl font-bold mb-2 text-gray-800">{plan.name}</h3>
              <p className="text-gray-500 mb-4">{plan.description || "Choose this plan"}</p>
              <div
                className={
                  isTrial ? "text-base font-semibold text-gray-800 mb-1" : "text-5xl font-extrabold gradient-text"
                }
              >
                {isTrial ? "Free Trial" : `$${plan.price ?? 0}`}
                {!isCustomPrice && !isTrial && <span className="text-lg font-normal text-gray-400">/month</span>}
              </div>
              {plan.wallet_credits != null && (
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-xs font-medium text-purple-700">
                  {isTrial
                    ? `Free $${plan.wallet_credits} Credits/14 days`
                    : `Free $${plan.wallet_credits} Credits`}
                </div>
              )}
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              {plan.features && plan.features.length > 0 ? (
                plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <CheckIcon />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500">No features listed</li>
              )}
            </ul>
            <div className="mt-auto">
              {plan.is_trial ? (
                <button
                  type="button"
                  onClick={() => selectPlanById(plan.id)}
                  className="w-full btn-gradient py-3.5 rounded-full text-white font-semibold"
                  data-plan-id={plan.id}
                >
                  Start 14 day free trial
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => selectPlanById(plan.id)}
                  className="w-full btn-gradient py-3.5 rounded-full text-white font-semibold"
                  data-plan-id={plan.id}
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Custom Plan card */}
      <div className={`glass-card rounded-2xl p-6 md:p-8 card-hover flex flex-col ${cardWidthClass}`}>
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2 text-gray-800">Custom Plan</h3>
          <p className="text-gray-500 mb-4">Customize plan according to business needs</p>
          <div className="text-5xl font-extrabold gradient-text">Custom</div>
        </div>
        <ul className="space-y-4 mb-8 flex-grow">
          {["Unlimited agents", "Custom integrations", "Dedicated support", "SLA guarantee"].map((text, i) => (
            <li key={i} className="flex items-center space-x-3">
              <CheckIcon />
              <span className="text-gray-600">{text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto">
          <button
            type="button"
            className="w-full py-3.5 rounded-full border-2 border-purple-200 text-purple-600 font-semibold hover:bg-purple-50 transition-colors"
          >
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}
