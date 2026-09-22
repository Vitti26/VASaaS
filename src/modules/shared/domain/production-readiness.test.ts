import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";
import fs from "fs";
import path from "path";

describe("Fase 13: Preparación para Producción - Test Suite", () => {
  describe("1. Healthcheck Endpoint (/api/health)", () => {
    it("should return a JSON response with status, timestamp, uptime, and database status", async () => {
      const response = await GET();
      const payload = await response.json();

      expect([200, 503]).toContain(response.status);
      expect(payload).toHaveProperty("status");
      expect(payload).toHaveProperty("timestamp");
      expect(payload).toHaveProperty("uptime");
      expect(payload).toHaveProperty("database");
      expect(payload).toHaveProperty("environment");
      expect(payload).toHaveProperty("version", "1.0.0");
      expect(["ok", "degraded"]).toContain(payload.status);
    });
  });

  describe("2. Configuration & Legal Pages Verification", () => {
    it("should verify existence of Next.js standalone config in next.config.mjs", () => {
      const nextConfigPath = path.join(process.cwd(), "next.config.mjs");
      expect(fs.existsSync(nextConfigPath)).toBe(true);

      const content = fs.readFileSync(nextConfigPath, "utf-8");
      expect(content).toContain('output: "standalone"');
    });

    it("should verify production Dockerfile exists with unprivileged user configuration", () => {
      const dockerfilePath = path.join(process.cwd(), "Dockerfile");
      expect(fs.existsSync(dockerfilePath)).toBe(true);

      const content = fs.readFileSync(dockerfilePath, "utf-8");
      expect(content).toContain("FROM node:18-alpine");
      expect(content).toContain("USER nextjs");
      expect(content).toContain("EXPOSE 3000");
    });

    it("should verify deployment and backup scripts exist", () => {
      const backupScriptPath = path.join(process.cwd(), "scripts", "backup-db.sh");
      const migrateScriptPath = path.join(process.cwd(), "scripts", "migrate-and-start.sh");

      expect(fs.existsSync(backupScriptPath)).toBe(true);
      expect(fs.existsSync(migrateScriptPath)).toBe(true);

      const backupContent = fs.readFileSync(backupScriptPath, "utf-8");
      expect(backupContent).toContain("pg_dump");
      expect(backupContent).toContain("30");
    });

    it("should verify legal terms and privacy policy pages exist", () => {
      const termsPath = path.join(process.cwd(), "src", "app", "terms", "page.tsx");
      const privacyPath = path.join(process.cwd(), "src", "app", "privacy", "page.tsx");

      expect(fs.existsSync(termsPath)).toBe(true);
      expect(fs.existsSync(privacyPath)).toBe(true);
    });
  });
});
