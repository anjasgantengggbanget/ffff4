import { Button } from "@/components/ui/button";
import { Sprout, CheckSquare, Users, Wallet, Rocket } from "lucide-react";

type Section = "farming" | "tasks" | "referral" | "wallet" | "boost";

interface BottomNavProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

export default function BottomNav({ activeSection, onSectionChange }: BottomNavProps) {
  const navItems = [
    { id: "farming", label: "Farm", icon: Sprout },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "referral", label: "Referral", icon: Users },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "boost", label: "Boost", icon: Rocket },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-farming-secondary border-t border-gray-700">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onSectionChange(item.id as Section)}
              className={`flex flex-col items-center py-2 px-4 ${
                isActive 
                  ? "text-farming-accent" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <IconComponent className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
