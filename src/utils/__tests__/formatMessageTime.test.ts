import { formatMessageTime } from "../formatMessageTime";
import { subDays, subYears } from "date-fns";

describe("formatMessageTime", () => {
  it("formats today as HH:mm", () => {
    const now = new Date();
    const result = formatMessageTime(now.toISOString());
    expect(result).toMatch(/^\d{2}:\d{2}$/);
    expect(result).toBe(formatMessageTime(now.toISOString()));
  });

  it("returns 'Dün' for yesterday", () => {
    const yesterday = subDays(new Date(), 1);
    expect(formatMessageTime(yesterday.toISOString())).toBe("Dün");
  });

  it("formats older dates as dd.MM.yyyy", () => {
    const old = new Date(2024, 0, 15, 10, 0, 0);
    expect(formatMessageTime(old.toISOString())).toBe("15.01.2024");
  });

  it("returns dd.MM.yyyy for a date years ago", () => {
    const old = subYears(new Date(), 2);
    const result = formatMessageTime(old.toISOString());
    expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });
});
