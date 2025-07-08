import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import FarmingSection from "@/components/farming-section";
import TasksSection from "@/components/tasks-section";
import ReferralSection from "@/components/referral-section";
import WalletSection from "@/components/wallet-section";
import BoostSection from "@/components/boost-section";
import BottomNav from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useLocation } from "wouter";

type Section = "farming" | "tasks" | "referral" | "wallet" | "boost";

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("farming");
  const [, navigate] = useLocation();

  // Mock user data - in a real app, this would come from Telegram Web App
  const currentUser = {
    id: 1,
    telegramId: "123456789",
    username: "demo_user",
  };

  const { data: user } = useQuery({
    queryKey: [`/api/users/${currentUser.telegramId}`],
    enabled: !!currentUser.telegramId,
  });

  // Auto-create user if not exists
  useEffect(() => {
    if (!user && currentUser.telegramId) {
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: currentUser.telegramId,
          username: currentUser.username,
        }),
      });
    }
  }, [user, currentUser.telegramId, currentUser.username]);

  const renderSection = () => {
    if (!user) return <div className="p-6 text-center">Loading...</div>;

    switch (activeSection) {
      case "farming":
        return <FarmingSection user={user} />;
      case "tasks":
        return <TasksSection user={user} />;
      case "referral":
        return <ReferralSection user={user} />;
      case "wallet":
        return <WalletSection user={user} />;
      case "boost":
        return <BoostSection user={user} />;
      default:
        return <FarmingSection user={user} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-farming-primary min-h-screen text-white mobile-container">
      {/* Header */}
      <header className="bg-farming-secondary p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-farming-accent rounded-full flex items-center justify-center">
            <span className="text-farming-primary text-xl">🌱</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">Farming Pro</h1>
            <p className="text-xs text-gray-400">Telegram Mini App</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-farming-usdt px-3 py-1 rounded-full">
            <span className="text-xs font-semibold">
              {user ? `${parseFloat(user.balance).toLocaleString()} USDT` : "0 USDT"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="text-farming-error hover:text-farming-error/80"
          >
            <Shield className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 min-h-screen">
        {renderSection()}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeSection={activeSection} onSectionChange={setActiveSection} />
    </div>
  );
}
