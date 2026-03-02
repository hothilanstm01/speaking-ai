"use client";

import React from "react";
import { ClearanceData } from "@/app/api/clearance-ai/route";

interface ClearanceResultFormProps {
    data: ClearanceData;
    onChange: (updated: ClearanceData) => void;
}

interface FieldConfig {
    key: keyof ClearanceData;
    label: string;
    type: "text" | "number";
    prefix?: string;
    suffix?: string;
    hint?: string;
}

const FIELDS: FieldConfig[] = [
    { key: "importer", label: "Importer", type: "text" },
    { key: "exporter", label: "Exporter", type: "text" },
    { key: "hsCode", label: "HS Code", type: "text", hint: "e.g. 8471.30.10" },
    { key: "quantity", label: "Quantity", type: "number" },
    { key: "unitPrice", label: "Unit Price", type: "number", prefix: "USD" },
    { key: "totalValue", label: "Total Value", type: "number", prefix: "USD" },
    { key: "grossWeight", label: "Gross Weight", type: "number", suffix: "kg" },
    { key: "incoterms", label: "Incoterms", type: "text", hint: "e.g. CIF, FOB, EXW" },
];

export default function ClearanceResultForm({ data, onChange }: ClearanceResultFormProps) {
    const handleChange = (key: keyof ClearanceData, raw: string) => {
        const field = FIELDS.find((f) => f.key === key)!;
        const value = field.type === "number" ? (parseFloat(raw) || 0) : raw;
        onChange({ ...data, [key]: value });
    };

    return (
        <div className="space-y-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {FIELDS.map((field) => (
                    <div key={field.key} className="flex flex-col gap-1.5">
                        <label
                            htmlFor={`field-${field.key}`}
                            className="text-xs font-semibold uppercase tracking-wider text-slate-400"
                        >
                            {field.label}
                            {field.hint && (
                                <span className="ml-1.5 text-slate-600 normal-case tracking-normal font-normal">
                                    ({field.hint})
                                </span>
                            )}
                        </label>

                        <div className="relative flex items-center">
                            {field.prefix && (
                                <span className="absolute left-3 text-sm font-medium text-slate-500 pointer-events-none">
                                    {field.prefix}
                                </span>
                            )}
                            <input
                                id={`field-${field.key}`}
                                type={field.type}
                                value={data[field.key]}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                step={field.type === "number" ? "any" : undefined}
                                className={`
                  w-full rounded-lg bg-slate-700/60 border border-slate-600
                  text-slate-100 text-sm placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all duration-150 py-2.5
                  ${field.prefix ? "pl-12 pr-4" : field.suffix ? "pl-4 pr-12" : "px-4"}
                `}
                            />
                            {field.suffix && (
                                <span className="absolute right-3 text-sm font-medium text-slate-500 pointer-events-none">
                                    {field.suffix}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
