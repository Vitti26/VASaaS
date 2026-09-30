import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/modules/shared/infrastructure/db";
import { resolveTenantContext } from "@/modules/shared/infrastructure/tenant-context";
import { assertRole } from "@/modules/shared/infrastructure/permissions";

export const dynamic = "force-dynamic";

const PaymentGatewaysSchema = z.object({
  mpAccessToken: z.string().optional().nullable(),
  mpPublicKey: z.string().optional().nullable(),
  cuentaDniAlias: z.string().optional().nullable(),
  cuentaDniCbu: z.string().optional().nullable(),
  cuentaDniTitular: z.string().optional().nullable(),
  requireDeposit: z.boolean().default(false),
  depositAmount: z.number().min(0).optional().nullable(),
});

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("vasaas_session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const context = await resolveTenantContext(sessionToken);

    const tenant = await db.tenant.findUnique({
      where: { id: context.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        mpAccessToken: true,
        mpPublicKey: true,
        cuentaDniAlias: true,
        cuentaDniCbu: true,
        cuentaDniTitular: true,
        requireDeposit: true,
        depositAmount: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      paymentGateways: {
        mpAccessToken: tenant.mpAccessToken || "",
        mpPublicKey: tenant.mpPublicKey || "",
        cuentaDniAlias: tenant.cuentaDniAlias || "",
        cuentaDniCbu: tenant.cuentaDniCbu || "",
        cuentaDniTitular: tenant.cuentaDniTitular || "",
        requireDeposit: tenant.requireDeposit || false,
        depositAmount: tenant.depositAmount ? Number(tenant.depositAmount) : 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("vasaas_session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const context = await resolveTenantContext(sessionToken);
    assertRole(context, ["OWNER"]);

    const body = await req.json();
    const validated = PaymentGatewaysSchema.parse(body);

    const updated = await db.tenant.update({
      where: { id: context.tenantId },
      data: {
        mpAccessToken: validated.mpAccessToken || null,
        mpPublicKey: validated.mpPublicKey || null,
        cuentaDniAlias: validated.cuentaDniAlias || null,
        cuentaDniCbu: validated.cuentaDniCbu || null,
        cuentaDniTitular: validated.cuentaDniTitular || null,
        requireDeposit: validated.requireDeposit,
        depositAmount: validated.depositAmount ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pasarelas de cobro actualizadas correctamente",
      tenant: {
        slug: updated.slug,
        requireDeposit: updated.requireDeposit,
        depositAmount: updated.depositAmount ? Number(updated.depositAmount) : 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

