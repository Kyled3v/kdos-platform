import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CreateCompanyInput, Address } from "../models/Company";

export interface CompanyDetailsData {
  readonly companyName: string;
  readonly registrationNumber: string;
  readonly vatNumber: string;
  readonly email: string;
  readonly phone: string;
  readonly address: Address;
}

interface FieldErrors {
  readonly companyName?: string;
  readonly email?: string;
  readonly street?: string;
  readonly city?: string;
  readonly country?: string;
}

interface CompanyDetailsStepProps {
  readonly initial: Partial<CompanyDetailsData>;
  readonly onNext: (data: CompanyDetailsData) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(d: CompanyDetailsData): FieldErrors {
  const errs: Record<string, string> = {};
  if (d.companyName.trim().length === 0) errs["companyName"] = "Company name is required.";
  if (!EMAIL_PATTERN.test(d.email)) errs["email"] = "Enter a valid email address.";
  if (d.address.street.trim().length === 0) errs["street"] = "Street address is required.";
  if (d.address.city.trim().length === 0) errs["city"] = "City is required.";
  if (d.address.country.trim().length === 0) errs["country"] = "Country is required.";
  return errs as FieldErrors;
}

function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}): JSX.Element {
  const hasError = error !== undefined && error.length > 0;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={hasError ? "true" : "false"}
        className={[
          "w-full rounded-lg border bg-[#27272a] px-3.5 py-2.5 text-sm text-white outline-none",
          "placeholder:text-zinc-500 transition-colors duration-150",
          "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30",
          hasError ? "border-red-500/70" : "border-white/10 hover:border-white/20",
        ].join(" ")}
        onChange={(e) => onChange(e.target.value)}
      />
      <AnimatePresence mode="wait">
        {hasError && (
          <motion.p
            key={label}
            role="alert"
            aria-live="polite"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CompanyDetailsStep({
  initial,
  onNext,
}: CompanyDetailsStepProps): JSX.Element {
  const [companyName, setCompanyName] = useState(initial.companyName ?? "");
  const [registrationNumber, setRegistrationNumber] = useState(initial.registrationNumber ?? "");
  const [vatNumber, setVatNumber] = useState(initial.vatNumber ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [street, setStreet] = useState(initial.address?.street ?? "");
  const [city, setCity] = useState(initial.address?.city ?? "");
  const [region, setRegion] = useState(initial.address?.region ?? "");
  const [postalCode, setPostalCode] = useState(initial.address?.postalCode ?? "");
  const [country, setCountry] = useState(initial.address?.country ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const buildData = useCallback((): CompanyDetailsData => ({
    companyName,
    registrationNumber,
    vatNumber,
    email,
    phone,
    address: { street, city, region, postalCode, country },
  }), [companyName, registrationNumber, vatNumber, email, phone, street, city, region, postalCode, country]);

  const handleSubmit = useCallback((e: { preventDefault(): void }): void => {
    e.preventDefault();
    setSubmitted(true);
    const data = buildData();
    const errs = validate(data);
    setFieldErrors(errs);
    if (Object.keys(errs).length === 0) {
      onNext(data);
    }
  }, [buildData, onNext]);

  const fieldError = (key: keyof FieldErrors): string | undefined =>
    submitted ? fieldErrors[key] : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold text-white">Company Information</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Enter your company&apos;s legal details.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field
            label="Company Name"
            value={companyName}
            onChange={setCompanyName}
            error={fieldError("companyName")}
            placeholder="Acme Corporation"
            autoComplete="organization"
          />
        </div>
        <Field
          label="Registration Number"
          value={registrationNumber}
          onChange={setRegistrationNumber}
          placeholder="REG-123456"
        />
        <Field
          label="VAT Number"
          value={vatNumber}
          onChange={setVatNumber}
          placeholder="VAT-789012"
        />
        <Field
          label="Email Address"
          value={email}
          onChange={setEmail}
          error={fieldError("email")}
          placeholder="info@company.com"
          type="email"
          autoComplete="email"
        />
        <Field
          label="Phone Number"
          value={phone}
          onChange={setPhone}
          placeholder="+1 555 000 0000"
          type="tel"
          autoComplete="tel"
        />
      </div>

      <div>
        <h4 className="mb-3 text-sm font-medium text-zinc-400">Registered Address</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field
              label="Street"
              value={street}
              onChange={setStreet}
              error={fieldError("street")}
              placeholder="123 Business Ave"
              autoComplete="street-address"
            />
          </div>
          <Field
            label="City"
            value={city}
            onChange={setCity}
            error={fieldError("city")}
            placeholder="New York"
            autoComplete="address-level2"
          />
          <Field
            label="Region / State"
            value={region}
            onChange={setRegion}
            placeholder="NY"
            autoComplete="address-level1"
          />
          <Field
            label="Postal Code"
            value={postalCode}
            onChange={setPostalCode}
            placeholder="10001"
            autoComplete="postal-code"
          />
          <Field
            label="Country"
            value={country}
            onChange={setCountry}
            error={fieldError("country")}
            placeholder="United States"
            autoComplete="country-name"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <motion.button
          type="submit"
          whileTap={{ scale: 0.98 }}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#1c1c1f] transition-colors"
        >
          Continue
        </motion.button>
      </div>
    </form>
  );
}

export type { CreateCompanyInput };