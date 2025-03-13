
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarClock, Check, Euro } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import database from "@/lib/database";
import { Employee, MealRecord, PaymentRecord, AppSettings } from "@/lib/types";

const Payments = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState<string>("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [employeesMeals, setEmployeesMeals] = useState<Record<string, MealRecord[]>>({});
  const [employeesPayments, setEmployeesPayments] = useState<Record<string, PaymentRecord[]>>({});
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        await database.init();
        const employeesData = await database.getAllEmployees();
        setEmployees(employeesData);
        
        // Load settings
        const settingsData = await database.getSettings();
        setSettings(settingsData);
        
        // Load meals and payments for each employee
        const mealsData: Record<string, MealRecord[]> = {};
        const paymentsData: Record<string, PaymentRecord[]> = {};
        
        for (const employee of employeesData) {
          mealsData[employee.id] = await database.getMealsByEmployee(employee.id);
          paymentsData[employee.id] = await database.getPaymentsByEmployee(employee.id);
        }
        
        setEmployeesMeals(mealsData);
        setEmployeesPayments(paymentsData);
        
        // If there are employees, select the first one by default
        if (employeesData.length > 0) {
          setSelectedEmployeeId(employeesData[0].id);
        }
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Calculate employee balance
  const calculateBalance = (employeeId: string): number => {
    if (!settings || !employeeId) return 0;
    
    const meals = employeesMeals[employeeId] || [];
    const payments = employeesPayments[employeeId] || [];
    
    const mealsCost = meals.length * settings.mealPrice;
    const paymentAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    return mealsCost - paymentAmount;
  };

  // Handle saving a payment
  const handleSavePayment = async () => {
    if (!date || !selectedEmployeeId || !amount) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }
    
    try {
      setIsSaving(true);
      const dateString = date.toISOString().split('T')[0];
      
      const newPayment: PaymentRecord = {
        id: crypto.randomUUID(),
        employeeId: selectedEmployeeId,
        date: dateString,
        amount: amountValue
      };
      
      await database.savePayment(newPayment);
      
      // Update payments in state
      const updatedPayments = [...(employeesPayments[selectedEmployeeId] || []), newPayment];
      setEmployeesPayments({
        ...employeesPayments,
        [selectedEmployeeId]: updatedPayments
      });
      
      toast.success("Paiement enregistré avec succès");
      
      // Mark meals as paid (if any unpaid meals exist and payment covers them)
      if (settings) {
        const meals = employeesMeals[selectedEmployeeId] || [];
        const unpaidMeals = meals.filter(meal => !meal.paid);
        const mealPrice = settings.mealPrice;
        
        let remainingAmount = amountValue;
        const updatedMeals: MealRecord[] = [];
        
        for (const meal of unpaidMeals) {
          if (remainingAmount >= mealPrice) {
            const updatedMeal = { ...meal, paid: true };
            await database.saveMeal(updatedMeal);
            updatedMeals.push(updatedMeal);
            remainingAmount -= mealPrice;
          } else {
            break;
          }
        }
        
        // Update meals in state if any were marked as paid
        if (updatedMeals.length > 0) {
          const allMeals = [...meals];
          for (const updatedMeal of updatedMeals) {
            const index = allMeals.findIndex(m => m.id === updatedMeal.id);
            if (index !== -1) {
              allMeals[index] = updatedMeal;
            }
          }
          
          setEmployeesMeals({
            ...employeesMeals,
            [selectedEmployeeId]: allMeals
          });
        }
      }
      
      // Reset form
      setAmount("");
    } catch (error) {
      console.error("Failed to save payment", error);
      toast.error("Erreur lors de l'enregistrement du paiement");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-3xl md:text-4xl mb-2">Enregistrement de paiement</h1>
        <p className="text-muted-foreground">
          Enregistrez les paiements des employés
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Nouveau paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employé</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
                disabled={isLoading || employees.length === 0}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date du paiement</Label>
              <DatePicker
                date={date}
                onDateChange={(newDate) => newDate && setDate(newDate)}
                placeholder="Sélectionner une date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Montant (€)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-8"
                />
                <Euro className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <Button
              className="w-full mt-4"
              disabled={!selectedEmployeeId || !date || !amount || isLoading || isSaving}
              onClick={handleSavePayment}
            >
              {isSaving ? "Enregistrement..." : "Enregistrer le paiement"}
            </Button>
          </CardContent>
        </Card>

        {selectedEmployeeId && (
          <Card>
            <CardHeader>
              <CardTitle>
                Détails du solde
                {employees.find(e => e.id === selectedEmployeeId) && (
                  <span className="ml-2 text-muted-foreground">
                    - {employees.find(e => e.id === selectedEmployeeId)?.name}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-accent p-4 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Repas</div>
                  <div className="text-2xl font-bold">
                    {employeesMeals[selectedEmployeeId]?.length || 0}
                  </div>
                </div>
                
                <div className="bg-accent p-4 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Paiements</div>
                  <div className="text-2xl font-bold">
                    {employeesPayments[selectedEmployeeId]?.length || 0}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Total des repas</span>
                  <span className="font-medium">
                    {((employeesMeals[selectedEmployeeId]?.length || 0) * (settings?.mealPrice || 0)).toFixed(2)}€
                  </span>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Total payé</span>
                  <span className="font-medium">
                    {(employeesPayments[selectedEmployeeId] || [])
                      .reduce((sum, payment) => sum + payment.amount, 0)
                      .toFixed(2)}€
                  </span>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">Solde restant</span>
                  <div className={`font-bold ${calculateBalance(selectedEmployeeId) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                    {calculateBalance(selectedEmployeeId).toFixed(2)}€
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Derniers paiements</h4>
                {employeesPayments[selectedEmployeeId]?.length ? (
                  <div className="space-y-2">
                    {employeesPayments[selectedEmployeeId]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 3)
                      .map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(payment.date), "dd MMM yyyy", { locale: fr })}
                            </span>
                          </div>
                          <div className="font-medium">{payment.amount.toFixed(2)}€</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground text-sm p-4">
                    Aucun paiement enregistré
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Payments;
