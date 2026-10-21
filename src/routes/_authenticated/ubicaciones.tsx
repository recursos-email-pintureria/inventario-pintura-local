import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  obtenerSecciones,
  obtenerUbicaciones,
  crearUbicacion,
  actualizarUbicacion,
  desactivarUbicacion,
  borrarUbicacionDefinitivamente,
  sePuedeBorrarDefinitivamente,
  errorInventario
} from '../../lib/inventario'

export const Route = createFileRoute('/_authenticated/ubicaciones')({
  component: UbicacionesPage,
})

const iconosTipo: Record<string, string> = {
  pasillo: '🛣️',
  armario: '🗄️',
  alto: '',
  cross: '🔄',
  caja: '💳',
  reserva: '🏭',
}

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
  const [borrables, setBorrables] = useState<Set<string>>(new Set())

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
      const padres = new Set(
        ubicacionesData
          .filter(u => u.tipo === 'pasillo' || u.tipo === 'reserva')
          .map(u => u.id)
      )
      setExpandidos(padres)

      // Verificar cuáles se pueden borrar definitivamente
      const borrablesSet = new Set<string>()
      for (const u of ubicacionesData) {
        const sePuede = await sePuedeBorrarDefinitivamente(u.id)
        if (sePuede) borrablesSet.add(u.id)
      }
      setBorrables(borrablesSet)
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
    setSeccionId(typeof ubicacion.seccion === 'string' ? ubicacion.seccion : ubicacion.seccion?.id || '')
    setUbicacionPadreId(ubicacion.id_ubicacion_padre || '')
    setSeccionOrigenId(typeof ubicacion.seccion_origen === 'string' ? ubicacion.seccion_origen : ubicacion.seccion_origen?.id || '')
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

      const datosUbicacion: any = {
        nombre: nombre.trim(),
        tipo,
        descripcion: descripcion.trim() || null,
        id_ubicacion_padre: ubicacionPadreId || null,
        posicion_lateral: posicionLateral || null,
        posicion_longitudinal: posicionLongitudinal || null,
        numero: numero !== '' ? numero : null,
      }

      // Lógica de sección mejorada
      if (tipo === 'pasillo') {
        datosUbicacion.seccion = seccionId || null
        datosUbicacion.seccion_origen = null
      } else if (tipo === 'cross') {
        const padre = ubicaciones.find(u => u.id === ubicacionPadreId)
        datosUbicacion.seccion = padre?.seccion?.id || padre?.seccion || null
        datosUbicacion.seccion_origen = seccionOrigenId || null
      } else if (tipo === 'reserva') {
        datosUbicacion.seccion = null
        datosUbicacion.seccion_origen = null
      } else {
        // Armario, alto, caja: usan la sección elegida manualmente, o heredan del padre si no se especifica
        if (seccionId) {
          datosUbicacion.seccion = seccionId
        } else {
          const padre = ubicaciones.find(u => u.id === ubicacionPadreId)
          datosUbicacion.seccion = padre?.seccion?.id || padre?.seccion || null
        }
        datosUbicacion.seccion_origen = null
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

  async function desactivarUbicacionHandler(id: string) {
    if (!confirm('¿Seguro que quieres desactivar esta ubicación? Los movimientos históricos se conservarán.')) return
    
    try {
      await desactivarUbicacion(id)
      await cargarDatos()
    } catch (err: any) {
      setError(errorInventario(err))
    }
  }

  async function borrarDefinitivamente(id: string) {
    if (!confirm('⚠️ ¿Borrar DEFINITIVAMENTE? Esta acción NO se puede deshacer.\n\nSolo hazlo si estás seguro de que no hay productos ni movimientos asociados.')) return
    
    try {
      await borrarUbicacionDefinitivamente(id)
      await cargarDatos()
    } catch (err: any) {
      setError(errorInventario(err))
    }
  }

  function getPasillosAgrupados() {
    return secciones
      .map(seccion => {
        const pasillos = ubicaciones.filter(
          u => u.tipo === 'pasillo' && (u.seccion?.id === seccion.id || u.seccion === seccion.id)
        )
        return { seccion, pasillos }
      })
      .filter(grupo => grupo.pasillos.length > 0)
  }

  function getUbicacionesAgrupadas() {
    const padres = ubicaciones.filter(u => u.tipo === 'pasillo' || u.tipo === 'reserva')
    const hijos = ubicaciones.filter(u => u.tipo !== 'pasillo' && u.tipo !== 'reserva')
    
    return padres.map(padre => ({
      padre,
      hijos: hijos.filter(h => h.id_ubicacion_padre === padre.id)
    }))
  }

  function getSeccionReal(ubicacion: any): string {
    if (ubicacion.tipo === 'cross') {
      return ubicacion.seccion_origen_nombre || '-'
    }
    return ubicacion.seccion_nombre || '-'
  }

  function getDetalles(ubicacion: any): string {
    const partes: string[] = []
    if (ubicacion.posicion_lateral) partes.push(ubicacion.posicion_lateral)
    if (ubicacion.posicion_longitudinal) partes.push(ubicacion.posicion_longitudinal)
    if (ubicacion.numero) partes.push(`Nº${ubicacion.numero}`)
    return partes.join(' · ') || '-'
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
              <option value="alto"> Alto</option>
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
                  ️ No hay pasillos creados. Primero crea un pasillo.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 🔧 NUEVO: Campo Sección para armarios/altos/cajas (opcional) */}
        {(tipo === 'armario' || tipo === 'alto' || tipo === 'caja') && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Sección <span className="text-gray-400 font-normal">(opcional, por defecto hereda del pasillo padre)</span>
            </label>
            <select
              value={seccionId}
              onChange={(e) => setSeccionId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Heredar del pasillo padre —</option>
              {secciones.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
               Déjalo vacío para usar la sección del pasillo padre, o elige otra si el armario contiene productos de otra sección.
            </p>
          </div>
        )}

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

  function FilaUbicacion({ ubicacion, esHijo = false }: { ubicacion: any; esHijo?: boolean }) {
    const sePuedeBorrar = borrables.has(ubicacion.id)

    return (
      <div
        className={`grid grid-cols-12 gap-2 px-4 py-2 items-center ${
          esHijo 
            ? 'pl-12 bg-gray-50 border-l-2 border-gray-300 ml-4' 
            : 'hover:bg-blue-50'
        } transition-colors`}
      >
        <div className="col-span-4 flex items-center gap-2">
          {esHijo && <span className="text-gray-400 text-xs">├─</span>}
          <span className="text-base">{iconosTipo[ubicacion.tipo]}</span>
          <span className={`text-sm ${esHijo ? 'font-medium text-gray-800' : 'font-semibold text-gray-900'}`}>
            {ubicacion.nombre}
          </span>
          {ubicacion.descripcion && (
            <span className="text-xs text-gray-500 truncate">({ubicacion.descripcion})</span>
          )}
        </div>

        <div className="col-span-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${coloresTipo[ubicacion.tipo]}`}>
            {ubicacion.tipo.charAt(0).toUpperCase() + ubicacion.tipo.slice(1)}
          </span>
        </div>

        <div className="col-span-3 text-sm text-gray-600">
          {getDetalles(ubicacion)}
        </div>

        <div className="col-span-2 text-sm text-gray-600">
          {getSeccionReal(ubicacion)}
        </div>

        <div className="col-span-1 flex justify-end gap-1">
          <button
            onClick={() => editarUbicacion(ubicacion)}
            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
            title="Editar"
          >
            ✏️
          </button>
          {sePuedeBorrar ? (
            <button
              onClick={() => borrarDefinitivamente(ubicacion.id)}
              className="text-red-700 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
              title="Borrar definitivamente"
            >
              🗑️
            </button>
          ) : (
            <button
              onClick={() => desactivarUbicacionHandler(ubicacion.id)}
              className="text-orange-600 hover:text-orange-800 p-1 rounded hover:bg-orange-50 transition-colors"
              title="Desactivar (tiene historial)"
            >
              ⏸️
            </button>
          )}
        </div>
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
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <strong>{ubicaciones.length}</strong> ubicaciones · <strong>{agrupadas.length}</strong> grupos
          </div>
          <div className="flex gap-2">
            <button onClick={expandirTodos} className="text-xs bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-100 transition-colors">
              ▼ Expandir todo
            </button>
            <button onClick={colapsarTodos} className="text-xs bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-100 transition-colors">
              ▶ Colapsar todo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
          <div className="col-span-4">Ubicación</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-3">Detalles</div>
          <div className="col-span-2">Sección</div>
          <div className="col-span-1 text-right">Acciones</div>
        </div>

        <div className="divide-y divide-gray-100">
          {agrupadas.map(({ padre, hijos }) => {
            const estaExpandido = expandidos.has(padre.id)
            const tieneHijos = hijos.length > 0

            return (
              <div key={padre.id}>
                <div
                  className={tieneHijos ? 'cursor-pointer' : ''}
                  onClick={() => tieneHijos && toggleExpandir(padre.id)}
                >
                  <FilaUbicacion ubicacion={padre} esHijo={false} />
                </div>

                {estaExpandido && hijos.map(hijo => (
                  <FilaUbicacion key={hijo.id} ubicacion={hijo} esHijo={true} />
                ))}
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