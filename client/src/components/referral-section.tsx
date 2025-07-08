import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Users, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface ReferralSectionProps {
  user: User;
}

export default function ReferralSection({ user }: ReferralSectionProps) {
  const { toast } = useToast();

  const { data: referralStats } = useQuery({
    queryKey: [`/api/users/${user.id}/referral-stats`],
  });

  const referralLink = `https://t.me/farmingpro_bot?start=ref_${user.id}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard.",
    });
  };

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join Farming Pro",
        text: "Start earning USDT with this amazing farming bot!",
        url: referralLink,
      });
    } else {
      copyReferralLink();
    }
  };

  return (
    <section className="p-6">
      <h2 className="text-xl font-bold mb-4">Referral System</h2>
      
      {/* Referral Stats */}
      <div className="bg-farming-secondary rounded-xl p-4 mb-4">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-farming-accent">
            {parseFloat(user.referralEarnings).toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Total Referral Earnings</div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-farming-usdt">
              {referralStats?.level1 || 0}
            </div>
            <div className="text-xs text-gray-400">Level 1</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-farming-usdt">
              {referralStats?.level2 || 0}
            </div>
            <div className="text-xs text-gray-400">Level 2</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-farming-usdt">
              {referralStats?.level3 || 0}
            </div>
            <div className="text-xs text-gray-400">Level 3</div>
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-farming-secondary rounded-xl p-4 mb-4">
        <h3 className="font-semibold mb-2">Your Referral Link</h3>
        <div className="flex items-center space-x-2">
          <Input
            value={referralLink}
            readOnly
            className="flex-1 bg-farming-primary text-white border-gray-600"
          />
          <Button
            onClick={copyReferralLink}
            className="bg-farming-accent text-farming-primary hover:bg-farming-accent/90"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex space-x-2 mt-3">
          <Button
            onClick={shareReferralLink}
            className="flex-1 bg-farming-usdt text-white hover:bg-farming-usdt/90"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Link
          </Button>
          <Button
            onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join me on Farming Pro and start earning USDT!")}`)}
            className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
          >
            <Users className="mr-2 h-4 w-4" />
            Share on Telegram
          </Button>
        </div>
      </div>

      {/* Referral Bonus Structure */}
      <div className="bg-farming-secondary rounded-xl p-4">
        <h3 className="font-semibold mb-3">Bonus Structure</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-2 bg-farming-primary rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-farming-accent rounded-full flex items-center justify-center">
                <span className="text-farming-primary font-bold text-sm">1</span>
              </div>
              <span className="text-sm">Level 1 (Direct)</span>
            </div>
            <span className="text-farming-accent font-semibold">10%</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-farming-primary rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-farming-usdt rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <span className="text-sm">Level 2</span>
            </div>
            <span className="text-farming-accent font-semibold">5%</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-farming-primary rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-farming-success rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <span className="text-sm">Level 3</span>
            </div>
            <span className="text-farming-accent font-semibold">2%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
