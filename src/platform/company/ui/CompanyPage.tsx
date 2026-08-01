import { useMemo, useState } from "react";

import { CompanyService } from "../services/CompanyService";

export function CompanyPage(): JSX.Element {
  const service = useMemo(
    () => new CompanyService(),
    [],
  );

  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [message, setMessage] = useState("");

  const company = service.getCompany();

  const handleCreate = (): void => {
    if (
      !name.trim() ||
      !legalName.trim() ||
      !email.trim() ||
      !phone.trim()
    ) {
      setMessage("Complete all required company fields.");
      return;
    }

    service.createCompany({
      name,
      legalName,
      email,
      phone,
    });

    setMessage("Company configuration created.");
  };

  if (company !== null) {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm text-zinc-500">
            Organization
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-white">
            Company
          </h1>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-wide text-zinc-600">
            Company name
          </p>

          <p className="mt-2 text-xl font-medium text-white">
            {company.name}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-zinc-600">
                Legal name
              </p>

              <p className="mt-1 text-sm text-zinc-300">
                {company.legalName}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-600">
                Email
              </p>

              <p className="mt-1 text-sm text-zinc-300">
                {company.email}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-600">
                Phone
              </p>

              <p className="mt-1 text-sm text-zinc-300">
                {company.phone}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-600">
                Company ID
              </p>

              <p className="mt-1 break-all font-mono text-xs text-zinc-500">
                {company.companyId}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-medium text-white">
            Company structure
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Departments and locations will be managed from
            this company context.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="text-sm text-zinc-500">
          Organization setup
        </p>

        <h1 className="mt-1 text-3xl font-semibold text-white">
          Configure company
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Create the primary company record used by KDOS.
        </p>
      </div>

      <div className="space-y-5 rounded-xl border border-white/10 bg-white/[0.03] p-6">
        {[
          ["Company name", name, setName],
          ["Legal name", legalName, setLegalName],
          ["Email", email, setEmail],
          ["Phone", phone, setPhone],
        ].map(([label, value, setter]) => (
          <label
            key={label as string}
            className="block"
          >
            <span className="text-sm text-zinc-400">
              {label as string}
            </span>

            <input
              value={value as string}
              onChange={(event) =>
                (setter as (value: string) => void)(
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
            />
          </label>
        ))}

        {message && (
          <p className="text-sm text-zinc-400">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={handleCreate}
          className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Create company
        </button>
      </div>
    </div>
  );
}
