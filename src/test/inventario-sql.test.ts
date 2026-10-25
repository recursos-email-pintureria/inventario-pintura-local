// @vitest-environment node
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const admin = "00000000-0000-0000-0000-000000000001";
const viewer = "00000000-0000-0000-0000-000000000002";
const producto = "00000000-0000-0000-0000-000000000011";
const ubicacion = "00000000-0000-0000-0000-000000000021";
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
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; GRANT USAGE ON SCHEMA public,auth TO authenticated,anon; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated; CREATE TABLE public.permisos_usuario(id_usuario uuid PRIMARY KEY, puede_crear_ubicaciones boolean, puede_crear_productos boolean, puede_ver_movimientos boolean); GRANT SELECT ON public.permisos_usuario TO authenticated; ALTER TABLE public.permisos_usuario ENABLE ROW LEVEL SECURITY; CREATE POLICY permisos_propios ON public.permisos_usuario FOR SELECT TO authenticated USING(id_usuario=auth.uid());`,
  );
  await db.exec(readFileSync("sql/fases2b_2e_inventario.sql", "utf8"));
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
    expect((await db.query("SELECT id FROM ubicaciones")).rows).toHaveLength(0);
    await expect(
      db.query(`INSERT INTO ubicaciones(nombre,tipo,creado_por) VALUES ('No','alto',$1)`, [viewer]),
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
});
