import * as React from "react";
import { Input } from "./ui/input";
import { isValidSlug, titleToSlug } from "../lib/parseAsset";
import type { PromptFields } from "../lib/parseAsset";

const KNOWN_AGENTS = ["claude-code", "codex"] as const;

interface SlugFieldProps {
  value: string;
  onChange: (s: string) => void;
  derived: boolean;
  onBreakDerivation: () => void;
}

interface Props {
  fields: PromptFields;
  onChange: (fields: PromptFields) => void;
  disabled?: boolean;
  slugField?: SlugFieldProps;
}

export function PromptEditor({ fields, onChange, disabled, slugField }: Props) {
  function set<K extends keyof PromptFields>(key: K, value: PromptFields[K]) {
    onChange({ ...fields, [key]: value });
  }

  function handleTitleChange(title: string) {
    onChange({ ...fields, title });
    if (slugField?.derived) {
      slugField.onChange(titleToSlug(title));
    }
  }

  function toggleAgent(agent: string) {
    const current = fields.agents.filter((a) => a !== "all");
    const next = current.includes(agent) ? current.filter((a) => a !== agent) : [...current, agent];
    set("agents", next.length > 0 ? next : ["all"]);
  }

  const activeAgents = fields.agents.filter((a) => a !== "all");
  const slugInvalid = slugField && !isValidSlug(slugField.value);

  return (
    <div className="flex flex-col gap-5">
      <Section label="Metadata">
        <Field label="Title">
          <Input
            value={fields.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="My Prompt"
            disabled={disabled}
          />
        </Field>

        {slugField && (
          <Field label={<span>Slug {slugField.derived && <span className="text-muted-foreground/60">(auto)</span>}</span>}>
            <Input
              value={slugField.value}
              onChange={(e) => {
                slugField.onBreakDerivation();
                slugField.onChange(e.target.value);
              }}
              placeholder="my-prompt"
              disabled={disabled}
              className={`font-mono text-xs ${slugInvalid ? "border-red-500/60 focus-visible:ring-red-500/20" : ""}`}
            />
            {slugInvalid && (
              <p className="text-xs text-red-500">Slug must be lowercase letters, digits, and hyphens (e.g. my-prompt)</p>
            )}
          </Field>
        )}

        <Field label="Description">
          <Input
            value={fields.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Brief description of what this prompt does"
            disabled={disabled}
          />
        </Field>

        <Field label="Agents">
          <div className="flex flex-wrap gap-4">
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

      <Section label="Prompt Content">
        <p className="text-xs text-muted-foreground">This is the text that gets copied when the user clicks the Copy button on the card.</p>
        <textarea
          value={fields.copyContent}
          onChange={(e) => set("copyContent", e.target.value)}
          disabled={disabled}
          placeholder="Write the prompt text here…"
          rows={10}
          spellCheck={false}
          className="w-full resize-y rounded-md border border-border bg-muted/40 p-3 font-mono text-sm leading-relaxed text-foreground outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
      </Section>

      <Section label="Description Body">
        <p className="text-xs text-muted-foreground">Optional. Shown in the detail view below the copy bar — use this for usage instructions, examples, or context.</p>
        <textarea
          value={fields.descriptionBody}
          onChange={(e) => set("descriptionBody", e.target.value)}
          disabled={disabled}
          placeholder="How to use this prompt, examples, notes… (optional)"
          rows={6}
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

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
