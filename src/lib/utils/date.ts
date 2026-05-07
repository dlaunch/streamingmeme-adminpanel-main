// Change this one constant to "UTC" to revert all UI dates back to UTC
export const APP_TIMEZONE = "America/Los_Angeles";

export function toAppTime(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? "0");
  return new Date(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
}

export function getAppDayRange(): { today: Date; tomorrow: Date } {
  const now = new Date();
  const nowInAppTz = toAppTime(now);
  const midnight = new Date(nowInAppTz);
  midnight.setHours(0, 0, 0, 0);
  const tomorrowMidnight = new Date(midnight.getTime() + 24 * 60 * 60 * 1000);
  // Compute the UTC offset for the app timezone at this moment
  const offsetMs = now.getTime() - nowInAppTz.getTime();
  return {
    today: new Date(midnight.getTime() + offsetMs),
    tomorrow: new Date(tomorrowMidnight.getTime() + offsetMs),
  };
}
