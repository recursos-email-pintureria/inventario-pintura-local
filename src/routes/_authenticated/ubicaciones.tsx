import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  obtenerSecciones,
  obtenerUbicaciones,
  crearUbicacion,
  actualizarUbicacion,
  desactivarUbicacion,
  errorInventario
} from '../../lib/inventario'

export const Route = createFileRoute('/_authenticated/ubicaciones')({
  component: UbicacionesPage,
})

// Iconos por tipo
const iconosTipo: Record<string, string> = {
  pasillo: '🛣️',
  armario: '🗄️',
  alto: '📦',
  cross: '🔄',
  caja: '',
  reserva: '🏭',
}

// Colores por tipo
const coloresTipo: Record<string, string> = {
  pasillo: 'bg-blue-100 text-blue-800 border-blue-200',
  armario: 'bg-green-100 text-green-800 border-green-200',
  alto: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cross: 'bg-purple-100 text-purple-800 border-purple-200',
  caja: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reserva: 'bg-gray-100 text-gray-800 border-gray-200',
}

function UbicacionesPage() {
  const [secciones, setSecciones] = useState<any[]>([])
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  const [tipo, setTipo] = useState<'pasillo' | 'armario' | 'alto' | 'cross' | 'caja' | 'reserva'>('pasillo')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [seccionId, setSeccionId] = useState<string>('')
  const [ubicacionPadreId, setUbicacionPadreId] = useState<string>('')
  const [seccionOrigenId, setSeccionOrigenId] = useState<string>('')
  const [posicionLateral, setPosicionLateral] = useState<'izquierda' | 'derecha' | 'centro' | ''>('')
  const [posicionLongitudinal, setPosicionLongitudinal] = useState<'principio' | 'final' | 'paso' | ''>('')
  const [numero, setNumero] = useState<number | ''>('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    try {
      setCargando(true)
      const [seccionesData, ubicacionesData] = await Promise.all([
        obtenerSecciones(),
        obtenerUbicaciones()
      ])
      setSecciones(seccionesData)
      setUbicaciones(ubicacionesData)
      // Expandir todos los padres por defecto
      const padres = new Set(
        ubicacionesData
          .filter(u => u.tipo === 'pasillo' || u.tipo === 'reserva')
          .map(u => u.id)
      )
      setExpandidos(padres)
    } catch (err: any) {
      setError(errorInventario(err))
    } finally {
      setCargando(false)
    }
  }

  function toggleExpandir(id: string) {
    setExpandidos(prev => {
      const nuevo = new Set(prev)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
  }

  function expandirTodos() {
    const padres = new Set(
      ubicaciones
        .filter(u => u.tipo === 'pasillo' || u.tipo === 'reserva')
        .map(u => u.id)
    )
    setExpandidos(padres)
  }

  function colapsarTodos() {
    setExpandidos(new Set())
  }

  function resetearFormulario() {
    setTipo('pasillo')
    setNombre('')
    setDescripcion('')
    setSeccionId('')
    setUbicacionPadreId('')
    setSeccionOrigenId('')
    setPosicionLateral('')
    setPosicionLongitudinal('')
    setNumero('')
    setEditandoId(null)
    setMostrarFormulario(false)
    setError('')
  }

  function editarUbicacion(ubicacion: any) {
    setEditandoId(ubicacion.id)
    setTipo(ubicacion.tipo)
    setNombre(ubicacion.nombre)
    setDescripcion(ubicacion.descripcion || '')
    setSeccionId(ubicacion.seccion || '')
    setUbicacionPadreId(ubicacion.id_ubicacion_padre || '')
    setSeccionOrigenId(ubicacion.seccion_origen || '')
    setPosicionLateral(ubicacion.posicion_lateral || '')
    setPosicionLongitudinal(ubicacion.posicion_longitudinal || '')
    setNumero(ubicacion.numero || '')
    setMostrarFormulario(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function guardarUbicacion() {
    try {
      setError('')

      if (!nombre.trim()) {
        setError('El nombre es obligatorio')
        return
      }

      if (tipo === 'pasillo' && !seccionId) {
        setError('Debes seleccionar una sección para el pasillo')
        return
      }

      if ((tipo === 'armario' || tipo === 'alto' || tipo === 'cross') && !ubicacionPadreId) {
        setError('Debes seleccionar un pasillo padre')
        return
      }

      if (tipo === 'cross' && !seccionOrigenId) {
        setError('Debes seleccionar la sección de origen de los productos del cross')
        return
      }

      if ((tipo === 'armario' || tipo === 'alto' || tipo === 'cross') && !posicionLateral) {
        setError('Debes seleccionar la posición lateral (izquierda/derecha)')
        return
      }

      if (tipo === 'cross' && !posicionLongitudinal) {
        setError('Debes seleccionar la posición longitudinal (principio/final/paso)')
        return
      }

      const datosUbicacion = {
        nombre: nombre.trim(),
        tipo,
        descripcion: descripcion.trim() || null,
        id_ubicacion_padre: ubicacionPadreId || null,
        seccion: seccionId || null,
        seccion_origen: seccionOrigenId || null,
        posicion_lateral: posicionLateral || null,
        posicion_longitudinal: posicionLongitudinal || null,
        numero: numero !== '' ? numero : null,
      }

      if (editandoId) {
        await actualizarUbicacion(editandoId, datosUbicacion)
      } else {
        await crearUbicacion(datosUbicacion)
      }

      await cargarDatos()
      resetearFormulario()
    } catch (err: any) {
      setError(errorInventario(err))
    }
  }

  async function eliminarUbicacion(id: string) {
    if (!confirm('¿Seguro que quieres desactivar esta ubicación?')) return
    
    try {
      await desactivarUbicacion(id)
      await cargarDatos()
    } catch (err: any) {
      setError(errorInventario(err))
    }
  }

  function getPasillosAgrupados() {
    return secciones
      .map(seccion => {
        const pasillos = ubicaciones.filter(
          u => u.tipo === 'pasillo' && u.seccion?.id === seccion.id
        )
        return { seccion, pasillos }
      })
      .filter(grupo => grupo.pasillos.length > 0)
  }

  // Agrupar ubicaciones: padres (pasillos/reserva) y sus hijos
  function getUbicacionesAgrupadas() {
    const padres = ubicaciones.filter(u => u.tipo === 'pasillo' || u.tipo === 'reserva')
    const hijos = ubicaciones.filter(u => u.tipo !== 'pasillo' && u.tipo !== 'reserva')
    
    return padres.map(padre => ({
      padre,
      hijos: hijos.filter(h => h.id_ubicacion_padre === padre.id)
    }))
  }

  function renderizarFormulario() {
    const pasillosAgrupados = getPasillosAgrupados()

    return (
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4 mb-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          {editandoId ? 'Editar ubicación' : 'Nueva ubicación'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Tipo *</label>
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as any)
                setUbicacionPadreId('')
                setPosicionLateral('')
                setPosicionLongitudinal('')
                setSeccionOrigenId('')
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="pasillo">🛣️ Pasillo</option>
              <option value="armario">🗄️ Armario</option>
              <option value="alto">📦 Alto</option>
              <option value="cross">🔄 Cross</option>
              <option value="caja">💳 Caja</option>
              <option value="reserva">🏭 Reserva</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={tipo === 'pasillo' ? 'Ej: 12, 14, Perimetral' : 'Ej: Armario 1'}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Descripción</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tipo === 'pasillo' && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Sección *</label>
              <select
                value={seccionId}
                onChange={(e) => setSeccionId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona una sección</option>
                {secciones.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {(tipo === 'armario' || tipo === 'alto' || tipo === 'cross') && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Pasillo padre *</label>
              <select
                value={ubicacionPadreId}
                onChange={(e) => setUbicacionPadreId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona un pasillo</option>
                {pasillosAgrupados.map(({ seccion, pasillos }) => (
                  <optgroup key={seccion.id} label={seccion.nombre}>
                    {pasillos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {pasillosAgrupados.length === 0 && (
                <p className="text-sm text-red-600 mt-1">
                  ️ No hay pasillos creados. Primero crea un pasillo en la sección deseada.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(tipo === 'armario' || tipo === 'alto' || tipo === 'caja') && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Número</label>
              <input
                type="number"
                value={numero}
                onChange={(e) => setNumero(e.target.value === '' ? '' : parseInt(e.target.value))}
                placeholder="Ej: 1, 2, 3"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {tipo === 'cross' && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Sección de origen de los productos *</label>
              <select
                value={seccionOrigenId}
                onChange={(e) => setSeccionOrigenId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">¿De qué sección son los productos?</option>
                {secciones.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {(tipo === 'armario' || tipo === 'alto' || tipo === 'cross') && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Posición lateral *</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="posicionLateral" value="izquierda" checked={posicionLateral === 'izquierda'} onChange={(e) => setPosicionLateral(e.target.value as any)} className="w-4 h-4 text-blue-600" />
                <span>Izquierda</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="posicionLateral" value="derecha" checked={posicionLateral === 'derecha'} onChange={(e) => setPosicionLateral(e.target.value as any)} className="w-4 h-4 text-blue-600" />
                <span>Derecha</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="posicionLateral" value="centro" checked={posicionLateral === 'centro'} onChange={(e) => setPosicionLateral(e.target.value as any)} className="w-4 h-4 text-blue-600" />
                <span>Centro</span>
              </label>
            </div>
          </div>
        )}

        {tipo === 'cross' && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Posición longitudinal *</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="posicionLongitudinal" value="principio" checked={posicionLongitudinal === 'principio'} onChange={(e) => setPosicionLongitudinal(e.target.value as any)} className="w-4 h-4 text-blue-600" />
                <span>Principio</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="posicionLongitudinal" value="final" checked={posicionLongitudinal === 'final'} onChange={(e) => setPosicionLongitudinal(e.target.value as any)} className="w-4 h-4 text-blue-600" />
                <span>Final</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="posicionLongitudinal" value="paso" checked={posicionLongitudinal === 'paso'} onChange={(e) => setPosicionLongitudinal(e.target.value as any)} className="w-4 h-4 text-blue-600" />
                <span>Paso (entre secciones)</span>
              </label>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button onClick={guardarUbicacion} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium transition-colors">
            {editandoId ? 'Actualizar ubicación' : 'Crear ubicación'}
          </button>
          <button onClick={resetearFormulario} className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 font-medium transition-colors">
            Cancelar
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded border border-red-200 text-sm">{error}</div>
        )}
      </div>
    )
  }

  function renderizarTablaJerarquica() {
    if (cargando) return <div className="text-center py-12 text-gray-500">Cargando ubicaciones...</div>

    if (ubicaciones.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 mb-2">No hay ubicaciones creadas.</p>
          <p className="text-sm text-gray-400">Haz clic en "Nueva ubicación" para empezar a mapear tu tienda.</p>
        </div>
      )
    }

    const agrupadas = getUbicacionesAgrupadas()

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Barra de controles */}
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <strong>{ubicaciones.length}</strong> ubicaciones · <strong>{agrupadas.length}</strong> grupos
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandirTodos}
              className="text-xs bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              ▼ Expandir todo
            </button>
            <button
              onClick={colapsarTodos}
              className="text-xs bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              ▶ Colapsar todo
            </button>
          </div>
        </div>

        {/* Cabecera */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
          <div className="col-span-5">Ubicación</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-3">Detalles</div>
          <div className="col-span-2">Sección</div>
        </div>

        {/* Filas jerárquicas */}
        <div className="divide-y divide-gray-100">
          {agrupadas.map(({ padre, hijos }) => {
            const estaExpandido = expandidos.has(padre.id)
            const tieneHijos = hijos.length > 0

            return (
              <div key={padre.id}>
                {/* Fila del padre (pasillo o reserva) */}
                <div
                  className={`grid grid-cols-12 gap-2 px-4 py-3 hover:bg-blue-50 transition-colors ${
                    tieneHijos ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => tieneHijos && toggleExpandir(padre.id)}
                >
                  <div className="col-span-5 flex items-center gap-2">
                    {tieneHijos && (
                      <span className="text-gray-400 text-sm w-4">
                        {estaExpandido ? '▼' : '▶'}
                      </span>
                    )}
                    <span className="text-lg">{iconosTipo[padre.tipo]}</span>
                    <span className="font-semibold text-gray-900">{padre.nombre}</span>
                    {padre.descripcion && (
                      <span className="text-sm text-gray-500">({padre.descripcion})</span>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${coloresTipo[padre.tipo]}`}>
                      {padre.tipo.charAt(0).toUpperCase() + padre.tipo.slice(1)}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center text-sm text-gray-600">
                    {padre.posicion_lateral && <span className="mr-2">[{padre.posicion_lateral}]</span>}
                    {padre.numero && <span>#{padre.numero}</span>}
                  </div>
                  <div className="col-span-2 flex items-center text-sm text-gray-600">
                    {padre.seccion_nombre || '-'}
                  </div>
                </div>

                {/* Filas de hijos (indentadas) */}
                {estaExpandido && hijos.map(hijo => (
                  <div
                    key={hijo.id}
                    className="grid grid-cols-12 gap-2 px-4 py-2 pl-12 bg-gray-50 hover:bg-gray-100 transition-colors border-l-2 border-gray-300 ml-4"
                  >
                    <div className="col-span-5 flex items-center gap-2">
                      <span className="text-gray-400 text-xs">├─</span>
                      <span className="text-base">{iconosTipo[hijo.tipo]}</span>
                      <span className="font-medium text-gray-800">{hijo.nombre}</span>
                      {hijo.descripcion && (
                        <span className="text-xs text-gray-500">({hijo.descripcion})</span>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${coloresTipo[hijo.tipo]}`}>
                        {hijo.tipo.charAt(0).toUpperCase() + hijo.tipo.slice(1)}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center text-sm text-gray-600 flex-wrap gap-1">
                      {hijo.posicion_lateral && <span className="bg-gray-200 px-1 rounded text-xs">[{hijo.posicion_lateral}]</span>}
                      {hijo.posicion_longitudinal && <span className="bg-gray-200 px-1 rounded text-xs">({hijo.posicion_longitudinal})</span>}
                      {hijo.numero && <span className="bg-gray-200 px-1 rounded text-xs">#{hijo.numero}</span>}
                    </div>
                    <div className="col-span-2 flex items-center text-sm text-gray-600">
                      {hijo.seccion_origen_nombre || hijo.seccion_nombre || '-'}
                    </div>
                  </div>
                ))}

                {/* Acciones del padre */}
                <div className="flex justify-end gap-1 px-4 py-1 bg-gray-50 border-b border-gray-200">
                  <button
                    onClick={() => editarUbicacion(padre)}
                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                    title="Editar"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => eliminarUbicacion(padre.id)}
                    className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                    title="Desactivar"
                  >
                    🗑️ Desactivar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ubicaciones</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona la estructura jerárquica de tu tienda.</p>
        </div>
        <button
          onClick={() => { resetearFormulario(); setMostrarFormulario(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
        >
          + Nueva ubicación
        </button>
      </div>

      {mostrarFormulario && renderizarFormulario()}
      {renderizarTablaJerarquica()}
    </div>
  )
}