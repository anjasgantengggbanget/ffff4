import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import type { User } from "@shared/schema";

interface WalletSectionProps {
  user: User;
}

export default function WalletSection({ user }: WalletSectionProps) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions } = useQuery({
    queryKey: [`/api/users/${user.id}/transactions`],
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await apiRequest("POST", "/api/transactions/deposit", {
        userId: user.id,
        amount: amount,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const depositAmount = parseFloat(amount);
      const isFirstDeposit = !user.hasFirstDeposit && depositAmount >= 5;
      
      toast({
        title: "Deposit Successful!",
        description: isFirstDeposit 
          ? "First deposit completed! You can now withdraw funds." 
          : "Your deposit has been processed.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.telegramId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/transactions`] });
      setShowDeposit(false);
      setAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await apiRequest("POST", "/api/transactions/withdraw", {
        userId: user.id,
        amount: amount,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Requested!",
        description: "Your withdrawal request has been submitted for approval.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.telegramId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/transactions`] });
      setShowWithdraw(false);
      setAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeposit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }
    depositMutation.mutate(amount);
  };

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }
    if (parseFloat(amount) < 12) {
      toast({
        title: "Minimum Withdrawal",
        description: "Minimum withdrawal amount is $12.",
        variant: "destructive",
      });
      return;
    }
    if (parseFloat(amount) > parseFloat(user.balance)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal.",
        variant: "destructive",
      });
      return;
    }
    withdrawMutation.mutate(amount);
  };

  const getWithdrawalStatus = () => {
    if (!user.hasFirstDeposit) {
      return {
        canWithdraw: false,
        message: "You need to make a first deposit of $5 to enable withdrawals"
      };
    }
    
    const totalWithdrawn = parseFloat(user.totalWithdrawn || "0");
    const totalDeposited = parseFloat(user.totalDeposited || "0");
    const requiredDeposit = 5 + (totalWithdrawn > 0 ? (totalWithdrawn / 1) * 3 : 0);
    
    if (totalDeposited < requiredDeposit) {
      const needed = (requiredDeposit - totalDeposited).toFixed(2);
      return {
        canWithdraw: false,
        message: `You need to deposit $${needed} more to withdraw (total required: $${requiredDeposit.toFixed(2)})`
      };
    }
    
    return {
      canWithdraw: true,
      message: "You can withdraw funds (minimum $12)"
    };
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <TrendingUp className="h-4 w-4 text-farming-success" />;
      case "withdrawal":
        return <TrendingDown className="h-4 w-4 text-farming-error" />;
      case "farming":
        return <span className="text-farming-accent">🌱</span>;
      case "task":
        return <span className="text-farming-usdt">📋</span>;
      case "referral":
        return <span className="text-farming-success">👥</span>;
      default:
        return <Wallet className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "deposit":
      case "farming":
      case "task":
      case "referral":
        return "text-farming-success";
      case "withdrawal":
        return "text-farming-error";
      default:
        return "text-gray-400";
    }
  };

  return (
    <section className="p-6">
      <h2 className="text-xl font-bold mb-4">Wallet</h2>
      
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-farming-usdt to-green-600 rounded-xl p-6 mb-4 text-center">
        <div className="text-4xl font-bold mb-2">
          {parseFloat(user.balance).toLocaleString()}
        </div>
        <div className="text-sm opacity-90">USDT Balance</div>
      </div>

      {/* Withdrawal Status */}
      <div className="bg-farming-secondary rounded-xl p-4 mb-4">
        <h3 className="font-semibold mb-2">Withdrawal Status</h3>
        <div className={`text-sm p-2 rounded-lg ${
          getWithdrawalStatus().canWithdraw 
            ? "bg-farming-success text-white" 
            : "bg-farming-warning text-farming-primary"
        }`}>
          {getWithdrawalStatus().message}
        </div>
        <div className="mt-3 text-xs text-gray-400 space-y-1">
          <div>• Minimum withdrawal: $12</div>
          <div>• First deposit requirement: $5</div>
          <div>• Each withdrawal requires $3 deposit fee</div>
          <div>• Total deposited: ${parseFloat(user.totalDeposited || "0").toLocaleString()}</div>
          <div>• Total withdrawn: ${parseFloat(user.totalWithdrawn || "0").toLocaleString()}</div>
        </div>
      </div>

      {/* Wallet Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          onClick={() => setShowDeposit(true)}
          className="bg-farming-success text-white py-4 rounded-xl font-semibold hover:bg-farming-success/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Deposit
        </Button>
        <Button
          onClick={() => setShowWithdraw(true)}
          disabled={!getWithdrawalStatus().canWithdraw}
          className={`py-4 rounded-xl font-semibold ${
            getWithdrawalStatus().canWithdraw
              ? "bg-farming-warning text-farming-primary hover:bg-farming-warning/90"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Minus className="mr-2 h-4 w-4" />
          Withdraw
        </Button>
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="bg-farming-secondary rounded-xl p-4 mb-4">
          <h3 className="font-semibold mb-3">Deposit USDT</h3>
          <div className="space-y-3">
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-farming-primary text-white border-gray-600"
            />
            <div className="flex space-x-2">
              <Button
                onClick={handleDeposit}
                disabled={depositMutation.isPending}
                className="flex-1 bg-farming-success text-white"
              >
                {depositMutation.isPending ? "Processing..." : "Deposit"}
              </Button>
              <Button
                onClick={() => setShowDeposit(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="bg-farming-secondary rounded-xl p-4 mb-4">
          <h3 className="font-semibold mb-3">Withdraw USDT</h3>
          <div className="space-y-3">
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-farming-primary text-white border-gray-600"
            />
            <p className="text-xs text-gray-400">
              Available: {parseFloat(user.balance).toLocaleString()} USDT
            </p>
            <div className="flex space-x-2">
              <Button
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending}
                className="flex-1 bg-farming-warning text-farming-primary"
              >
                {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
              </Button>
              <Button
                onClick={() => setShowWithdraw(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-farming-secondary rounded-xl p-4">
        <h3 className="font-semibold mb-3">Recent Transactions</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {transactions?.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
              <div className="flex items-center space-x-3">
                {getTransactionIcon(transaction.type)}
                <div>
                  <div className="text-sm font-semibold capitalize">
                    {transaction.type}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                  {parseFloat(transaction.amount) > 0 ? "+" : ""}
                  {parseFloat(transaction.amount).toLocaleString()} USDT
                </div>
                <Badge
                  variant={transaction.status === "completed" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {transaction.status}
                </Badge>
              </div>
            </div>
          ))}
          {(!transactions || transactions.length === 0) && (
            <p className="text-gray-400 text-center py-4">No transactions yet</p>
          )}
        </div>
      </div>
    </section>
  );
}
