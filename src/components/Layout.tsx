
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Users,
  UtensilsCrossed,
  Wallet,
  BarChart3,
  Settings as SettingsIcon,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItemProps = {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
};

const NavItem = ({ to, icon: Icon, label, isActive }: NavItemProps) => {
  return (
    <Link to={to} className="w-full relative block group">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 px-3 mb-1 font-normal",
          isActive 
            ? "bg-accent text-accent-foreground font-medium" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </Button>
    </Link>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const navItems = [
    { to: "/", icon: Home, label: "Tableau de bord" },
    { to: "/employees", icon: Users, label: "Employés" },
    { to: "/meals", icon: UtensilsCrossed, label: "Repas" },
    { to: "/payments", icon: Wallet, label: "Paiements" },
    { to: "/statistics", icon: BarChart3, label: "Statistiques" },
    { to: "/settings", icon: SettingsIcon, label: "Paramètres" },
  ];

  // Close sidebar when route changes (mobile)
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile header */}
      <header className="h-16 flex items-center justify-between px-4 border-b md:hidden">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            className="p-1" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
          <h1 className="text-xl font-semibold">CANTINÉO</h1>
        </div>
      </header>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed inset-0 z-50 flex flex-col w-72 bg-card border-r border-border md:static",
          "transform transition-transform duration-300 ease-in-out md:transform-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        initial={false}
      >
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">CANTINÉO</h1>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={location.pathname === item.to}
              />
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Gestion de cantine S11
          </div>
        </div>
      </motion.aside>

      {/* Content */}
      <main className="flex-1 h-screen md:h-auto overflow-auto">
        <motion.div
          className="container py-6 md:py-8 px-4 md:px-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          key={location.pathname}
        >
          {children}
        </motion.div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
