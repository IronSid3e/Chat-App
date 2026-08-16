import { format, isToday, isYesterday } from "date-fns";

export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);

  if (isToday(date)) {
    return format(date, "HH:mm");
  }

  if (isYesterday(date)) {
    return "Dün";
  }

  return format(date, "dd.MM.yyyy");
}
