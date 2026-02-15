import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Thermometer,
  DollarSign,
  Ruler,
  CalendarDays,
  MapPin,
  BookOpen,
  Compass,
} from "lucide-react";

export interface SettingsFormData {
  displayName: string;
  homeLocation: string;
  passportCountry: string;
  temperatureUnit: string;
  currency: string;
  distanceUnit: string;
  dateFormat: string;
  travelStyles: string[];
}

interface SettingsFormProps {
  data: SettingsFormData;
  onChange: (data: SettingsFormData) => void;
  step?: number;
}

const TRAVEL_STYLE_OPTIONS = [
  "Adventure",
  "Cultural",
  "Luxury",
  "Budget",
  "Beach",
  "Foodie",
  "Nature",
  "Urban",
  "Road Trip",
  "Solo",
  "Family",
  "Romantic",
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "CAD", label: "CAD (C$)" },
  { value: "AUD", label: "AUD (A$)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "CHF", label: "CHF (Fr)" },
  { value: "INR", label: "INR (₹)" },
  { value: "MXN", label: "MXN (Mex$)" },
  { value: "BRL", label: "BRL (R$)" },
];

export function SettingsForm({ data, onChange, step }: SettingsFormProps) {
  const update = (partial: Partial<SettingsFormData>) => {
    onChange({ ...data, ...partial });
  };

  const toggleStyle = (style: string) => {
    const current = data.travelStyles || [];
    if (current.includes(style)) {
      update({ travelStyles: current.filter(s => s !== style) });
    } else {
      update({ travelStyles: [...current, style] });
    }
  };

  const showStep1 = step === undefined || step === 1;
  const showStep2 = step === undefined || step === 2;

  return (
    <div className="space-y-8">
      {showStep1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4 text-primary" /> Display Name
            </Label>
            <Input
              id="displayName"
              value={data.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
              placeholder="How you'd like to be addressed"
              data-testid="input-display-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="homeLocation" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-primary" /> Home City
            </Label>
            <Input
              id="homeLocation"
              value={data.homeLocation}
              onChange={(e) => update({ homeLocation: e.target.value })}
              placeholder="e.g., San Francisco, CA"
              data-testid="input-home-location"
            />
            <p className="text-xs text-muted-foreground">Used for travel logistics like timezone differences and flight hubs</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passportCountry" className="flex items-center gap-2 text-sm font-medium">
              <Compass className="h-4 w-4 text-primary" /> Passport Country
            </Label>
            <Input
              id="passportCountry"
              value={data.passportCountry}
              onChange={(e) => update({ passportCountry: e.target.value })}
              placeholder="e.g., United States"
              data-testid="input-passport-country"
            />
            <p className="text-xs text-muted-foreground">For accurate visa requirement lookups</p>
          </div>
        </div>
      )}

      {showStep2 && (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Thermometer className="h-4 w-4 text-primary" /> Temperature
            </Label>
            <RadioGroup
              value={data.temperatureUnit}
              onValueChange={(val) => update({ temperatureUnit: val })}
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <RadioGroupItem value="F" id="temp-f" className="peer sr-only" />
                <Label
                  htmlFor="temp-f"
                  className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-sm font-medium"
                >
                  Fahrenheit (°F)
                </Label>
              </div>
              <div>
                <RadioGroupItem value="C" id="temp-c" className="peer sr-only" />
                <Label
                  htmlFor="temp-c"
                  className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-sm font-medium"
                >
                  Celsius (°C)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4 text-primary" /> Currency
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {CURRENCY_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => update({ currency: c.value })}
                  className={`rounded-md border-2 p-2 text-xs font-medium transition-colors cursor-pointer ${
                    data.currency === c.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-muted hover:bg-accent hover:text-accent-foreground"
                  }`}
                  data-testid={`button-currency-${c.value}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Ruler className="h-4 w-4 text-primary" /> Distance
              </Label>
              <RadioGroup
                value={data.distanceUnit}
                onValueChange={(val) => update({ distanceUnit: val })}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <RadioGroupItem value="mi" id="dist-mi" className="peer sr-only" />
                  <Label
                    htmlFor="dist-mi"
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-sm font-medium"
                  >
                    Miles
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="km" id="dist-km" className="peer sr-only" />
                  <Label
                    htmlFor="dist-km"
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-sm font-medium"
                  >
                    Kilometers
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <CalendarDays className="h-4 w-4 text-primary" /> Date Format
              </Label>
              <RadioGroup
                value={data.dateFormat}
                onValueChange={(val) => update({ dateFormat: val })}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <RadioGroupItem value="MM/DD/YYYY" id="date-us" className="peer sr-only" />
                  <Label
                    htmlFor="date-us"
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-sm font-medium"
                  >
                    MM/DD
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="DD/MM/YYYY" id="date-intl" className="peer sr-only" />
                  <Label
                    htmlFor="date-intl"
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-sm font-medium"
                  >
                    DD/MM
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Travel Style</Label>
            <p className="text-xs text-muted-foreground">Select the styles that describe your travel preferences</p>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_STYLE_OPTIONS.map((style) => {
                const selected = (data.travelStyles || []).includes(style);
                return (
                  <Badge
                    key={style}
                    variant={selected ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 text-sm transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => toggleStyle(style)}
                    data-testid={`badge-style-${style.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {style}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
