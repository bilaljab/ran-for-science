import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function unsafeQuery(userInput: string) {
  // ruleid: no-unsafe-raw-sql
  return prisma.$queryRawUnsafe(`SELECT * FROM "Workshop" WHERE slug = '${userInput}'`);
}

export async function unsafeQueryConcat(userInput: string) {
  // ruleid: no-unsafe-raw-sql
  return prisma.$queryRawUnsafe("SELECT * FROM \"Workshop\" WHERE slug = '" + userInput + "'");
}

export async function unsafeQueryVariable(sql: string) {
  // ruleid: no-unsafe-raw-sql
  return prisma.$queryRawUnsafe(sql);
}

export async function unsafeExecute(userInput: string) {
  // ruleid: no-unsafe-raw-sql
  await prisma.$executeRawUnsafe(`DELETE FROM "Workshop" WHERE id = '${userInput}'`);
}

export async function unsafeExecuteInTransaction(userInput: string) {
  await prisma.$transaction(async (tx) => {
    // ruleid: no-unsafe-raw-sql
    await tx.$executeRawUnsafe(`UPDATE "Workshop" SET title = '${userInput}'`);
  });
}

export function unsafePrismaRaw(userInput: string) {
  // ruleid: no-unsafe-raw-sql
  return Prisma.raw(userInput);
}

export function unsafePrismaRawTemplate(column: string) {
  // ruleid: no-unsafe-raw-sql
  return Prisma.raw(`ORDER BY ${column}`);
}

export async function safeTaggedQuery(slug: string) {
  // ok: no-unsafe-raw-sql
  return prisma.$queryRaw`SELECT * FROM "Workshop" WHERE slug = ${slug}`;
}

export async function safeTaggedExecute(id: string) {
  // ok: no-unsafe-raw-sql
  await prisma.$executeRaw`DELETE FROM "Workshop" WHERE id = ${id}`;
}

export async function safeParameterizedUnsafe(slug: string) {
  // ok: no-unsafe-raw-sql
  return prisma.$queryRawUnsafe('SELECT * FROM "Workshop" WHERE slug = $1', slug);
}

export function safePrismaSql(slug: string) {
  // ok: no-unsafe-raw-sql
  return Prisma.sql`SELECT * FROM "Workshop" WHERE slug = ${slug}`;
}

export function safePrismaRawLiteral() {
  // ok: no-unsafe-raw-sql
  return Prisma.raw("DESC");
}
