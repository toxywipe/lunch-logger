
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Trash2, UtensilsCrossed, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [employeesMeals, setEmployeesMeals] = useState<Record<string, MealRecord[]>>({});
  const [employeesPayments, setEmployeesPayments] = useState<Record<string, PaymentRecord[]>>({});
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Load employees data
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
      } catch (error) {
        console.error("Failed to load employees", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add a new employee
  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim()) return;
    
    try {
      const newEmployee: Employee = {
        id: crypto.randomUUID(),
        name: newEmployeeName.trim(),
        meals: [],
        payments: []
      };
      
      await database.saveEmployee(newEmployee);
      setEmployees([...employees, newEmployee]);
      setNewEmployeeName("");
      setIsAddingEmployee(false);
    } catch (error) {
      console.error("Failed to add employee", error);
    }
  };

  // Delete an employee
  const handleDeleteEmployee = async (id: string) => {
    try {
      await database.deleteEmployee(id);
      setEmployees(employees.filter(emp => emp.id !== id));
    } catch (error) {
      console.error("Failed to delete employee", error);
    }
  };

  // Calculate employee balance
  const calculateBalance = (employeeId: string): number => {
    if (!settings) return 0;
    
    const meals = employeesMeals[employeeId] || [];
    const payments = employeesPayments[employeeId] || [];
    
    const mealsCost = meals.length * settings.mealPrice;
    const paymentAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    return mealsCost - paymentAmount;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-3xl md:text-4xl mb-2">Employés</h1>
          <p className="text-muted-foreground">
            Gérez les employés de la cantine
          </p>
        </div>

        <Dialog open={isAddingEmployee} onOpenChange={setIsAddingEmployee}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un employé</DialogTitle>
              <DialogDescription>
                Entrez le nom du nouvel employé
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nom
                </Label>
                <Input
                  id="name"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  className="col-span-3"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingEmployee(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddEmployee}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Rechercher un employé..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-32 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <AnimatePresence>
          {filteredEmployees.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-8 text-center"
            >
              <h3 className="text-xl font-semibold mb-2">Aucun employé trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? `Aucun résultat pour "${searchTerm}"`
                  : "Aucun employé n'a été ajouté"}
              </p>
              <Button onClick={() => setIsAddingEmployee(true)}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter un employé
              </Button>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {filteredEmployees.map((employee) => {
                const meals = employeesMeals[employee.id] || [];
                const payments = employeesPayments[employee.id] || [];
                const balance = calculateBalance(employee.id);
                
                return (
                  <motion.div key={employee.id} variants={item}>
                    <Card className="card-hover overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-medium">{employee.name}</h3>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action ne peut pas être annulée. Cela supprimera définitivement {employee.name} et toutes les données associées.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteEmployee(employee.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                            <span>
                              <Badge variant="outline" className="mr-2">{meals.length}</Badge>
                              repas
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <span>
                              <Badge variant="outline" className="mr-2">{payments.length}</Badge>
                              paiements
                            </span>
                          </div>
                          
                          <div className="pt-2 border-t border-border">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Solde</span>
                              <Badge variant={balance > 0 ? "destructive" : "outline"}>
                                {balance > 0 ? `${balance.toFixed(2)}€` : "Payé"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Employees;
