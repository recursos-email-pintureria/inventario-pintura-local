// @vitest-environment node
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const admin = "00000000-0000-0000-0000-000000000001";
const viewer = "00000000-0000-0000-0000-000000000002";
const producto = "00000000-0000-0000-0000-000000000011";
const ubicacion = "00000000-0000-0000-0000-000000000021";
const productoPalet = "00000000-0000-0000-0000-000000000012";
const reserva = "00000000-0000-0000-0000-000000000022";
const destinoPalet = "00000000-0000-0000-0000-000000000023";
const palet = "00000000-0000-0000-0000-000000000031";
let db: PGlite;
async function stock() {
  return (
    await db.query<{ cantidad: number }>(
      "SELECT cantidad FROM public.stock WHERE id_producto=$1 AND id_ubicacion=$2",
      [producto, ubicacion],
    )
  ).rows[0]?.cantidad;
}
async function movimiento(tipo: string, cantidad: number) {
  await db.query(
    "INSERT INTO public.movimientos(id_producto,id_ubicacion,tipo,cantidad,precio_unitario,realizado_por) VALUES ($1,$2,$3,$4,2.50,$5)",
    [producto, ubicacion, tipo, cantidad, admin],
  );
}
async function actAsAdmin() {
  await db.exec(`SELECT set_config('request.jwt.claim.sub','${admin}',false);`);
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; GRANT USAGE ON SCHEMA public,auth TO authenticated,anon; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated; CREATE TABLE public.permisos_usuario(id_usuario uuid PRIMARY KEY, puede_crear_ubicaciones boolean, puede_crear_productos boolean, puede_ver_movimientos boolean); GRANT SELECT ON public.permisos_usuario TO authenticated; ALTER TABLE public.permisos_usuario ENABLE ROW LEVEL SECURITY; CREATE POLICY permisos_propios ON public.permisos_usuario FOR SELECT TO authenticated USING(id_usuario=auth.uid());`,
  );
  await db.exec(readFileSync("sql/fases2b_2e_inventario.sql", "utf8"));
  await db.exec(`
    ALTER TABLE public.ubicaciones DROP CONSTRAINT ubicaciones_tipo_check;
    ALTER TABLE public.ubicaciones
      ADD CONSTRAINT ubicaciones_tipo_check
      CHECK (tipo IN ('pasillo', 'armario', 'reserva'));
    CREATE TABLE public.palets (
      id UUID PRIMARY KEY,
      id_reserva UUID NOT NULL REFERENCES public.ubicaciones(id),
      activo BOOLEAN NOT NULL DEFAULT true
    );
    GRANT SELECT ON public.palets TO authenticated;
  `);
  await db.query("INSERT INTO auth.users VALUES ($1),($2)", [admin, viewer]);
  await db.query(
    "INSERT INTO public.permisos_usuario VALUES ($1,true,true,true),($2,false,false,false)",
    [admin, viewer],
  );
  await db.query(
    `INSERT INTO public.productos(id,codigo_barras,sku,nombre,activo) VALUES ($1,'123','P1','Producto',true);`,
    [producto],
  );
  await db.query(
    `INSERT INTO public.ubicaciones(id,nombre,tipo,activo,creado_por) VALUES ($1,'Pasillo A','pasillo',true,$2)`,
    [ubicacion, admin],
  );
  await db.query(
    "INSERT INTO public.productos(id,codigo_barras,sku,nombre,activo) VALUES ($1,'456','P2','Producto palet',true)",
    [productoPalet],
  );
  await db.query(
    "INSERT INTO public.ubicaciones(id,nombre,tipo,activo,creado_por) VALUES ($1,'Reserva','reserva',true,$2)",
    [reserva, admin],
  );
  await db.query(
    "INSERT INTO public.ubicaciones(id,nombre,tipo,activo,creado_por) VALUES ($1,'Armario de tienda','armario',true,$2)",
    [destinoPalet, admin],
  );
  await db.query("INSERT INTO public.palets(id,id_reserva) VALUES ($1,$2)", [palet, reserva]);
  await db.exec(readFileSync("sql/fase5_5_movimientos_palets.sql", "utf8"));
  await db.exec(
    `SELECT set_config('request.jwt.claim.sub','${admin}',false); SET ROLE authenticated;`,
  );
}, 30000);
afterAll(async () => {
  await db.close();
});
describe("SQL real: stock y permisos RLS", () => {
  it("entrada suma al stock y calcula el total", async () => {
    await movimiento("entrada", 12);
    expect(await stock()).toBe(12);
    const result = await db.query<{ precio_total: string }>("SELECT precio_total FROM movimientos");
    expect(Number(result.rows[0]?.precio_total)).toBe(30);
  });
  it("salida resta stock", async () => {
    await movimiento("salida", 5);
    expect(await stock()).toBe(7);
  });
  it("salida insuficiente no crea movimiento ni modifica stock", async () => {
    await expect(movimiento("salida", 8)).rejects.toThrow(/Stock insuficiente/);
    expect(await stock()).toBe(7);
    expect(
      (await db.query<{ n: number }>("SELECT count(*)::int n FROM movimientos")).rows[0]?.n,
    ).toBe(2);
  });
  it("reposicion fija la cantidad específica", async () => {
    await movimiento("reposicion", 20);
    expect(await stock()).toBe(20);
  });
  it("ajuste fija un recuento absoluto", async () => {
    await movimiento("ajuste", 9);
    expect(await stock()).toBe(9);
  });
  it("rechaza cantidad cero y tipos no permitidos", async () => {
    await expect(movimiento("entrada", 0)).rejects.toThrow();
    await expect(movimiento("traslado", 1)).rejects.toThrow();
    expect(await stock()).toBe(9);
  });
  it("rechaza SKU duplicado", async () => {
    await expect(
      db.query(`INSERT INTO productos(codigo_barras,sku,nombre) VALUES ('456','P1','Duplicado')`),
    ).rejects.toThrow();
  });
  it("rechaza código de barras duplicado", async () => {
    await expect(
      db.query(`INSERT INTO productos(codigo_barras,sku,nombre) VALUES ('123','P2','Duplicado')`),
    ).rejects.toThrow();
  });
  it("puede_crear_ubicaciones permite desactivar y leer la fila desactivada", async () => {
    expect(
      (await db.query("UPDATE ubicaciones SET activo=false WHERE id=$1 RETURNING id", [ubicacion]))
        .rows,
    ).toHaveLength(1);
    expect(
      (await db.query("SELECT id FROM ubicaciones WHERE id=$1", [ubicacion])).rows,
    ).toHaveLength(1);
  });
  it("lector sin permisos no ve inactivas ni puede crear, editar o eliminar ubicaciones", async () => {
    await db.exec(`SELECT set_config('request.jwt.claim.sub','${viewer}',false);`);
    expect((await db.query("SELECT id FROM ubicaciones")).rows).toEqual([
      { id: reserva },
      { id: destinoPalet },
    ]);
    await expect(
      db.query(`INSERT INTO ubicaciones(nombre,tipo,creado_por) VALUES ('No','altillo',$1)`, [viewer]),
    ).rejects.toThrow();
    expect(
      (await db.query("UPDATE ubicaciones SET nombre=$1 RETURNING id", ["No"])).rows,
    ).toHaveLength(0);
    expect((await db.query("DELETE FROM ubicaciones RETURNING id")).rows).toHaveLength(0);
  });
  it("lector sin puede_crear_productos no escribe categorías o productos", async () => {
    await expect(db.query(`INSERT INTO categorias(nombre) VALUES ('No')`)).rejects.toThrow();
    await expect(
      db.query(`INSERT INTO productos(codigo_barras,sku,nombre) VALUES ('999','No','No')`),
    ).rejects.toThrow();
    expect((await db.query(`UPDATE productos SET nombre='No' RETURNING id`)).rows).toHaveLength(0);
  });
  it("lector sin puede_ver_movimientos no lee movimientos", async () => {
    expect((await db.query("SELECT * FROM movimientos")).rows).toHaveLength(0);
  });
  it("lector no puede insertar movimientos ni escribir stock directamente", async () => {
    await expect(movimiento("entrada", 1)).rejects.toThrow();
    await expect(db.query("UPDATE stock SET cantidad=99")).rejects.toThrow();
    expect(await stock()).toBe(9);
  });
  it("una entrada registra existencias asociadas al palet mediante movimientos", async () => {
    await actAsAdmin();
    await db.query(
      `INSERT INTO movimientos(id_producto,id_ubicacion,tipo,cantidad,realizado_por,id_palet)
       VALUES ($1,$2,'entrada',10,$3,$4)`,
      [productoPalet, reserva, admin, palet],
    );

    const result = await db.query<{ cantidad: number }>(
      "SELECT cantidad FROM stock WHERE id_producto=$1 AND id_palet=$2",
      [productoPalet, palet],
    );
    expect(result.rows[0]?.cantidad).toBe(10);
    await expect(
      db.query("UPDATE stock SET cantidad=99 WHERE id_palet=$1", [palet]),
    ).rejects.toThrow();
  });
  it("la reposición mueve stock del palet a tienda atómicamente", async () => {
    await actAsAdmin();
    await db.query("SELECT public.reponer_producto_palet($1,$2,$3,$4)", [
      palet,
      productoPalet,
      destinoPalet,
      4,
    ]);

    const origen = await db.query<{ cantidad: number }>(
      "SELECT cantidad FROM stock WHERE id_producto=$1 AND id_palet=$2",
      [productoPalet, palet],
    );
    const destino = await db.query<{ cantidad: number }>(
      "SELECT cantidad FROM stock WHERE id_producto=$1 AND id_ubicacion=$2 AND id_palet IS NULL",
      [productoPalet, destinoPalet],
    );
    expect(origen.rows[0]?.cantidad).toBe(6);
    expect(destino.rows[0]?.cantidad).toBe(4);
  });
  it("una reposición con stock insuficiente no deja movimiento ni destino parcial", async () => {
    await actAsAdmin();
    const movimientosAntes = await db.query<{ total: number }>(
      "SELECT count(*)::int AS total FROM movimientos WHERE id_producto=$1",
      [productoPalet],
    );
    await expect(
      db.query("SELECT public.reponer_producto_palet($1,$2,$3,$4)", [
        palet,
        productoPalet,
        destinoPalet,
        7,
      ]),
    ).rejects.toThrow(/Stock insuficiente/);

    const movimientosDespues = await db.query<{ total: number }>(
      "SELECT count(*)::int AS total FROM movimientos WHERE id_producto=$1",
      [productoPalet],
    );
    const destino = await db.query<{ cantidad: number }>(
      "SELECT cantidad FROM stock WHERE id_producto=$1 AND id_ubicacion=$2 AND id_palet IS NULL",
      [productoPalet, destinoPalet],
    );
    expect(movimientosDespues.rows[0]?.total).toBe(movimientosAntes.rows[0]?.total);
    expect(destino.rows[0]?.cantidad).toBe(4);
  });
});
