import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, DollarSign, Activity, Clock } from "lucide-react";
import { useLocation } from "wouter";

type AdminSection = "users" | "referrals" | "boosts" | "deposits" | "withdrawals" | "tasks";

export default function Admin() {
  const [activeSection, setActiveSection] = useState<AdminSection>("users");
  const [, navigate] = useLocation();

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["/api/admin/withdrawals"],
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
                        <span className="bg-farming-success px-2 py-1 rounded text-xs">
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
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
                      {parseFloat(withdrawal.amount).toLocaleString()} USDT
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-farming-success">
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive">
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
    <div className="bg-farming-primary min-h-screen text-white">
      {/* Header */}
      <header className="bg-farming-secondary p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-farming-secondary rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-farming-accent" />
              <div className="text-2xl font-bold text-farming-accent">
                {stats?.totalUsers || 0}
              </div>
            </div>
            <div className="text-sm text-gray-400">Total Users</div>
          </div>
          <div className="bg-farming-secondary rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-5 w-5 text-farming-usdt" />
              <div className="text-2xl font-bold text-farming-usdt">
                {stats?.totalUsdt ? parseFloat(stats.totalUsdt).toLocaleString() : 0}
              </div>
            </div>
            <div className="text-sm text-gray-400">Total USDT</div>
          </div>
          <div className="bg-farming-secondary rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-5 w-5 text-farming-success" />
              <div className="text-2xl font-bold text-farming-success">
                {stats?.activeFarmers || 0}
              </div>
            </div>
            <div className="text-sm text-gray-400">Active Farmers</div>
          </div>
          <div className="bg-farming-secondary rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-5 w-5 text-farming-warning" />
              <div className="text-2xl font-bold text-farming-warning">
                {stats?.pendingWithdrawals || 0}
              </div>
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
    </div>
  );
}
