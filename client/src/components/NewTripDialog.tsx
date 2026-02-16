import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Plane, 
  ArrowRight, 
  ArrowLeft,
  Plus,
  X,
  CheckCircle2,
  Car,
  Train,
  Ship,
  Bus,
  Shuffle,
} from "lucide-react";
import { useTrips } from "@/lib/TripContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/UserContext";

interface NewTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTripDialog({ open, onOpenChange }: NewTripDialogProps) {
  const [step, setStep] = useState(1);
  const { addTrip } = useTrips();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { settings } = useUser();

  const [formData, setFormData] = useState({
    travelers: 2,
    shareAccommodation: true,
    genderGroup: "mixed",
    dateType: "estimated",
    startDate: "",
    endDate: "",
    duration: 7,
    durationType: "estimated",

    travelMode: "mixed",
    budgetType: "estimated",
    budgetAmount: "" as string | number,
    preferences: {
      directFlights: true,
      ecoFriendly: false,
      avoidStopovers: true
    },

    origin: settings.homeLocation || "",
    finalDestination: "",
    destinations: [] as string[],
    newDestination: ""
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const addDestination = () => {
    if (formData.newDestination.trim()) {
      setFormData({
        ...formData,
        destinations: [...formData.destinations, formData.newDestination],
        newDestination: ""
      });
    }
  };

  const removeDestination = (index: number) => {
    const newDestinations = [...formData.destinations];
    newDestinations.splice(index, 1);
    setFormData({ ...formData, destinations: newDestinations });
  };

  const togglePreference = (key: keyof typeof formData.preferences) => {
    setFormData({
      ...formData,
      preferences: {
        ...formData.preferences,
        [key]: !formData.preferences[key]
      }
    });
  };

  const handleFinish = () => {
    let datesStr = "TBD";
    if (formData.dateType === "fixed" && formData.startDate) {
      const start = new Date(formData.startDate);
      const end = formData.endDate ? new Date(formData.endDate) : new Date(start.getTime() + (formData.duration * 24 * 60 * 60 * 1000));
      datesStr = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      datesStr = `Flexible (${formData.duration} days)`;
    }

    const allStops = formData.destinations;
    const titleDest = formData.finalDestination || (allStops.length > 0 ? allStops[allStops.length - 1] : null);

    addTrip({
      title: titleDest ? `Journey to ${titleDest}` : "New Adventure",
      origin: formData.origin || undefined,
      finalDestination: formData.finalDestination || undefined,
      dates: datesStr,
      days: formData.duration,
      cost: formData.budgetType === "later" || formData.budgetAmount === "" ? "TBD" : `$${formData.budgetAmount}`,
      status: "Planning",
      destinations: allStops,
      travelMode: formData.travelMode,
    }, (journey) => {
      onOpenChange(false);
      toast({
        title: "Journey Created",
        description: "Redirecting you to the trip planner...",
      });
      setTimeout(() => {
        setStep(1);
        setLocation(`/planner/${journey.id}`);
      }, 300);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center gap-2">
            {step === 1 && <Users className="h-5 w-5 text-primary" />}
            {step === 2 && <DollarSign className="h-5 w-5 text-primary" />}
            {step === 3 && <MapPin className="h-5 w-5 text-primary" />}
            
            {step === 1 && "Who & When"}
            {step === 2 && "Budget & Style"}
            {step === 3 && "Where to?"}
          </DialogTitle>
          <DialogDescription>
            Step {step} of 3 • Let's build your perfect itinerary.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4 py-2">
          {step === 1 && (
            <div className="space-y-6 py-2">
              {/* Travelers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Travelers</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    value={formData.travelers} 
                    onChange={(e) => setFormData({...formData, travelers: parseInt(e.target.value) || 1})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Group Dynamic</Label>
                  <Select 
                    value={formData.genderGroup} 
                    onValueChange={(val) => setFormData({...formData, genderGroup: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select group type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed Group</SelectItem>
                      <SelectItem value="female">Female Only</SelectItem>
                      <SelectItem value="male">Male Only</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="couple">Couple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/30">
                <Switch 
                  id="share-acc" 
                  checked={formData.shareAccommodation}
                  onCheckedChange={(checked) => setFormData({...formData, shareAccommodation: checked})}
                />
                <Label htmlFor="share-acc" className="flex-1 cursor-pointer">
                  Travelers will share accommodations
                  <span className="block text-xs text-muted-foreground font-normal">
                    (e.g., Double/Twin rooms instead of singles)
                  </span>
                </Label>
              </div>

              {/* Dates */}
              <div className="space-y-3">
                <Label>When do you want to go?</Label>
                <RadioGroup 
                  value={formData.dateType} 
                  onValueChange={(val) => setFormData({...formData, dateType: val})}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="estimated" id="date-est" className="peer sr-only" />
                    <Label
                      htmlFor="date-est"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span className="font-semibold">Flexible Dates</span>
                      <span className="text-xs text-muted-foreground">I have a rough idea</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="fixed" id="date-fixed" className="peer sr-only" />
                    <Label
                      htmlFor="date-fixed"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span className="font-semibold">Fixed Dates</span>
                      <span className="text-xs text-muted-foreground">I have exact dates</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.dateType === "fixed" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Estimated Duration (Days)</Label>
                    <div className="flex items-center gap-4">
                       <Input 
                         type="number" 
                         className="w-24"
                         value={formData.duration}
                         onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 1})}
                       />
                       <RadioGroup 
                         value={formData.durationType}
                         onValueChange={(val) => setFormData({...formData, durationType: val})}
                         className="flex gap-4"
                       >
                         <div className="flex items-center space-x-2">
                           <RadioGroupItem value="estimated" id="dur-est" />
                           <Label htmlFor="dur-est">Approximate</Label>
                         </div>
                         <div className="flex items-center space-x-2">
                           <RadioGroupItem value="max" id="dur-max" />
                           <Label htmlFor="dur-max">Maximum</Label>
                         </div>
                       </RadioGroup>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 py-2">
              <div className="space-y-3">
                <Label>How are you getting there?</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "drive", label: "Road Trip", icon: Car, desc: "Driving the whole way" },
                    { value: "fly", label: "Fly", icon: Plane, desc: "Air travel between cities" },
                    { value: "train", label: "Train", icon: Train, desc: "Rail journeys" },
                    { value: "bus", label: "Bus", icon: Bus, desc: "Coach or bus routes" },
                    { value: "ferry", label: "Ferry / Boat", icon: Ship, desc: "Water crossings" },
                    { value: "mixed", label: "Mix of Modes", icon: Shuffle, desc: "Whatever works best" },
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all cursor-pointer text-center ${
                        formData.travelMode === mode.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-muted hover:border-primary/30 hover:bg-muted/30"
                      }`}
                      onClick={() => setFormData({ ...formData, travelMode: mode.value })}
                      data-testid={`button-mode-${mode.value}`}
                    >
                      <mode.icon className={`h-5 w-5 ${formData.travelMode === mode.value ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium leading-tight">{mode.label}</span>
                    </button>
                  ))}
                </div>
                {formData.travelMode === "drive" && (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2.5">
                    Marco will plan driving routes with scenic stops, rest breaks, and realistic drive times between destinations.
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label>Budget Preferences</Label>
                <RadioGroup 
                  value={formData.budgetType} 
                  onValueChange={(val) => setFormData({...formData, budgetType: val})}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/30 cursor-pointer">
                    <RadioGroupItem value="estimated" id="bud-est" />
                    <Label htmlFor="bud-est" className="flex-1 cursor-pointer">
                      Estimated Budget
                      <span className="block text-xs text-muted-foreground">Soft target to guide planning</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/30 cursor-pointer">
                    <RadioGroupItem value="fixed" id="bud-fix" />
                    <Label htmlFor="bud-fix" className="flex-1 cursor-pointer">
                      Fixed Cap
                      <span className="block text-xs text-muted-foreground">Strict limit, do not exceed</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/30 cursor-pointer">
                    <RadioGroupItem value="later" id="bud-lat" />
                    <Label htmlFor="bud-lat" className="flex-1 cursor-pointer">
                      Decide Later
                      <span className="block text-xs text-muted-foreground">Focus on experience first</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.budgetType !== "later" && (
                 <div className="space-y-2">
                   <Label>Budget Amount ({settings.currency || "USD"})</Label>
                   <div className="relative">
                     <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input 
                       type="number" 
                       className="pl-9" 
                       placeholder="2500"
                       value={formData.budgetAmount}
                       onChange={(e) => setFormData({...formData, budgetAmount: e.target.value === "" ? "" : parseInt(e.target.value)})}
                     />
                   </div>
                 </div>
              )}

              <div className="space-y-4 pt-4 border-t">
                <Label>Travel Preferences</Label>

                {(formData.travelMode === "fly" || formData.travelMode === "mixed") && (
                  <>
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="pref-direct" className="flex flex-col">
                        <span>Direct Flights Only</span>
                        <span className="font-normal text-xs text-muted-foreground">Prioritize non-stop routes</span>
                      </Label>
                      <Switch 
                        id="pref-direct" 
                        checked={formData.preferences.directFlights}
                        onCheckedChange={() => togglePreference('directFlights')}
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="pref-stop" className="flex flex-col">
                        <span>Minimize Stopovers</span>
                        <span className="font-normal text-xs text-muted-foreground">Avoid long layovers (&gt;4h)</span>
                      </Label>
                      <Switch 
                        id="pref-stop" 
                        checked={formData.preferences.avoidStopovers}
                        onCheckedChange={() => togglePreference('avoidStopovers')}
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="pref-eco" className="flex flex-col">
                    <span>Eco-Friendly Options</span>
                    <span className="font-normal text-xs text-muted-foreground">Prioritize lower carbon impact</span>
                  </Label>
                  <Switch 
                    id="pref-eco" 
                    checked={formData.preferences.ecoFriendly}
                    onCheckedChange={() => togglePreference('ecoFriendly')}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Starting Point</Label>
                  <div className="relative">
                     <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input 
                       className="pl-9"
                       placeholder="Your starting city"
                       value={formData.origin} 
                       onChange={(e) => setFormData({...formData, origin: e.target.value})}
                       data-testid="input-origin"
                     />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Final Destination</Label>
                  <div className="relative">
                     <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input 
                       className="pl-9"
                       placeholder="Where your trip ends"
                       value={formData.finalDestination} 
                       onChange={(e) => setFormData({...formData, finalDestination: e.target.value})}
                       data-testid="input-final-destination"
                     />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-4">Your origin and final destination can be different if you're not returning home.</p>

              <div className="space-y-3">
                 <Label>Stops Along the Way</Label>
                 <div className="flex gap-2">
                   <Input 
                     placeholder="City, Country, or Point of Interest" 
                     value={formData.newDestination}
                     onChange={(e) => setFormData({...formData, newDestination: e.target.value})}
                     onKeyDown={(e) => e.key === 'Enter' && addDestination()}
                     data-testid="input-add-stop"
                   />
                   <Button onClick={addDestination} size="icon" data-testid="button-add-stop">
                     <Plus className="h-4 w-4" />
                   </Button>
                 </div>
                 
                 <div className="space-y-2 min-h-[100px] border rounded-lg p-2 bg-muted/20">
                    {formData.destinations.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm p-4">
                        <MapPin className="h-8 w-8 mb-2 opacity-50" />
                        Add stops you want to visit along the way
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {formData.destinations.map((dest, idx) => (
                          <Badge key={idx} variant="secondary" className="pl-2 pr-1 py-1 text-sm flex items-center gap-1" data-testid={`badge-stop-${idx}`}>
                            {dest}
                            <button onClick={() => removeDestination(idx)} className="hover:text-destructive" data-testid={`button-remove-stop-${idx}`}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                 </div>
                 <p className="text-xs text-muted-foreground">Don't worry about the order yet, we'll help you organize the route later.</p>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex justify-between sm:justify-between border-t pt-4">
          <Button variant="ghost" onClick={step === 1 ? () => onOpenChange(false) : handleBack}>
            {step === 1 ? "Cancel" : <><ArrowLeft className="mr-2 h-4 w-4" /> Back</>}
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-4">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`h-2 w-2 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-muted"}`} 
                />
              ))}
            </div>
            <Button onClick={step === 3 ? handleFinish : handleNext} disabled={step === 3 && formData.destinations.length === 0}>
              {step === 3 ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Create Plan</> : <><ArrowRight className="ml-2 h-4 w-4" /> Next</>}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
