// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20261103122557_add_activo_to_secciones.sql",
  "utf8",
);

describe("migración de estado de secciones", () => {
  let db: PGlite | undefined;

  afterEach(async () => {
    await db?.close();
    db = undefined;
  });

  it("activa las secciones existentes y activa por defecto las nuevas", async () => {
    db = new PGlite();
    await db.exec(`
        CREATE TABLE public.secciones (
          id integer PRIMARY KEY,
          nombre text NOT NULL
        );
        INSERT INTO public.secciones (id, nombre)
        VALUES (1, 'Pintura'), (2, 'Sanitarios');
      `);

    await db.exec(migration);
    await db.exec("INSERT INTO public.secciones (id, nombre) VALUES (3, 'Cocinas')");

    const result = await db.query<{ nombre: string; activo: boolean }>(
      "SELECT nombre, activo FROM public.secciones ORDER BY id",
    );

    expect(result.rows).toEqual([
      { nombre: "Pintura", activo: true },
      { nombre: "Sanitarios", activo: true },
      { nombre: "Cocinas", activo: true },
    ]);

    const column = await db.query<{ is_nullable: string; column_default: string }>(
      `SELECT is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'secciones'
         AND column_name = 'activo'`,
    );
    expect(column.rows[0]).toEqual({ is_nullable: "NO", column_default: "true" });
  }, 15_000);
});
