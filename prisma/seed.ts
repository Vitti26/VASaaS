import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando carga de datos de prueba (Prisma Seed)...");

  // 1. Limpieza previa de datos
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.branchStock.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.serviceRecipe.deleteMany();
  await prisma.service.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.userBranch.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.afipConfig.deleteMany();
  await prisma.tenant.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // 2. Tenant 1: Barbería & Estética Central (Plan PRO)
  const tenant1 = await prisma.tenant.create({
    data: {
      name: "Barbería & Estética Central",
      slug: "barberia-central",
      plan: "PRO",
    },
  });

  const branch1 = await prisma.branch.create({
    data: {
      tenantId: tenant1.id,
      name: "Sucursal Palermo",
      address: "Av. Santa Fe 3200",
      city: "Buenos Aires",
      phone: "+54 11 4444-5555",
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      tenantId: tenant1.id,
      name: "Sucursal Belgrano",
      address: "Av. Cabildo 2100",
      city: "Buenos Aires",
      phone: "+54 11 4444-6666",
    },
  });

  const owner1 = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      name: "Juan Carlos Owner",
      email: "owner@barberia.com",
      passwordHash,
      role: "OWNER",
      userBranches: {
        create: [{ branchId: branch1.id }, { branchId: branch2.id }],
      },
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      name: "María Barbera",
      email: "maria@barberia.com",
      passwordHash,
      role: "STAFF",
      userBranches: {
        create: [{ branchId: branch1.id }],
      },
    },
  });

  // Customers
  const customer1 = await prisma.customer.create({
    data: {
      tenantId: tenant1.id,
      name: "Carlos Gómez",
      email: "carlos@email.com",
      phone: "+54 11 9999-8888",
      docType: "DNI",
      docNumber: "35123456",
      taxCategory: "CONSUMIDOR_FINAL",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      tenantId: tenant1.id,
      name: "Empresa Ejemplo S.A.",
      email: "compras@ejemplo.com",
      phone: "+54 11 4444-1111",
      docType: "CUIT",
      docNumber: "30711234568",
      taxCategory: "RESPONSABLE_INSCRIPTO",
    },
  });

  // Products & Stock
  const productReventa = await prisma.product.create({
    data: {
      tenantId: tenant1.id,
      name: "Champú Profesional 1L",
      sku: "CHA-1000",
      unit: "UNIT",
      price: 4500,
      cost: 2200,
      minStockAlert: 5,
      isServiceInput: false,
    },
  });

  const productInsumo = await prisma.product.create({
    data: {
      tenantId: tenant1.id,
      name: "Tintura Rubio Claro 60ml",
      sku: "TIN-800",
      unit: "UNIT",
      price: 2800,
      cost: 1200,
      minStockAlert: 5,
      isServiceInput: true,
    },
  });

  const productStockBajo = await prisma.product.create({
    data: {
      tenantId: tenant1.id,
      name: "Aceite de Barba 50ml",
      sku: "ACE-050",
      unit: "UNIT",
      price: 3500,
      cost: 1500,
      minStockAlert: 5,
      isServiceInput: false,
    },
  });

  // Branch Stock setup
  await prisma.branchStock.createMany({
    data: [
      { tenantId: tenant1.id, branchId: branch1.id, productId: productReventa.id, quantity: 12 },
      { tenantId: tenant1.id, branchId: branch1.id, productId: productInsumo.id, quantity: 8 },
      { tenantId: tenant1.id, branchId: branch1.id, productId: productStockBajo.id, quantity: 2 }, // Low stock!
    ],
  });

  // Services & Recipes
  const serviceCorte = await prisma.service.create({
    data: {
      tenantId: tenant1.id,
      name: "Corte de Cabello + Peinado",
      description: "Servicio estándar de peluquería masculina/femenina",
      durationMinutes: 45,
      price: 9500,
    },
  });

  const serviceColor = await prisma.service.create({
    data: {
      tenantId: tenant1.id,
      name: "Coloración + Lavado",
      description: "Servicio técnico con consumo de tintura en receta",
      durationMinutes: 90,
      price: 18000,
      recipes: {
        create: [
          {
            productId: productInsumo.id,
            quantityUsed: 1, // 1 tubo de tintura
          },
        ],
      },
    },
  });

  // Appointments
  const now = new Date();
  const startApt1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0);
  const endApt1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 45);

  const startApt2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30);
  const endApt2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0);

  await prisma.appointment.create({
    data: {
      tenantId: tenant1.id,
      branchId: branch1.id,
      staffId: staff1.id,
      customerId: customer1.id,
      serviceId: serviceCorte.id,
      startAt: startApt1,
      endAt: endApt1,
      status: "CONFIRMED",
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: tenant1.id,
      branchId: branch1.id,
      staffId: staff1.id,
      customerId: customer2.id,
      serviceId: serviceColor.id,
      startAt: startApt2,
      endAt: endApt2,
      status: "PENDING",
    },
  });

  // AFIP Config
  await prisma.afipConfig.create({
    data: {
      tenantId: tenant1.id,
      cuit: "20351234567",
      certPem: "-----BEGIN CERTIFICATE-----\nMockCertPem\n-----END CERTIFICATE-----",
      keyPem: "-----BEGIN RSA PRIVATE KEY-----\nMockKeyPem\n-----END RSA PRIVATE KEY-----",
      salesPoint: 1,
      env: "HOMOLOGATION",
    },
  });

  // Subscription
  await prisma.subscription.create({
    data: {
      tenantId: tenant1.id,
      status: "TRIALING",
      trialEndsAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days left
    },
  });

  console.log("✅ Datos de prueba cargados correctamente en PostgreSQL.");
}

main()
  .catch((e) => {
    console.error("❌ Error ejecutando seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
