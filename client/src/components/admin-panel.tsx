import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type AdminSection = "users" | "referrals" | "boosts" | "deposits" | "withdrawals" | "tasks";

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState<AdminSection>("users");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["/api/admin/withdrawals"],
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/transactions/${id}/status`, { status });
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Transaction Updated",
        description: `Transaction ${variables.status} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
    },
  });

  const renderSection = () => {
    switch (activeSection) {
      case "users":
        return (
          <div className="bg-farming-secondary rounded-xl p-4">
            <h2 className="text-lg font-bold mb-4">User Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2">User ID</th>
                    <th className="text-left py-2">Username</th>
                    <th className="text-left py-2">Balance</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user) => (
                    <tr key={user.id} className="border-b border-gray-800">
                      <td className="py-2">{user.id}</td>
                      <td className="py-2">@{user.username}</td>
                      <td className="py-2 text-farming-usdt">
                        {parseFloat(user.balance).toLocaleString()} USDT
                      </td>
                      <td className="py-2">
                        <Badge className={user.isActive ? "bg-farming-success" : "bg-farming-error"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Button size="sm" variant="destructive" className="mr-1">
                          Ban
                        </Button>
                        <Button size="sm" className="bg-farming-accent text-farming-primary">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "referrals":
        return (
          <div className="bg-farming-secondary rounded-xl p-4">
            <h2 className="text-lg font-bold mb-4">Referral Commission Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Level 1 Commission (%)</label>
                <Input
                  type="number"
                  defaultValue="10"
                  className="bg-farming-primary text-white border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Level 2 Commission (%)</label>
                <Input
                  type="number"
                  defaultValue="5"
                  className="bg-farming-primary text-white border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Level 3 Commission (%)</label>
                <Input
                  type="number"
                  defaultValue="2"
                  className="bg-farming-primary text-white border-gray-600"
                />
              </div>
              <Button className="bg-farming-success text-white">
                Update Settings
              </Button>
            </div>
          </div>
        );

      case "withdrawals":
        return (
          <div className="bg-farming-secondary rounded-xl p-4">
            <h2 className="text-lg font-bold mb-4">Withdrawal Requests</h2>
            <div className="space-y-3">
              {withdrawals?.map((withdrawal) => (
                <div key={withdrawal.id} className="bg-farming-primary rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">User ID: {withdrawal.userId}</div>
                    <div className="text-sm text-gray-400">
                      {Math.abs(parseFloat(withdrawal.amount)).toLocaleString()} USDT
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(withdrawal.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => updateTransactionMutation.mutate({ id: withdrawal.id, status: "completed" })}
                      disabled={updateTransactionMutation.isPending}
                      className="bg-farming-success text-white"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateTransactionMutation.mutate({ id: withdrawal.id, status: "failed" })}
                      disabled={updateTransactionMutation.isPending}
                      variant="destructive"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              {(!withdrawals || withdrawals.length === 0) && (
                <p className="text-gray-400 text-center py-4">No pending withdrawals</p>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-farming-secondary rounded-xl p-4">
            <h2 className="text-lg font-bold mb-4">Coming Soon</h2>
            <p className="text-gray-400">This section is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-farming-secondary rounded-xl p-4">
          <div className="text-2xl font-bold text-farming-accent">
            {stats?.totalUsers || 0}
          </div>
          <div className="text-sm text-gray-400">Total Users</div>
        </div>
        <div className="bg-farming-secondary rounded-xl p-4">
          <div className="text-2xl font-bold text-farming-usdt">
            {stats?.totalUsdt ? parseFloat(stats.totalUsdt).toLocaleString() : 0}
          </div>
          <div className="text-sm text-gray-400">Total USDT</div>
        </div>
        <div className="bg-farming-secondary rounded-xl p-4">
          <div className="text-2xl font-bold text-farming-success">
            {stats?.activeFarmers || 0}
          </div>
          <div className="text-sm text-gray-400">Active Farmers</div>
        </div>
        <div className="bg-farming-secondary rounded-xl p-4">
          <div className="text-2xl font-bold text-farming-warning">
            {stats?.pendingWithdrawals || 0}
          </div>
          <div className="text-sm text-gray-400">Pending Withdrawals</div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="bg-farming-secondary rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "users", label: "Users" },
            { id: "referrals", label: "Referrals" },
            { id: "boosts", label: "Boosts" },
            { id: "deposits", label: "Deposits" },
            { id: "withdrawals", label: "Withdrawals" },
            { id: "tasks", label: "Tasks" },
          ].map((section) => (
            <Button
              key={section.id}
              onClick={() => setActiveSection(section.id as AdminSection)}
              className={
                activeSection === section.id
                  ? "bg-farming-accent text-farming-primary"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }
            >
              {section.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Section Content */}
      {renderSection()}
    </div>
  );
}
