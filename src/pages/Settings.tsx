
import React, { useState, useEffect } from "react";
import { Euro, Info, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import database from "@/lib/database";
import { AppSettings } from "@/lib/types";

const Settings = () => {
  const [mealPrice, setMealPrice] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        await database.init();
        const settings = await database.getSettings();
        if (settings) {
          setMealPrice(settings.mealPrice.toString());
        }
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    const priceValue = parseFloat(mealPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error("Veuillez entrer un prix valide");
      return;
    }
    
    try {
      setIsSaving(true);
      
      const settings: AppSettings = {
        mealPrice: priceValue
      };
      
      await database.saveSettings(settings);
      toast.success("Paramètres enregistrés avec succès");
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error("Erreur lors de l'enregistrement des paramètres");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-3xl md:text-4xl mb-2">Paramètres</h1>
        <p className="text-muted-foreground">
          Configurez les paramètres de l'application
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Prix du repas</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ce prix sera utilisé pour calculer les montants à payer</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            Définissez le prix d'un repas à la cantine
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meal-price">Prix du repas (€)</Label>
            <div className="relative max-w-sm">
              <Input
                id="meal-price"
                type="number"
                min="0"
                step="0.01"
                value={mealPrice}
                onChange={(e) => setMealPrice(e.target.value)}
                placeholder="0.00"
                className="pl-8"
                disabled={isLoading}
              />
              <Euro className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-end">
            <Button 
              className="gap-2"
              onClick={handleSaveSettings}
              disabled={isLoading || isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>À propos</CardTitle>
          <CardDescription>
            Informations sur l'application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">CANTINÉO</h3>
            <p className="text-muted-foreground">
              Application de gestion de la cantine pour l'entreprise S11.
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Développé par</span>
              <span>CANTINÉO Team</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
