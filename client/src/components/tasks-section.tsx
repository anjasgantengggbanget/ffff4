import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Check, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface TasksSectionProps {
  user: User;
}

export default function TasksSection({ user }: TasksSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: userTasks } = useQuery({
    queryKey: [`/api/users/${user.id}/tasks`],
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/users/${user.id}/tasks/${taskId}/complete`, {});
      return response.json();
    },
    onSuccess: (data, taskId) => {
      const task = tasks?.find(t => t.id === taskId);
      toast({
        title: "Task Completed!",
        description: `You earned ${task?.reward} USDT for completing "${task?.title}".`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/tasks`] });
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

  const isTaskCompleted = (taskId: number) => {
    return userTasks?.some(ut => ut.taskId === taskId);
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case "telegram":
        return "🔵";
      case "instagram":
        return "📸";
      case "youtube":
        return "🎥";
      case "twitter":
        return "🐦";
      default:
        return "📋";
    }
  };

  const getTaskColor = (taskType: string) => {
    switch (taskType) {
      case "telegram":
        return "bg-blue-500";
      case "instagram":
        return "bg-pink-500";
      case "youtube":
        return "bg-red-500";
      case "twitter":
        return "bg-blue-400";
      default:
        return "bg-gray-500";
    }
  };

  const completedTasks = userTasks?.length || 0;
  const totalTasks = tasks?.length || 0;

  return (
    <section className="p-6">
      <h2 className="text-xl font-bold mb-4">Social Tasks</h2>
      
      {/* Tasks List */}
      <div className="space-y-3 mb-6">
        {tasks?.map((task) => {
          const completed = isTaskCompleted(task.id);
          
          return (
            <div key={task.id} className="bg-farming-secondary rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${getTaskColor(task.taskType)} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-lg">{getTaskIcon(task.taskType)}</span>
                </div>
                <div>
                  <h3 className="font-semibold">{task.title}</h3>
                  <p className="text-xs text-gray-400">+{task.reward} USDT</p>
                </div>
              </div>
              
              {completed ? (
                <Badge className="bg-farming-success text-white">
                  <Check className="mr-1 h-3 w-3" />
                  Done
                </Badge>
              ) : (
                <div className="flex items-center space-x-2">
                  {task.taskUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(task.taskUrl, "_blank")}
                      className="text-farming-accent border-farming-accent hover:bg-farming-accent hover:text-farming-primary"
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Visit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => completeTaskMutation.mutate(task.id)}
                    disabled={completeTaskMutation.isPending}
                    className="bg-farming-accent text-farming-primary hover:bg-farming-accent/90"
                  >
                    Complete
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Daily Combo */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4">
        <h3 className="font-bold text-lg mb-2">Daily Combo</h3>
        <p className="text-sm text-gray-200 mb-3">
          Complete {Math.min(3, totalTasks)} tasks to unlock bonus rewards
        </p>
        <div className="flex space-x-2">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                completedTasks >= index
                  ? "bg-farming-success"
                  : "bg-white bg-opacity-20"
              }`}
            >
              {completedTasks >= index ? (
                <Check className="text-white h-6 w-6" />
              ) : (
                <Lock className="text-gray-400 h-6 w-6" />
              )}
            </div>
          ))}
        </div>
        
        {completedTasks >= 3 && (
          <div className="mt-4">
            <Badge className="bg-farming-warning text-farming-primary">
              🎉 Bonus Unlocked! +1000 USDT
            </Badge>
          </div>
        )}
      </div>
    </section>
  );
}
