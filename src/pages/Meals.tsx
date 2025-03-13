
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, Info, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import database from "@/lib/database";
import { Employee, MealRecord } from "@/lib/types";

const Meals = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mealsByEmployee, setMealsByEmployee] = useState<Record<string, MealRecord | null>>({});

  // Load employees and meals for selected date
  useEffect(() => {
    const loadData = async () => {
      try {
        await database.init();
        const employeesData = await database.getAllEmployees();
        setEmployees(employeesData);
        
        if (date) {
          const dateString = date.toISOString().split('T')[0];
          const mealsForDate = await database.getMealsByDate(dateString);
          
          // Map meals to employees
          const mealMap: Record<string, MealRecord | null> = {};
          const selectedMap: Record<string, boolean> = {};
          
          employeesData.forEach(employee => {
            const meal = mealsForDate.find(m => m.employeeId === employee.id);
            mealMap[employee.id] = meal || null;
            selectedMap[employee.id] = !!meal;
          });
          
          setMealsByEmployee(mealMap);
          setSelectedEmployees(selectedMap);
        }
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [date]);

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle employee selection
  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  // Save meals for selected date
  const handleSaveMeals = async () => {
    if (!date) return;
    
    try {
      setIsSaving(true);
      const dateString = date.toISOString().split('T')[0];
      
      // For each employee, either create a new meal or delete an existing one
      for (const employee of employees) {
        const isSelected = selectedEmployees[employee.id] || false;
        const existingMeal = mealsByEmployee[employee.id];
        
        if (isSelected && !existingMeal) {
          // Create new meal
          const newMeal: MealRecord = {
            id: crypto.randomUUID(),
            employeeId: employee.id,
            date: dateString,
            paid: false
          };
          await database.saveMeal(newMeal);
        } else if (!isSelected && existingMeal) {
          // Delete existing meal
          await database.deleteMeal(existingMeal.id);
        }
      }
      
      // Reload meals for this date
      const updatedMeals = await database.getMealsByDate(dateString);
      const updatedMealMap: Record<string, MealRecord | null> = {};
      
      employees.forEach(employee => {
        const meal = updatedMeals.find(m => m.employeeId === employee.id);
        updatedMealMap[employee.id] = meal || null;
      });
      
      setMealsByEmployee(updatedMealMap);
      toast.success("Repas enregistrés avec succès");
    } catch (error) {
      console.error("Failed to save meals", error);
      toast.error("Erreur lors de l'enregistrement des repas");
    } finally {
      setIsSaving(false);
    }
  };

  // Select/deselect all
  const selectAll = () => {
    const newSelectedEmployees: Record<string, boolean> = {};
    filteredEmployees.forEach(employee => {
      newSelectedEmployees[employee.id] = true;
    });
    setSelectedEmployees(newSelectedEmployees);
  };

  const deselectAll = () => {
    const newSelectedEmployees: Record<string, boolean> = {};
    filteredEmployees.forEach(employee => {
      newSelectedEmployees[employee.id] = false;
    });
    setSelectedEmployees(newSelectedEmployees);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-3xl md:text-4xl mb-2">Enregistrement des repas</h1>
        <p className="text-muted-foreground">
          Sélectionnez une date et les employés ayant pris un repas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sélectionner une date</CardTitle>
        </CardHeader>
        <CardContent>
          <DatePicker
            date={date}
            onDateChange={(newDate) => newDate && setDate(newDate)}
            placeholder="Sélectionner une date"
            className="max-w-sm"
          />
          {date && (
            <p className="mt-2 text-sm text-muted-foreground">
              Repas pour le {format(date, "EEEE d MMMM yyyy", { locale: fr })}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 max-w-sm">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Tout sélectionner
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Tout désélectionner
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Employés présents</CardTitle>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cochez les employés qui ont pris un repas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-5 w-5 rounded-sm bg-muted"></div>
                    <div className="h-6 bg-muted rounded w-32"></div>
                  </div>
                ))}
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <p>Aucun employé trouvé</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center p-2 rounded-md hover:bg-accent"
                  >
                    <Checkbox
                      id={`employee-${employee.id}`}
                      checked={selectedEmployees[employee.id] || false}
                      onCheckedChange={() => toggleEmployee(employee.id)}
                      className="mr-3"
                    />
                    <label
                      htmlFor={`employee-${employee.id}`}
                      className="flex-1 font-medium cursor-pointer"
                    >
                      {employee.name}
                    </label>
                    
                    {selectedEmployees[employee.id] && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center rounded-full"
                      >
                        <Check className="h-4 w-4" />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Separator />
        
        <div className="flex justify-end">
          <Button
            className="w-full sm:w-auto"
            onClick={handleSaveMeals}
            disabled={isLoading || isSaving}
          >
            {isSaving ? "Enregistrement..." : "Enregistrer les repas"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Meals;
