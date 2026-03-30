import { describe, it, expect } from "vitest";
import { notFoundResponse } from "../404";

describe("notFoundResponse", () => {
  it("should return status 404", () => {
    const res = notFoundResponse();
    expect(res.status).toBe(404);
  });

  it("should return text/html content type", () => {
    const res = notFoundResponse();
    expect(res.headers.get("Content-Type")).toBe("text/html;charset=UTF-8");
  });
});
