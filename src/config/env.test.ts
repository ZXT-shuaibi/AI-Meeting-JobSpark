import { describe, expect, it } from "vitest";
import {
  resolveApiBaseUrl,
  resolveApiTarget,
  resolveAppEnv,
  resolveRuntimeWsBaseUrl,
  resolveStaticPreviewEnabled,
  resolveWsBaseUrl,
} from "@/config/env";

describe("HireSpark env config", () => {
  it("默认把 API base 解析为 /api/ragent", () => {
    expect(resolveApiBaseUrl(undefined)).toBe("/api/ragent");
  });

  it("默认把 API target 解析为 http://localhost:9090", () => {
    expect(resolveApiTarget(undefined)).toBe("http://localhost:9090");
  });

  it("未显式配置 ws base 时按当前协议推导", () => {
    expect(
      resolveRuntimeWsBaseUrl(
        { protocol: "https:", host: "example.com" },
        resolveWsBaseUrl(undefined),
      ),
    ).toBe("wss://example.com");
  });

  it("resolveApiBaseUrl should trim trailing slash", () => {
    expect(resolveApiBaseUrl("/api/ragent/")).toBe("/api/ragent");
  });

  it("resolveAppEnv should fallback to defaults", () => {
    const env = resolveAppEnv({});
    expect(env.apiBaseUrl).toBe("/api/ragent");
    expect(env.apiTarget).toBe("http://localhost:9090");
    expect(env.wsBaseUrl).toBeNull();
    expect(env.staticPreviewEnabled).toBe(false);
  });

  it("resolveStaticPreviewEnabled should parse boolean-like values", () => {
    expect(resolveStaticPreviewEnabled("true")).toBe(true);
    expect(resolveStaticPreviewEnabled("1")).toBe(true);
    expect(resolveStaticPreviewEnabled("false")).toBe(false);
    expect(resolveStaticPreviewEnabled(undefined)).toBe(false);
  });

  it("resolveWsBaseUrl should normalize configured value", () => {
    expect(resolveWsBaseUrl(" ws://localhost:9000/ ")).toBe(
      "ws://localhost:9000",
    );
    expect(resolveWsBaseUrl("")).toBeNull();
  });

  it("resolveRuntimeWsBaseUrl should infer protocol from location", () => {
    expect(
      resolveRuntimeWsBaseUrl(
        { protocol: "https:", host: "example.com" } as Location,
        null,
      ),
    ).toBe("wss://example.com");
    expect(
      resolveRuntimeWsBaseUrl(
        { protocol: "http:", host: "example.com:5173" } as Location,
        null,
      ),
    ).toBe("ws://example.com:5173");
  });

  it("resolveRuntimeWsBaseUrl should prefer configured value", () => {
    expect(
      resolveRuntimeWsBaseUrl(
        { protocol: "https:", host: "example.com" } as Location,
        "wss://custom.example.com",
      ),
    ).toBe("wss://custom.example.com");
  });
});
