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

  // 2. Tenant 1: Gráfica & Imprenta PubliDesign (Plan PRO)
  const tenant1 = await prisma.tenant.create({
    data: {
      name: "Gráfica & Imprenta PubliDesign",
      slug: "barberia-demo", // slug de demostración principal
      plan: "PRO",
      cuentaDniAlias: "grafica.publidesign.mp",
      cuentaDniCbu: "0000003100012345678901",
      cuentaDniTitular: "PubliDesign Gráfica S.R.L.",
      requireDeposit: true,
      depositAmount: 5000,
    },
  });

  const branch1 = await prisma.branch.create({
    data: {
      tenantId: tenant1.id,
      name: "Taller Central & Imprenta",
      address: "Av. Corrientes 1450",
      city: "Buenos Aires",
      phone: "+54 11 4444-5555",
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      tenantId: tenant1.id,
      name: "Sucursal Showroom Belgrano",
      address: "Av. Cabildo 2100",
      city: "Buenos Aires",
      phone: "+54 11 4444-6666",
    },
  });

  const owner1 = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      name: "Gonzalo Dev & Diseños",
      email: "owner@grafica.com",
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
      name: "Martín Impresor",
      email: "martin@grafica.com",
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
      name: "Estudio Jurídico López & Asoc.",
      email: "contacto@lopezjuridico.com",
      phone: "+54 11 9999-8888",
      docType: "CUIT",
      docNumber: "30711234568",
      taxCategory: "RESPONSABLE_INSCRIPTO",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      tenantId: tenant1.id,
      name: "Resto-Bar El Almacén",
      email: "bar@elalmacen.com",
      phone: "+54 11 4444-1111",
      docType: "CUIT",
      docNumber: "30709876543",
      taxCategory: "MONOTRIBUTO",
    },
  });

  // Products & Stock (Insumos Gráficos)
  const productPapel = await prisma.product.create({
    data: {
      tenantId: tenant1.id,
      name: "Resma Papel Ilustración 300g (500 hojas)",
      sku: "PAP-300G",
      unit: "UNIT",
      price: 32000,
      cost: 18000,
      minStockAlert: 5,
      isServiceInput: true,
    },
  });

  const productVinilo = await prisma.product.create({
    data: {
      tenantId: tenant1.id,
      name: "Bobina Vinilo Autoadhesivo Mate 1.5m",
      sku: "VIN-MATE15",
      unit: "UNIT",
      price: 45000,
      cost: 25000,
      minStockAlert: 3,
      isServiceInput: true,
    },
  });

  const productTinta = await prisma.product.create({
    data: {
      tenantId: tenant1.id,
      name: "Tinta Ecosolvente Negra 1L",
      sku: "TIN-NEGRA1L",
      unit: "LITER",
      price: 28000,
      cost: 15000,
      minStockAlert: 2,
      isServiceInput: true,
    },
  });

  // Branch Stock setup
  await prisma.branchStock.createMany({
    data: [
      { tenantId: tenant1.id, branchId: branch1.id, productId: productPapel.id, quantity: 15 },
      { tenantId: tenant1.id, branchId: branch1.id, productId: productVinilo.id, quantity: 8 },
      { tenantId: tenant1.id, branchId: branch1.id, productId: productTinta.id, quantity: 1 }, // Stock bajo!
    ],
  });

  // Services & Recipes (Servicios Gráficos)
  const serviceCanvas = await prisma.service.create({
    data: {
      tenantId: tenant1.id,
      name: "Impresión Gigantografía Canvas 140x100cm",
      description: "Impresión de alta calidad en cuadro Canvas montado sobre bastidor de madera",
      durationMinutes: 60,
      price: 18500,
    },
  });

  const serviceTarjetas = await prisma.service.create({
    data: {
      tenantId: tenant1.id,
      name: "Tarjetas de Presentación 9x5cm x 1000u",
      description: "Tarjetas personales impresas frente y dorso en ilustración 300g con laminado mate",
      durationMinutes: 45,
      price: 14000,
      recipes: {
        create: [
          {
            productId: productPapel.id,
            quantityUsed: 1, // 1 resma usada
          },
        ],
      },
    },
  });

  const serviceFolletos = await prisma.service.create({
    data: {
      tenantId: tenant1.id,
      name: "Folletería A4 Full Color x 500u",
      description: "Folletos de promoción A4 impresión bifaz full color",
      durationMinutes: 90,
      price: 22000,
    },
  });

  // Appointments / Solicitudes de Pedido
  const now = new Date();
  const startApt1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0);
  const endApt1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0);

  const startApt2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0);
  const endApt2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30);

  await prisma.appointment.create({
    data: {
      tenantId: tenant1.id,
      branchId: branch1.id,
      staffId: staff1.id,
      customerId: customer1.id,
      serviceId: serviceTarjetas.id,
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
      serviceId: serviceFolletos.id,
      startAt: startApt2,
      endAt: endApt2,
      status: "PENDING",
    },
  });

  // AFIP Config
  await prisma.afipConfig.create({
    data: {
      tenantId: tenant1.id,
      cuit: "30711234568",
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
      trialEndsAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 días de prueba restantes
    },
  });

  console.log("✅ Datos de prueba de Gráfica & Imprenta cargados correctamente en PostgreSQL.");
}

main()
  .catch((e) => {
    console.error("❌ Error ejecutando seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
