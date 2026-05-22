import * as React from "react";
import { Input } from "./ui/input";
import type { SkillReadmeFields } from "../lib/parseAsset";

const KNOWN_AGENTS = ["claude-code", "codex"] as const;

interface Props {
  fields: SkillReadmeFields;
  onChange: (fields: SkillReadmeFields) => void;
  disabled?: boolean;
}

export function SkillReadmeEditor({ fields, onChange, disabled }: Props) {
  function set<K extends keyof SkillReadmeFields>(key: K, value: SkillReadmeFields[K]) {
    onChange({ ...fields, [key]: value });
  }

  function toggleAgent(agent: string) {
    const current = fields.agents.filter((a) => a !== "all");
    const next = current.includes(agent) ? current.filter((a) => a !== agent) : [...current, agent];
    set("agents", next.length > 0 ? next : ["all"]);
  }

  const activeAgents = fields.agents.filter((a) => a !== "all");

  return (
    <div className="flex flex-col gap-5">
      <Section label="Metadata">
        <Field label="Title">
          <Input
            value={fields.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="My Skill"
            disabled={disabled}
          />
        </Field>
        <Field label="Description">
          <Input
            value={fields.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What this skill does"
            disabled={disabled}
          />
        </Field>
        <Field label="Agents">
          <div className="flex gap-4">
            {KNOWN_AGENTS.map((agent) => (
              <label key={agent} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={activeAgents.includes(agent)}
                  onChange={() => toggleAgent(agent)}
                  disabled={disabled}
                  className="h-3.5 w-3.5 rounded border-border accent-primary"
                />
                <span className="font-mono text-xs">{agent}</span>
              </label>
            ))}
            {activeAgents.length === 0 && (
              <span className="text-xs text-muted-foreground">(no restriction — all agents)</span>
            )}
          </div>
        </Field>
      </Section>

      <Section label="Documentation">
        <textarea
          value={fields.body}
          onChange={(e) => set("body", e.target.value)}
          disabled={disabled}
          placeholder="Write markdown documentation here…"
          rows={14}
          spellCheck={false}
          className="w-full resize-y rounded-md border border-border bg-muted/40 p-3 font-mono text-sm leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
