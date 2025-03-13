
import React, { useState, useEffect } from "react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart, BarChartHorizontal, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import database from "@/lib/database";
import { Employee, MealRecord, PaymentRecord, AppSettings } from "@/lib/types";

// Define colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Statistics = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("daily");

  useEffect(() => {
    const loadData = async () => {
      try {
        await database.init();
        const employeesData = await database.getAllEmployees();
        setEmployees(employeesData);
        
        // Load settings
        const settingsData = await database.getSettings();
        setSettings(settingsData);
        
        // Load all meals and payments
        const allMeals: MealRecord[] = [];
        const allPayments: PaymentRecord[] = [];
        
        for (const employee of employeesData) {
          const employeeMeals = await database.getMealsByEmployee(employee.id);
          const employeePayments = await database.getPaymentsByEmployee(employee.id);
          
          allMeals.push(...employeeMeals);
          allPayments.push(...employeePayments);
        }
        
        setMeals(allMeals);
        setPayments(allPayments);
      } catch (error) {
        console.error("Failed to load statistics data", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Daily meals data (last 7 days)
  const getDailyMealsData = () => {
    const lastSevenDays = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i));
    
    return lastSevenDays.map(day => {
      const dateStr = day.toISOString().split('T')[0];
      const count = meals.filter(meal => meal.date === dateStr).length;
      
      return {
        date: format(day, "EEE dd/MM", { locale: fr }),
        count,
        value: count * (settings?.mealPrice || 0)
      };
    }).reverse();
  };

  // Monthly meals data (current month)
  const getMonthlyMealsData = () => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    const daysInMonth = eachDayOfInterval({ start, end });
    
    return daysInMonth.map(day => {
      const dateStr = day.toISOString().split('T')[0];
      const count = meals.filter(meal => meal.date === dateStr).length;
      
      return {
        date: format(day, "dd/MM", { locale: fr }),
        count,
        value: count * (settings?.mealPrice || 0)
      };
    });
  };

  // Employee meals distribution data
  const getEmployeeMealsData = () => {
    return employees.map(employee => {
      const count = meals.filter(meal => meal.employeeId === employee.id).length;
      
      return {
        name: employee.name,
        count,
        value: count * (settings?.mealPrice || 0)
      };
    }).sort((a, b) => b.count - a.count);
  };

  // Calculate total stats
  const getTotalStats = () => {
    const totalMeals = meals.length;
    const totalValue = totalMeals * (settings?.mealPrice || 0);
    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const outstandingBalance = totalValue - totalPayments;
    
    return {
      totalMeals,
      totalValue,
      totalPayments,
      outstandingBalance
    };
  };

  const stats = getTotalStats();
  const dailyData = getDailyMealsData();
  const monthlyData = getMonthlyMealsData();
  const employeeData = getEmployeeMealsData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-3xl md:text-4xl mb-2">Statistiques</h1>
        <p className="text-muted-foreground">
          Consultez les statistiques de la cantine
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total repas</CardDescription>
            <CardTitle className="text-3xl">{stats.totalMeals}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">
              Valeur: {stats.totalValue.toFixed(2)}€
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total paiements</CardDescription>
            <CardTitle className="text-3xl">{stats.totalPayments.toFixed(2)}€</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">
              {payments.length} transactions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Balance à payer</CardDescription>
            <CardTitle className="text-3xl">{stats.outstandingBalance.toFixed(2)}€</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={stats.outstandingBalance > 0 ? "text-destructive text-sm" : "text-green-500 text-sm"}>
              {stats.outstandingBalance > 0 ? "Non payé" : "Tout est payé"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Prix du repas</CardDescription>
            <CardTitle className="text-3xl">{settings?.mealPrice.toFixed(2)}€</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">
              Tarif actuel
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden md:inline">Journalier</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden md:inline">Mensuel</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Employés</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Repas des 7 derniers jours</CardTitle>
              <CardDescription>
                Nombre de repas servis chaque jour
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-pulse h-5 w-24 bg-muted rounded"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value, name) => [
                      name === 'count' ? `${value} repas` : `${typeof value === 'number' ? value.toFixed(2) : value}€`,
                      name === 'count' ? 'Nombre de repas' : 'Valeur'
                    ]} />
                    <Legend />
                    <Bar name="Nombre de repas" dataKey="count" fill="#0088FE" />
                    <Bar name="Valeur (€)" dataKey="value" fill="#00C49F" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Repas du mois en cours</CardTitle>
              <CardDescription>
                Répartition des repas sur le mois
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-pulse h-5 w-24 bg-muted rounded"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value) => [`${value}`, 'Nombre de repas']} />
                    <Bar name="Nombre de repas" dataKey="count" fill="#0088FE" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="employees">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par employé</CardTitle>
                <CardDescription>
                  Nombre de repas par employé
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-pulse h-5 w-24 bg-muted rounded"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={employeeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {employeeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} repas`, '']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top employés</CardTitle>
                <CardDescription>
                  Classement par nombre de repas
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-pulse h-5 w-24 bg-muted rounded"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      layout="vertical"
                      data={employeeData.slice(0, 5)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip formatter={(value) => [`${value} repas`, 'Nombre de repas']} />
                      <Bar dataKey="count" fill="#0088FE" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Statistics;
