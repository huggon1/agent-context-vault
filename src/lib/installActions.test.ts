import { describe, it, expect } from "vitest";
import { actionsForStatus, needsConfirm } from "./installActions";

describe("actionsForStatus", () => {
  it("offers install when not installed", () => {
    expect(actionsForStatus(null)).toEqual(["install"]);
  });
  it("offers only uninstall when synced", () => {
    expect(actionsForStatus("synced")).toEqual(["uninstall"]);
  });
  it("offers update + uninstall for source-updated/drift/conflict/unknown", () => {
    expect(actionsForStatus("source-updated")).toEqual(["update", "uninstall"]);
    expect(actionsForStatus("drift")).toEqual(["update", "uninstall"]);
    expect(actionsForStatus("conflict")).toEqual(["update", "uninstall"]);
    expect(actionsForStatus("unknown")).toEqual(["update", "uninstall"]);
  });
});

describe("needsConfirm", () => {
  it("requires confirm when local copy may be overwritten", () => {
    expect(needsConfirm("drift")).toBe(true);
    expect(needsConfirm("conflict")).toBe(true);
    expect(needsConfirm("unknown")).toBe(true);
  });
  it("does not require confirm for clean states", () => {
    expect(needsConfirm("synced")).toBe(false);
    expect(needsConfirm("source-updated")).toBe(false);
    expect(needsConfirm(null)).toBe(false);
  });
});
