
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, UtensilsCrossed, Wallet, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import database from "@/lib/database";
import { Employee, MealRecord, PaymentRecord, AppSettings } from "@/lib/types";

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const Dashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await database.init();
        const employeesData = await database.getAllEmployees();
        
        // Load meals for today
        const today = new Date().toISOString().split('T')[0];
        const mealsData = await database.getMealsByDate(today);
        
        // Load all payments
        const paymentsData: PaymentRecord[] = [];
        for (const employee of employeesData) {
          const employeePayments = await database.getPaymentsByEmployee(employee.id);
          paymentsData.push(...employeePayments);
        }
        
        const settingsData = await database.getSettings();
        
        setEmployees(employeesData);
        setMeals(mealsData);
        setPayments(paymentsData);
        setSettings(settingsData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Calculate stats
  const totalEmployees = employees.length;
  const totalMealsToday = meals.length;
  
  // Calculate balance
  let totalDue = 0;
  if (employees.length > 0 && settings) {
    for (const employee of employees) {
      const employeeMeals = meals.filter(meal => meal.employeeId === employee.id && !meal.paid);
      const mealsDue = employeeMeals.length * settings.mealPrice;
      
      const employeePayments = payments.filter(payment => payment.employeeId === employee.id);
      const paidAmount = employeePayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      totalDue += mealsDue - paidAmount;
    }
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-3xl md:text-4xl mb-2">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue sur la gestion de la cantine S11
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <Card className="card-hover">
              <CardHeader className="pb-2">
                <CardDescription>Total employés</CardDescription>
                <CardTitle className="text-3xl">{totalEmployees}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <Users className="h-8 w-8 text-primary opacity-80" />
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/employees" className="gap-1">
                      Voir <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="card-hover">
              <CardHeader className="pb-2">
                <CardDescription>Repas aujourd'hui</CardDescription>
                <CardTitle className="text-3xl">{totalMealsToday}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <UtensilsCrossed className="h-8 w-8 text-primary opacity-80" />
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/meals" className="gap-1">
                      Voir <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="card-hover">
              <CardHeader className="pb-2">
                <CardDescription>Balance à payer</CardDescription>
                <CardTitle className="text-3xl">
                  {totalDue.toFixed(2)}€
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <Wallet className="h-8 w-8 text-primary opacity-80" />
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/payments" className="gap-1">
                      Voir <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button asChild className="w-full justify-between">
              <Link to="/meals">
                Enregistrer des repas
                <UtensilsCrossed className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="w-full justify-between">
              <Link to="/payments">
                Enregistrer un paiement
                <Wallet className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/employees">
                Gérer les employés
                <Users className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
