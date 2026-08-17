import { withOpacity } from "../color";

describe("withOpacity", () => {
  it("converts 6-digit hex to rgba", () => {
    expect(withOpacity("#ff0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)");
  });

  it("converts 3-digit hex to rgba", () => {
    expect(withOpacity("#f00", 1)).toBe("rgba(255, 0, 0, 1)");
  });

  it("expands 3-digit hex by doubling chars", () => {
    expect(withOpacity("#abc", 0.25)).toBe("rgba(170, 187, 204, 0.25)");
  });

  it("handles hex without leading hash", () => {
    expect(withOpacity("00ff00", 0.9)).toBe("rgba(0, 255, 0, 0.9)");
  });

  it("returns input unchanged for invalid length", () => {
    expect(withOpacity("#fff00", 0.5)).toBe("#fff00");
  });

  it("returns input unchanged for non-hex characters", () => {
    expect(withOpacity("#zzzzzz", 0.5)).toBe("#zzzzzz");
  });
});
