import { useState } from "react";
import { ConfirmModal } from "../shared/ConfirmModal";
import { COMPONENT_TYPES } from "../../data/alert-subgraph";

export interface NodeFormValues {
  name: string;
  nodeType: string;
  description: string;
}

interface Props {
  mode: "add" | "edit";
  initial?: NodeFormValues;
  onSubmit: (values: NodeFormValues) => void;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--color-bg-elevated)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text-primary)",
  outline: "none",
};

export function NodeFormModal({ mode, initial, onSubmit, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nodeType, setNodeType] = useState(initial?.nodeType ?? COMPONENT_TYPES[0]);
  const [description, setDescription] = useState(initial?.description ?? "");

  const valid = name.trim().length > 0;

  return (
    <ConfirmModal
      title={mode === "add" ? "Add Node" : "Edit Node"}
      body="Changes are written to the Proposed graph — the Current graph is left unchanged for comparison."
      confirmLabel={mode === "add" ? "Create Node" : "Save Changes"}
      confirmColor="var(--color-brand)"
      onConfirm={() => valid && onSubmit({ name: name.trim(), nodeType, description: description.trim() })}
      onClose={onClose}
    >
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest mb-1 block" style={{ color: "var(--color-text-muted)" }}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. fra-rtr-05"
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest mb-1 block" style={{ color: "var(--color-text-muted)" }}>
            Type
          </label>
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={inputStyle}
          >
            {COMPONENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest mb-1 block" style={{ color: "var(--color-text-muted)" }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this node and why is it part of the proposal?"
            rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none"
            style={inputStyle}
          />
        </div>
      </div>
    </ConfirmModal>
  );
}
