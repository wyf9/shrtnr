import { describe, it, expect } from "vitest";
import { serveAsset } from "../assets";

describe("serveAsset", () => {
  it("should serve favicon.ico with image/x-icon content type", () => {
    const res = serveAsset("/favicon.ico");
    expect(res).not.toBeNull();
    expect(res!.headers.get("Content-Type")).toBe("image/x-icon");
  });

  it("should serve apple-touch-icon.png with image/png content type", () => {
    const res = serveAsset("/apple-touch-icon.png");
    expect(res).not.toBeNull();
    expect(res!.headers.get("Content-Type")).toBe("image/png");
  });

  it("should return null for unknown paths", () => {
    expect(serveAsset("/unknown.txt")).toBeNull();
    expect(serveAsset("/style.css")).toBeNull();
    expect(serveAsset("/")).toBeNull();
  });
});
