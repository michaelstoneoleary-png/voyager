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
  Phone,
  User,
  Scale,
  UtensilsCrossed,
} from "lucide-react";

export interface SettingsFormData {
  displayName: string;
  homeLocation: string;
  passportCountry: string;
  gender: string;
  phoneNumber: string;
  temperatureUnit: string;
  weightUnit: string;
  currency: string;
  distanceUnit: string;
  dateFormat: string;
  travelStyles: string[];
  cuisinePreferences: string[];
  dietaryRestrictions: string[];
  diningPriceRange: string;
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

const CUISINE_OPTIONS = [
  "Italian", "Japanese", "Mexican", "Chinese", "Indian", "French",
  "Mediterranean", "American", "Thai", "Spanish", "Greek", "Middle Eastern",
  "Seafood", "Steakhouse", "Vietnamese", "Korean", "Brazilian",
];

const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher", "Nut-Free", "Dairy-Free",
];

const DINING_PRICE_OPTIONS = [
  { value: "1", label: "$", description: "Budget" },
  { value: "2", label: "$$", description: "Mid-range" },
  { value: "3", label: "$$$", description: "Upscale" },
  { value: "4", label: "$$$$", description: "Fine dining" },
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

  const toggleCuisine = (cuisine: string) => {
    const current = data.cuisinePreferences || [];
    update({ cuisinePreferences: current.includes(cuisine) ? current.filter(c => c !== cuisine) : [...current, cuisine] });
  };

  const toggleDietary = (restriction: string) => {
    const current = data.dietaryRestrictions || [];
    update({ dietaryRestrictions: current.includes(restriction) ? current.filter(r => r !== restriction) : [...current, restriction] });
  };

  const toggleDiningPrice = (price: string) => {
    const current = (data.diningPriceRange || "").split(",").filter(Boolean);
    const next = current.includes(price) ? current.filter(p => p !== price) : [...current, price];
    update({ diningPriceRange: next.sort().join(",") });
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
              <MapPin className="h-4 w-4 text-primary" /> Home Location
            </Label>
            <Input
              id="homeLocation"
              value={data.homeLocation}
              onChange={(e) => update({ homeLocation: e.target.value })}
              placeholder="e.g., Jacksonville, FL, USA"
              data-testid="input-home-location"
            />
            <p className="text-xs text-muted-foreground">Include city, state/region, and country for best results (e.g. Jacksonville, FL, USA)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passportCountry" className="flex items-center gap-2 text-sm font-medium">
              <Compass className="h-4 w-4 text-primary" /> Passport Country
            </Label>
            <Input
              id="passportCountry"
              value={data.passportCountry}
              onChange={(e) => {
                const val = e.target.value;
                const normalized = val.trim().toLowerCase().replace(/\./g, "");
                const isUS = ["united states", "united states of america", "usa", "us", "america"].includes(normalized);
                const updates: Partial<SettingsFormData> = { passportCountry: val };
                if (isUS) {
                  updates.weightUnit = "lbs";
                  updates.temperatureUnit = "F";
                  updates.distanceUnit = "mi";
                  updates.dateFormat = "MM/DD/YYYY";
                  updates.currency = "USD";
                } else if (normalized.length > 3 && !normalized.startsWith("united")) {
                  updates.weightUnit = "kg";
                  updates.temperatureUnit = "C";
                  updates.distanceUnit = "km";
                  updates.dateFormat = "DD/MM/YYYY";
                }
                update(updates);
              }}
              placeholder="e.g., United States"
              data-testid="input-passport-country"
            />
            <p className="text-xs text-muted-foreground">For accurate visa requirement lookups</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-primary" /> Gender
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <RadioGroup
              value={data.gender || ""}
              onValueChange={(val) => update({ gender: val })}
              className="grid grid-cols-4 gap-2"
            >
              {[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "non-binary", label: "Non-binary" },
                { value: "prefer-not-to-say", label: "Prefer not to say" },
              ].map((opt) => (
                <div key={opt.value}>
                  <RadioGroupItem value={opt.value} id={`gender-${opt.value}`} className="peer sr-only" />
                  <Label
                    htmlFor={`gender-${opt.value}`}
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2.5 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-xs font-medium text-center"
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Helps us customize cultural tips (dress codes, local customs) and packing suggestions for your destinations. This is completely optional and never shared publicly.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="flex items-center gap-2 text-sm font-medium">
              <Phone className="h-4 w-4 text-primary" /> Phone Number
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={data.phoneNumber}
              onChange={(e) => update({ phoneNumber: e.target.value })}
              placeholder="e.g., +1 555-123-4567"
              data-testid="input-phone-number"
            />
            <p className="text-xs text-muted-foreground">For SMS packing list links and travel alerts. We'll never share your number.</p>
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
                <Scale className="h-4 w-4 text-primary" /> Weight
              </Label>
              <RadioGroup
                value={data.weightUnit}
                onValueChange={(val) => update({ weightUnit: val })}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <RadioGroupItem value="kg" id="weight-kg" className="peer sr-only" />
                  <Label
                    htmlFor="weight-kg"
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-sm font-medium"
                    data-testid="button-weight-kg"
                  >
                    Kilograms
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="lbs" id="weight-lbs" className="peer sr-only" />
                  <Label
                    htmlFor="weight-lbs"
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-sm font-medium"
                    data-testid="button-weight-lbs"
                  >
                    Pounds
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
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

          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <UtensilsCrossed className="h-4 w-4 text-primary" /> Favourite Cuisines
            </Label>
            <p className="text-xs text-muted-foreground">Marco and Google will use these to suggest restaurants you'll love</p>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((cuisine) => {
                const selected = (data.cuisinePreferences || []).includes(cuisine);
                return (
                  <Badge
                    key={cuisine}
                    variant={selected ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 text-sm transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => toggleCuisine(cuisine)}
                  >
                    {cuisine}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Dietary Restrictions</Label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((restriction) => {
                const selected = (data.dietaryRestrictions || []).includes(restriction);
                return (
                  <Badge
                    key={restriction}
                    variant={selected ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 text-sm transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => toggleDietary(restriction)}
                  >
                    {restriction}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Preferred Dining Price Range</Label>
            <p className="text-xs text-muted-foreground">Select one or more — used to filter Yelp results</p>
            <div className="grid grid-cols-4 gap-3">
              {DINING_PRICE_OPTIONS.map((opt) => {
                const selected = (data.diningPriceRange || "").split(",").includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleDiningPrice(opt.value)}
                    className={`rounded-md border-2 p-3 text-center transition-colors cursor-pointer ${
                      selected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-muted hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <div className="font-semibold text-base">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
