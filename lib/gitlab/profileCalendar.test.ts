import { describe, it, expect } from "vitest";
import {
  gitlabWebOrigin,
  parseCalendarPayload,
  sumCalendarPayload,
} from "./profileCalendar";

describe("profileCalendar", () => {
  it("gitlabWebOrigin совпадает с хостом GITLAB_API_BASE", () => {
    expect(gitlabWebOrigin()).toBe("https://gitlab.com");
  });

  it("parseCalendarPayload принимает только ISO-даты и неотрицательные числа", () => {
    expect(
      parseCalendarPayload({
        "2025-01-01": 2,
        "bad-date": 1,
        "2025-01-02": -1,
        "2025-01-03": 3,
      }),
    ).toEqual({ "2025-01-01": 2, "2025-01-03": 3 });
  });

  it("sumCalendarPayload суммирует после разбора", () => {
    expect(sumCalendarPayload({ "2025-01-01": 3, "2025-01-02": 5 })).toBe(8);
    expect(sumCalendarPayload({ ignored: "text" })).toBe(0);
    expect(sumCalendarPayload([])).toBe(0);
    expect(sumCalendarPayload(null)).toBe(0);
  });
});
