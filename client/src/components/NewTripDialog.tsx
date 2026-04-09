import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Users,
  Baby,
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
import { DestinationDiscovery } from "./DestinationDiscovery";

export interface TripFormData {
  partyType: "solo" | "couple" | "family";
  adults: number;
  children: number;
  rooms: number;
  dateType: string;
  startDate: string;
  endDate: string;
  duration: number;
  durationType: string;
  travelModes: string[];
  budgetType: string;
  budgetAmount: string | number;
  preferences: {
    directFlights: boolean;
    ecoFriendly: boolean;
    avoidStopovers: boolean;
  };
  origin: string;
  finalDestination: string;
  destinations: string[];
  newDestination: string;
}

interface NewTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

function durationLabel(days: number): string {
  if (days === 1) return "Day Trip";
  if (days === 7) return "1 week";
  if (days === 14) return "2 weeks";
  return `${days} days`;
}

export function NewTripDialog({ open, onOpenChange }: NewTripDialogProps) {
  const [step, setStep] = useState(1);
  const { addTrip } = useTrips();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { settings } = useUser();

  const [formData, setFormData] = useState<TripFormData>({
    partyType: "solo",
    adults: 1,
    children: 0,
    rooms: 1,
    dateType: "estimated",
    startDate: "",
    endDate: "",
    duration: 7,
    durationType: "estimated",

    travelModes: [] as string[],
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

    const allStops = formData.destinations.map(toTitleCase);
    const finalDest = formData.finalDestination ? toTitleCase(formData.finalDestination) : undefined;
    const origin = formData.origin ? toTitleCase(formData.origin) : undefined;
    // Use actual stops (not the return-home finalDest) for the title
    const titleDest = allStops.length > 0
      ? allStops[0]
      : (finalDest && origin && finalDest.toLowerCase().trim() !== origin.toLowerCase().trim() ? finalDest : null);

    const actualDays = (formData.dateType === "fixed" && formData.startDate && formData.endDate)
      ? Math.round((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / 86400000) + 1
      : formData.duration;

    addTrip({
      title: titleDest ? `Journey to ${titleDest}` : "New Adventure",
      origin,
      finalDestination: finalDest,
      dates: datesStr,
      days: actualDays,
      cost: formData.budgetType === "later" || formData.budgetAmount === "" ? "TBD" : `$${formData.budgetAmount}`,
      status: "Planning",
      destinations: allStops,
      travelMode: formData.travelModes.join(",") || "mixed",
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
      <DialogContent className={`${step === 3 ? "w-[calc(100vw-1rem)] sm:w-full sm:max-w-[600px] md:max-w-[900px]" : "sm:max-w-[600px]"} flex flex-col max-h-[90vh]`}>
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
              {/* Trip type */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Trip type</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: "solo",   label: "Solo",   sub: "Just me",       icon: <User  className="h-5 w-5" /> },
                    { value: "couple", label: "Couple", sub: "Two of us",     icon: <Users className="h-5 w-5" /> },
                    { value: "family", label: "Family", sub: "With children", icon: <Baby  className="h-5 w-5" /> },
                  ] as const).map(opt => {
                    const selected = formData.partyType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          const updates: Partial<typeof formData> = { partyType: opt.value };
                          if (opt.value === "solo")   { updates.adults = 1; updates.children = 0; updates.rooms = 1; }
                          if (opt.value === "couple") { updates.adults = 2; updates.children = 0; updates.rooms = 1; }
                          if (opt.value === "family") { updates.adults = 2; updates.children = 0; updates.rooms = 1; }
                          setFormData({ ...formData, ...updates });
                        }}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-center
                          transition-all duration-150 cursor-pointer
                          ${selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                          }`}
                      >
                        <span className={selected ? "text-primary" : "text-muted-foreground"}>{opt.icon}</span>
                        <span className="font-semibold text-sm text-foreground">{opt.label}</span>
                        <span className="text-[11px] text-muted-foreground">{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>

                {formData.partyType === "family" && (
                  <div className="mt-4 flex gap-8 justify-center">
                    {([
                      { label: "Adults",   key: "adults",   min: 1 },
                      { label: "Children", key: "children", min: 0 },
                      { label: "Rooms",    key: "rooms",    min: 1 },
                    ] as { label: string; key: "adults" | "children" | "rooms"; min: number }[]).map(({ label, key, min }) => (
                      <div key={label} className="flex flex-col items-center gap-1">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, [key]: Math.max(min, prev[key] - 1) }))}
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm hover:bg-muted"
                          >−</button>
                          <span className="w-5 text-center text-sm font-medium">{formData[key]}</span>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, [key]: prev[key] + 1 }))}
                            className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm hover:bg-muted"
                          >+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* When */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">When do you want to go?</p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: "estimated", label: "Flexible Dates", sub: "I have a rough idea" },
                    { value: "fixed",     label: "Fixed Dates",    sub: "I have exact dates"  },
                  ] as const).map(opt => {
                    const selected = formData.dateType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, dateType: opt.value })}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-4 text-center
                          transition-all duration-150 cursor-pointer
                          ${selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                          }`}
                      >
                        <span className="font-semibold text-sm text-foreground">{opt.label}</span>
                        <span className="text-[11px] text-muted-foreground">{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fixed date pickers */}
              {formData.dateType === "fixed" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                  </div>
                </div>
              )}

              {/* Flexible duration slider */}
              {formData.dateType === "estimated" && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">How long?</p>
                  <div className="text-center mb-3">
                    <span className="text-primary font-semibold text-sm">{durationLabel(formData.duration)}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={21}
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="relative h-5 mt-1">
                    <span className="absolute left-0 text-[11px] text-muted-foreground">Day trip</span>
                    <span className="absolute text-[11px] text-muted-foreground -translate-x-1/2" style={{ left: "10%" }}>3 days</span>
                    <span className="absolute text-[11px] text-muted-foreground -translate-x-1/2" style={{ left: "30%" }}>1 week</span>
                    <span className="absolute text-[11px] text-muted-foreground -translate-x-1/2" style={{ left: "65%" }}>2 weeks</span>
                    <span className="absolute right-0 text-[11px] text-muted-foreground">3+ weeks</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {([
                      { value: "estimated", label: "Approximate" },
                      { value: "max",       label: "Maximum" },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, durationType: opt.value })}
                        className={`text-xs px-3 py-1 rounded-full border transition-all
                          ${formData.durationType === opt.value
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 py-2">
              {/* Transport — multi-select */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">How are you getting there?</p>
                <p className="text-[11px] text-muted-foreground mb-3">Select all that apply</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { value: "drive", label: "Drive",  sub: "Automobile",        Icon: Car   },
                    { value: "fly",   label: "Fly",    sub: "Air travel",         Icon: Plane },
                    { value: "train", label: "Train",  sub: "Rail journeys",      Icon: Train },
                    { value: "other", label: "Other",  sub: "Ferry, bus & more",  Icon: Shuffle },
                  ] as const).map(({ value, label, sub, Icon }) => {
                    const selected = formData.travelModes.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        data-testid={`button-mode-${value}`}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          travelModes: selected
                            ? prev.travelModes.filter(m => m !== value)
                            : [...prev.travelModes, value],
                        }))}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center
                          transition-all duration-150 cursor-pointer
                          ${selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                          }`}
                      >
                        <Icon className={`h-5 w-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="font-semibold text-xs text-foreground">{label}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">{sub}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Drive note */}
                {formData.travelModes.includes("drive") && (
                  <p className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">
                    Marco will plan driving routes with scenic stops, rest breaks, and realistic drive times.
                  </p>
                )}

                {/* Cruise Planner — coming soon */}
                <button
                  disabled
                  className="mt-2 w-full flex items-center gap-3 rounded-xl border-2 border-dashed border-border/40 px-4 py-3 text-left opacity-50 cursor-not-allowed"
                >
                  <Ship className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-muted-foreground">Cruise Planner</span>
                    <span className="block text-[11px] text-muted-foreground">Plan around ports, shore excursions & embarkation</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-0 shrink-0">Coming soon</Badge>
                </button>
              </div>

              {/* Budget Preferences — tile row */}
              <div className="pt-4 border-t">
                <p className="text-sm font-semibold text-foreground mb-3">Budget</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {([
                    { value: "estimated", label: "Estimated",    sub: "Soft target"       },
                    { value: "fixed",     label: "Fixed Cap",    sub: "Strict limit"      },
                    { value: "later",     label: "Decide Later", sub: "Experience first"  },
                  ] as const).map(({ value, label, sub }) => {
                    const selected = formData.budgetType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({ ...formData, budgetType: value })}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-center
                          transition-all duration-150 cursor-pointer
                          ${selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                          }`}
                      >
                        <span className="font-semibold text-sm text-foreground">{label}</span>
                        <span className="text-[11px] text-muted-foreground">{sub}</span>
                      </button>
                    );
                  })}
                </div>
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

                {formData.travelModes.includes("fly") && (
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
            <DestinationDiscovery formData={formData} setFormData={setFormData} />
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
            <Button onClick={step === 3 ? handleFinish : handleNext} disabled={step === 3 && !formData.finalDestination && formData.destinations.length === 0}>
              {step === 3 ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Create Plan</> : <><ArrowRight className="ml-2 h-4 w-4" /> Next</>}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
