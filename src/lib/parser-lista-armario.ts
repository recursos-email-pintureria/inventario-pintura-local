import Papa from "papaparse";

export interface FilaCSV {
  numeroFila: number;
  nombre: string | null;
  referencia: string | null;
  ean: string | null;
  cantidadTexto: string | null;
  raw: Record<string, string>;
}

export interface ResultadoParser {
  filas: FilaCSV[];
  erroresParseo: string[];
  totalFilasLeidas: number;
  totalFilasDescartadas: number;
}

interface ResultadoPapa {
  data: Record<string, string>[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

const CABECERAS_REQUERIDAS = [
  { campo: "nombre", etiqueta: "NOMBRE", aliases: ["NOMBRE"] },
  { campo: "referencia", etiqueta: "REFERENCIA", aliases: ["REFERENCIA"] },
  {
    campo: "ean",
    etiqueta: "EAN",
    aliases: ["EAN", "CODIGO BARRAS", "CODIGO DE BARRAS"],
  },
  { campo: "cantidadTexto", etiqueta: "CANTIDAD", aliases: ["CANTIDAD"] },
] as const;

function normalizarTextoCSV(contenido: string): string {
  return contenido.replace(/\r\r\n/g, "\n").replace(/\r/g, "\n");
}

function normalizarCabecera(cabecera: string): string {
  return cabecera.trim().replace(/\s+/g, " ");
}

function claveCabecera(cabecera: string): string {
  return cabecera
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[_\s]+/g, " ")
    .toLocaleUpperCase("es");
}

function neutralizarCelda(valor: string): string {
  return /^\s*[=+\-@]/.test(valor) ? `'${valor}` : valor;
}

function esVacio(valor: string | undefined): boolean {
  return valor == null || valor.trim() === "";
}

function parsearConDelimitador(
  contenido: string,
  delimiter: string,
): Papa.ParseResult<Record<string, string>> {
  return Papa.parse<Record<string, string>>(contenido, {
    delimiter,
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: normalizarCabecera,
  });
}

function parsearContenido(contenido: string): ResultadoParser {
  const normalizado = normalizarTextoCSV(contenido);
  if (normalizado.trim() === "") {
    return {
      filas: [],
      erroresParseo: ["El archivo CSV está vacío"],
      totalFilasLeidas: 0,
      totalFilasDescartadas: 0,
    };
  }

  let resultado = parsearConDelimitador(normalizado, ";");
  if (
    (resultado.errors.length > 0 || resultado.meta.fields?.length === 1) &&
    normalizado.split("\n", 1)[0]?.includes(",")
  ) {
    const autodetectado = parsearConDelimitador(normalizado, "");
    if (
      autodetectado.errors.length < resultado.errors.length ||
      (autodetectado.meta.fields?.length ?? 0) > (resultado.meta.fields?.length ?? 0)
    ) {
      resultado = autodetectado;
    }
  }

  const erroresParseo = resultado.errors.map((error) => error.message);
  const campos = resultado.meta.fields ?? [];
  const clavesPorCampo = new Map<string, string>();

  for (const definicion of CABECERAS_REQUERIDAS) {
    const coincidencia = campos.find((campo) =>
      definicion.aliases.some((alias) => alias === claveCabecera(campo)),
    );
    if (coincidencia) {
      clavesPorCampo.set(definicion.campo, coincidencia);
    }
  }

  const cabecerasFaltantes = CABECERAS_REQUERIDAS.filter(
    (definicion) => !clavesPorCampo.has(definicion.campo),
  ).map((definicion) => definicion.etiqueta);

  if (cabecerasFaltantes.length > 0) {
    const motivo =
      cabecerasFaltantes.length === CABECERAS_REQUERIDAS.length
        ? "No se encontraron las cabeceras esperadas (NOMBRE, REFERENCIA, EAN y CANTIDAD)"
        : `Faltan cabeceras requeridas: ${cabecerasFaltantes.join(", ")}`;

    return {
      filas: [],
      erroresParseo: [...erroresParseo, motivo],
      totalFilasLeidas: resultado.data.length,
      totalFilasDescartadas: 0,
    };
  }

  const totalFilasLeidas = resultado.data.length;
  const filas: FilaCSV[] = [];
  let totalFilasDescartadas = 0;
  const indiceTotal = campos.findIndex(
    (campo) => claveCabecera(campo) === "TOTAL",
  );
  const cabeceraTotal = indiceTotal >= 0 ? campos[indiceTotal] : undefined;

  resultado.data.forEach((registro, indice) => {
    const raw = Object.fromEntries(
      Object.entries(registro).map(([cabecera, valor]) => [
        cabecera,
        neutralizarCelda(typeof valor === "string" ? valor : String(valor ?? "")),
      ]),
    );
    const esUltimaFila = indice === resultado.data.length - 1;
    const celdas = Object.values(raw);
    const celdasVacias = celdas.filter((valor) => esVacio(valor)).length;
    const mayoriaVacia = celdas.length > 0 && celdasVacias > celdas.length / 2;
    const totalMarcado =
      cabeceraTotal !== undefined && !esVacio(raw[cabeceraTotal]);

    if (esUltimaFila && (mayoriaVacia || totalMarcado)) {
      totalFilasDescartadas += 1;
      return;
    }

    const nombre = raw[clavesPorCampo.get("nombre") ?? ""] ?? "";
    const referencia = raw[clavesPorCampo.get("referencia") ?? ""] ?? "";
    if (esVacio(nombre) && esVacio(referencia)) {
      totalFilasDescartadas += 1;
      return;
    }

    filas.push({
      numeroFila: indice + 2,
      nombre: esVacio(nombre) ? null : nombre,
      referencia: esVacio(referencia) ? null : referencia,
      ean: valorOLista(raw[clavesPorCampo.get("ean") ?? ""]),
      cantidadTexto: valorOLista(raw[clavesPorCampo.get("cantidadTexto") ?? ""]),
      raw,
    });
  });

  return {
    filas,
    erroresParseo,
    totalFilasLeidas,
    totalFilasDescartadas,
  };
}

function valorOLista(valor: string | undefined): string | null {
  return valor == null || valor.trim() === "" ? null : valor;
}

export function parsearCSVArmario(contenido: string): ResultadoParser {
  return parsearContenido(contenido);
}

export function parsearCSVArmarioDesdeBytes(
  contenido: ArrayBuffer | Uint8Array,
): ResultadoParser {
  const bytes =
    contenido instanceof Uint8Array ? contenido : new Uint8Array(contenido);

  try {
    const textoUTF8 = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return parsearContenido(textoUTF8);
  } catch {
    try {
      const textoWindows1252 = new TextDecoder("windows-1252").decode(bytes);
      return parsearContenido(textoWindows1252);
    } catch (error) {
      return {
        filas: [],
        erroresParseo: [
          `No se pudo decodificar el archivo CSV: ${
            error instanceof Error ? error.message : "codificación desconocida"
          }`,
        ],
        totalFilasLeidas: 0,
        totalFilasDescartadas: 0,
      };
    }
  }
}
