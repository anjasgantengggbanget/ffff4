import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface FarmingSectionProps {
  user: User;
}

export default function FarmingSection({ user }: FarmingSectionProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startFarmingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/farming/start", {
        userId: user.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Farming Started!",
        description: "Your farming session has begun. Come back in 4 hours to claim your rewards.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.telegramId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const claimFarmingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/farming/claim", {
        userId: user.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Farming Claimed!",
        description: "Your farming rewards have been added to your balance.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.telegramId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate farming progress
  const calculateProgress = () => {
    if (!user.farmingStartTime || !user.farmingEndTime) return 0;
    
    const now = new Date();
    const start = new Date(user.farmingStartTime);
    const end = new Date(user.farmingEndTime);
    
    if (now >= end) return 100;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    return Math.max(0, (elapsed / total) * 100);
  };

  // Calculate time remaining
  const calculateTimeLeft = () => {
    if (!user.farmingEndTime) return "";
    
    const now = new Date();
    const end = new Date(user.farmingEndTime);
    
    if (now >= end) return "Ready to claim!";
    
    const diff = end.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m left`;
  };

  // Update time left every second
  useState(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  });

  const progress = calculateProgress();
  const isActive = user.farmingStartTime && user.farmingEndTime;
  const isComplete = progress >= 100;

  return (
    <section className="p-6 text-center">
      <div className="mb-6">
        {/* Farming Character */}
        <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-farming-pink to-pink-600 rounded-full flex items-center justify-center farming-float">
          <div className="text-6xl">🌱</div>
        </div>
        
        {/* Farming Progress */}
        <div className="bg-farming-secondary rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Daily Farming</span>
            <span className="text-sm text-farming-accent">
              {timeLeft || "Not started"}
            </span>
          </div>
          <Progress value={progress} className="mb-2" />
          <p className="text-xs text-gray-400">
            +{user.farmingRate} USDT/hour × {user.boostMultiplier}x boost
          </p>
        </div>

        {/* Farming Button */}
        {!isActive ? (
          <Button
            onClick={() => startFarmingMutation.mutate()}
            disabled={startFarmingMutation.isPending}
            className="w-full bg-farming-accent text-farming-primary font-bold py-4 rounded-xl text-lg hover:bg-farming-accent/90"
          >
            <Play className="mr-2 h-5 w-5" />
            Start Farming
          </Button>
        ) : isComplete ? (
          <Button
            onClick={() => claimFarmingMutation.mutate()}
            disabled={claimFarmingMutation.isPending}
            className="w-full bg-farming-success text-white font-bold py-4 rounded-xl text-lg hover:bg-farming-success/90"
          >
            <Gift className="mr-2 h-5 w-5" />
            Claim Rewards
          </Button>
        ) : (
          <Button
            disabled
            className="w-full bg-gray-600 text-gray-400 font-bold py-4 rounded-xl text-lg cursor-not-allowed"
          >
            Farming in Progress...
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-farming-secondary rounded-xl p-4">
          <div className="text-2xl font-bold text-farming-accent">
            {parseFloat(user.totalEarned).toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">Total Earned</div>
        </div>
        <div className="bg-farming-secondary rounded-xl p-4">
          <div className="text-2xl font-bold text-farming-usdt">
            {parseFloat(user.referralEarnings).toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">Referral Earnings</div>
        </div>
      </div>
    </section>
  );
}
