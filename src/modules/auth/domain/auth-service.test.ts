import { describe, it, expect, vi } from "vitest";
import {
  registerTenantService,
  loginUserService,
  validateInviteUserPermission,
  OnboardingRepository,
} from "./onboarding-service";
import { TenantContext } from "@/modules/shared/domain/tenant";
import bcrypt from "bcryptjs";

describe("Auth & Onboarding Domain Logic Tests", () => {
  const mockRepo: OnboardingRepository = {
    findTenantBySlug: vi.fn(),
    findUserByEmail: vi.fn(),
    createTenantWithMasterData: vi.fn(),
  };

  describe("registerTenantService", () => {
    it("should successfully register new tenant and owner", async () => {
      vi.mocked(mockRepo.findTenantBySlug).mockResolvedValue(false);
      vi.mocked(mockRepo.findUserByEmail).mockResolvedValue(null);
      vi.mocked(mockRepo.createTenantWithMasterData).mockResolvedValue({
        tenantId: "tenant-123",
        branchId: "branch-456",
        userId: "user-789",
        role: "OWNER",
      });

      const input = {
        ownerName: "Carlos Propietario",
        email: "carlos@minegocio.com",
        password: "password123",
        tenantName: "Barbería Estilo",
        tenantSlug: "barberia-estilo",
        branchName: "Sucursal Palermo",
        serviceName: "Corte de Cabello",
        servicePrice: 9500,
      };

      const result = await registerTenantService(input, mockRepo);
      expect(result.tenantId).toBe("tenant-123");
      expect(result.role).toBe("OWNER");
      expect(mockRepo.createTenantWithMasterData).toHaveBeenCalled();
    });

    it("should throw SlugAlreadyExists when tenant slug is taken", async () => {
      vi.mocked(mockRepo.findTenantBySlug).mockResolvedValue(true);

      const input = {
        ownerName: "Carlos",
        email: "carlos@email.com",
        password: "password123",
        tenantName: "Barbería Estilo",
        tenantSlug: "barberia-estilo",
        branchName: "Sucursal Palermo",
        serviceName: "Corte",
        servicePrice: 9500,
      };

      await expect(registerTenantService(input, mockRepo)).rejects.toThrow("SlugAlreadyExists");
    });
  });

  describe("loginUserService", () => {
    it("should validate user password and return session payload", async () => {
      const passwordHash = await bcrypt.hash("correct-password", 10);
      vi.mocked(mockRepo.findUserByEmail).mockResolvedValue({
        id: "user-123",
        tenantId: "tenant-999",
        email: "usuario@ejemplo.com",
        passwordHash,
        name: "Juan Pérez",
        role: "OWNER",
        assignedBranchIds: ["branch-111"],
      });

      const result = await loginUserService(
        { email: "usuario@ejemplo.com", password: "correct-password" },
        mockRepo
      );

      expect(result.tenantId).toBe("tenant-999");
      expect(result.role).toBe("OWNER");
    });

    it("should throw InvalidCredentials when password is incorrect", async () => {
      const passwordHash = await bcrypt.hash("correct-password", 10);
      vi.mocked(mockRepo.findUserByEmail).mockResolvedValue({
        id: "user-123",
        tenantId: "tenant-999",
        email: "usuario@ejemplo.com",
        passwordHash,
        name: "Juan Pérez",
        role: "OWNER",
        assignedBranchIds: ["branch-111"],
      });

      await expect(
        loginUserService({ email: "usuario@ejemplo.com", password: "wrong-password" }, mockRepo)
      ).rejects.toThrow("InvalidCredentials");
    });
  });

  describe("validateInviteUserPermission (Role Permission Matrix)", () => {
    it("should allow OWNER to invite ADMIN or STAFF", () => {
      const ownerCtx: TenantContext = {
        tenantId: "t-1",
        userId: "u-1",
        role: "OWNER",
        assignedBranchIds: ["b-1"],
      };

      expect(() => validateInviteUserPermission(ownerCtx, "ADMIN")).not.toThrow();
      expect(() => validateInviteUserPermission(ownerCtx, "STAFF")).not.toThrow();
    });

    it("should throw Forbidden when STAFF attempts to invite users", () => {
      const staffCtx: TenantContext = {
        tenantId: "t-1",
        userId: "u-2",
        role: "STAFF",
        assignedBranchIds: ["b-1"],
      };

      expect(() => validateInviteUserPermission(staffCtx, "STAFF")).toThrow("Forbidden");
    });

    it("should throw Forbidden when ADMIN attempts to create an OWNER user", () => {
      const adminCtx: TenantContext = {
        tenantId: "t-1",
        userId: "u-3",
        role: "ADMIN",
        assignedBranchIds: ["b-1"],
      };

      expect(() => validateInviteUserPermission(adminCtx, "OWNER")).toThrow("Forbidden");
    });
  });
});
