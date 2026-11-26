import { describe, it, expect } from "vitest";
import DebtsWorkspaceView from "./DebtsWorkspaceView";
import SalaryWorkspaceView from "./SalaryWorkspaceView";

describe("Workspaces Modules", () => {
  it("exports valid DebtsWorkspaceView component", () => {
    expect(typeof DebtsWorkspaceView).toBe("function");
  });

  it("exports valid SalaryWorkspaceView component", () => {
    expect(typeof SalaryWorkspaceView).toBe("function");
  });
});
