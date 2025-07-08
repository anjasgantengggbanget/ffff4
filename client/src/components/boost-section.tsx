import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Rocket, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface BoostSectionProps {
  user: User;
}

export default function BoostSection({ user }: BoostSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: boosts } = useQuery({
    queryKey: ["/api/boosts"],
  });

  const { data: activeBoost } = useQuery({
    queryKey: [`/api/users/${user.id}/active-boost`],
  });

  const purchaseBoostMutation = useMutation({
    mutationFn: async (boostId: number) => {
      const response = await apiRequest("POST", `/api/users/${user.id}/boosts/${boostId}/purchase`, {});
      return response.json();
    },
    onSuccess: (data, boostId) => {
      const boost = boosts?.find(b => b.id === boostId);
      toast({
        title: "Boost Purchased!",
        description: `You activated ${boost?.name}. Your farming is now ${boost?.multiplier}x faster!`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.telegramId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/active-boost`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateBoostProgress = () => {
    if (!user.boostEndTime) return 0;
    
    const now = new Date();
    const end = new Date(user.boostEndTime);
    const start = new Date(end.getTime() - (24 * 60 * 60 * 1000)); // Assume 24h boost
    
    if (now >= end) return 0;
    
    const total = end.getTime() - start.getTime();
    const remaining = end.getTime() - now.getTime();
    
    return Math.max(0, (remaining / total) * 100);
  };

  const getBoostTimeLeft = () => {
    if (!user.boostEndTime) return "";
    
    const now = new Date();
    const end = new Date(user.boostEndTime);
    
    if (now >= end) return "Expired";
    
    const diff = end.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const boostProgress = calculateBoostProgress();
  const hasActiveBoost = parseFloat(user.boostMultiplier) > 1 && boostProgress > 0;

  return (
    <section className="p-6">
      <h2 className="text-xl font-bold mb-4">Boost Plans</h2>
      
      {/* Current Boost */}
      {hasActiveBoost && (
        <div className="bg-farming-secondary rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-farming-accent" />
              <span className="font-semibold">Current Boost</span>
            </div>
            <Badge className="bg-farming-accent text-farming-primary">
              {user.boostMultiplier}x
            </Badge>
          </div>
          <Progress value={boostProgress} className="mb-2" />
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{getBoostTimeLeft()}</span>
            <span>
              <Clock className="inline h-3 w-3 mr-1" />
              {Math.floor(boostProgress)}% remaining
            </span>
          </div>
        </div>
      )}

      {/* Boost Plans */}
      <div className="space-y-3">
        {boosts?.map((boost) => {
          const canAfford = parseFloat(user.balance) >= parseFloat(boost.price);
          const isVip = boost.name.toLowerCase().includes("vip");
          
          return (
            <div
              key={boost.id}
              className={`rounded-xl p-4 flex items-center justify-between ${
                isVip 
                  ? "bg-gradient-to-r from-purple-600 to-pink-600" 
                  : "bg-farming-secondary"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isVip ? "bg-white bg-opacity-20" : "bg-farming-accent"
                }`}>
                  <Rocket className={`h-6 w-6 ${
                    isVip ? "text-white" : "text-farming-primary"
                  }`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${isVip ? "text-white" : "text-white"}`}>
                    {boost.name}
                  </h3>
                  <p className={`text-sm ${
                    isVip ? "text-gray-200" : "text-gray-400"
                  }`}>
                    {boost.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {boost.multiplier}x Speed
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {boost.duration}h Duration
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-lg ${
                  isVip ? "text-white" : "text-farming-accent"
                }`}>
                  {parseFloat(boost.price).toLocaleString()} USDT
                </div>
                <Button
                  onClick={() => purchaseBoostMutation.mutate(boost.id)}
                  disabled={!canAfford || purchaseBoostMutation.isPending || hasActiveBoost}
                  className={`mt-1 ${
                    isVip 
                      ? "bg-white text-purple-600 hover:bg-gray-100" 
                      : "bg-farming-accent text-farming-primary hover:bg-farming-accent/90"
                  }`}
                  size="sm"
                >
                  {hasActiveBoost ? "Active" : !canAfford ? "Insufficient" : "Buy"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Boost Benefits */}
      <div className="bg-farming-secondary rounded-xl p-4 mt-6">
        <h3 className="font-semibold mb-3">🚀 Boost Benefits</h3>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <span className="text-farming-accent">•</span>
            <span>Multiply your farming speed by up to 5x</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-farming-accent">•</span>
            <span>Stack with referral bonuses for maximum earnings</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-farming-accent">•</span>
            <span>VIP boosts include exclusive features and priority support</span>
          </div>
        </div>
      </div>
    </section>
  );
}
