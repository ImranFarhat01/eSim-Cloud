/* eslint-disable new-cap */
/* eslint-disable no-unused-vars */
import store from '../../../redux/store'
import api from '../../../utils/Api'
import { getSvgMetadata } from './SvgParser'
import mxGraphFactory from 'mxgraph'
const {
  mxPoint
} = new mxGraphFactory()

// var edgeHandler
// orientation matrix [x1, y1, x2, y2] (KiCad defined)
// used for defining rotation and x mirrored states
// Actually 12 values but 8 required others are represented as combinations of these 8
const orientations = [
  [1, 0, 0, -1], [0, 1, 1, 0], [-1, 0, 0, 1], [0, -1, -1, 0],
  [1, 0, 0, 1], [0, -1, 1, 0], [1, 0, 0, -1], [0, 1, -1, 0],
  [-1, 0, 0, -1], [0, 1, -1, 0], [1, 0, 0, 1], [0, -1, 1, 0]
]

var graph
var defaultParent

// Scale for the graph
const defScale = 5

// Graph config
export default function KiCadFileUtils (grid) {
  graph = grid
  defaultParent = graph.getDefaultParent()
}

// Reads Kicad .sch files and returns the schematic as instructions
const readKicadSchematic = (text) => {
  const textSplit = text.split('\n')
  let i = 0
  const instructions = {}

  // Metadata and description of the schematic
  for (i = 0; i < textSplit.length; i++) {
    var brk = false
    if (i === 0) {
      var versionNum = parseInt(textSplit[i].split(' ')[4])
    }
    var splt = textSplit[i].split(' ')
    switch (splt[0]) {
      case '$Descr':
        instructions.pageSize = splt[1]
        instructions.oreientation = parseInt(splt[1]) > parseInt(splt[2]) ? 'L' : 'P'
        break
      case 'Title':
        instructions.title = splt[1].substr(1, splt[1].length - 2)
        break
      case '$EndDescr':
        brk = true
        break
      default:
        break
    }
    if (brk) break
  }

  instructions.components = []
  instructions.wires = []
  instructions.connections = []
  let component = {}
  let wire = {}
  let connection = {}
  for (;i < textSplit.length; i++) {
    let splt = textSplit[i].split(' ')
    switch (splt[0]) {
      case '$Comp':
        i += 1
        component = {}
        splt = textSplit[i].split(' ')
        if (splt[1].indexOf(':') !== -1) {
          component.library = splt[1].split(':')[0].trim().toLowerCase()
          component.componentName = splt[1].split(':')[1].trim().toLowerCase()
        } else if (splt[1].indexOf('_') !== -1) {
          component.componentName = splt[1].split('_')[0].toLowerCase()
          component.library = splt[1].split('_')[1].toLowerCase()
        } else {
          component.componentName = splt[1].toLowerCase()
        }
        i += 2 // skips identifier line
        splt = textSplit[i].split(' ')
        component.x = parseInt(splt[1]) / defScale
        component.y = parseInt(splt[2]) / defScale
        i++
        // skips F command lines
        do {
          i++
        } while (textSplit[i].split(' ')[0] === 'F')
        i += 1 // skips redundanmt x y position line
        var compOrient = textSplit[i].split(' ')
        compOrient[0] = compOrient[0].split('\t')[1]
        compOrient = compOrient.filter(e => e !== '').map(e => parseInt(e))
        var rotation = 0
        var mirrorX = false
        var mirrorY = false
        // checks which orientation matches
        for (let index = 0; index < orientations.length; index++) {
          if (compOrient[0] === orientations[index][0] && compOrient[1] === orientations[index][1] &&
            compOrient[2] === orientations[index][2] && compOrient[3] === orientations[index][3]) {
            rotation = (index % 4) * 90
            if (index > 7) { mirrorY = true } else if (index > 3) { mirrorX = true }
            break
          }
        }
        component.rotation = rotation
        component.mirrorX = mirrorX
        component.mirrorY = mirrorY
        while (textSplit[i].split(' ')[0] !== '$EndComp') {
          i++
        }
        instructions.components.push(component)
        break
      case 'Wire':
        if (splt[1] === 'Wire') {
          i += 1
          wire = {}
          let posWire = textSplit[i].split(' ')
          posWire = posWire.filter(e => e.length !== 0)
          wire.startx = parseInt(posWire[0].split('\t')[1]) / defScale
          wire.starty = parseInt(posWire[1]) / defScale
          wire.endx = parseInt(posWire[2]) / defScale
          wire.endy = parseInt(posWire[3]) / defScale
          instructions.wires.push(wire)
        }
        break
      case 'Connection':
        connection = {}
        var posConn = splt
        posConn = posConn.filter(e => e.length !== 0)
        connection.x = parseInt(posConn[2]) / defScale
        connection.y = parseInt(posConn[3]) / defScale
        instructions.connections.push(connection)
        break
      default:
        break
    }
  }
  instructions.wireSegments = [...instructions.wires]
  instructions.wires = reduceWires([...instructions.wires])
  return instructions
}

const loadComponents = async (components, wires, connections) => {
  // API config
  const token = store.getState().authReducer.token
  var config = { headers: { 'Content-Type': 'application/json' } }
  if (token) { config.headers.Authorization = `Token ${token}` }

  // Graph config
  var parent = graph.getDefaultParent()
  var model = graph.getModel()

  const insertComponent = async (comp, compData) => {
    model.beginUpdate()
    try {
      var compCell = await getSvgMetadata(graph, parent, null, null, comp.x,
        comp.y, compData, comp.rotation, true)
      graph.refresh()
    } catch (e) { console.log(e) }
    model.endUpdate()
    return compCell
  }

  const findApprComp = (compDataList, key) => {
    for (let i = 0; i < compDataList.length; i++) {
      // console.log(compDataList[i].name)
      if (compDataList[i].name.toLowerCase() === key.toLowerCase()) {
        return compDataList[i]
      }
    }
    return compDataList[0]
  }

  // Load all components
  for (let i = 0; i < components.length; i++) {
    // Get component data
    var url
    if (components[i].componentName && components[i].library) {
      url = `components/?component_library__library_name__icontains=${components[i].library}&name__icontains=${components[i].componentName}`
    } else if (!components[i].library) {
      url = `components/?name__icontains=${components[i].componentName}`
    }
    var compCell = await api.get(url, config)
      .then((res) => {
        if (res.data) {
          const compData = findApprComp(res.data, components[i].componentName)
          return insertComponent(components[i], compData)
        } else return null
      })
    components[i].mxCell = compCell
  }
  joinComponents(components, wires, connections)
}

const joinComponents = (components, wires, connections) => {
  var model = graph.getModel()

  const drawConnection = (wire, source, target, connection) => {
    if (wire.startTerminal && wire.endTerminal) {
      model.beginUpdate()
      // console.log(wire.startTerminal, wire.endTerminal)
      var v = graph.insertEdge(defaultParent, null, null, wire.startTerminal, wire.endTerminal)
      if (wire.points) {
        v.geometry.points = wire.points.map(p => { return new mxPoint(p.x, p.y) })
      }
      if (source) {
        v.geometry.sourcePoint = new mxPoint(connection.x, connection.y)
      }
      if (target) {
        v.geometry.targetPoint = new mxPoint(connection.x, connection.y)
      }
      model.endUpdate()
    }
    return v
  }

  const findWire = (w, x, y) => {
    for (const c in connections) {
      if (connections[c].x === x && connections[c].y === y) {
        for (let wi = 0; wi < wires.length && wi !== w; wi++) {
          if (wires[wi].startx === connections[c].x && wires[wi].starty === connections[c].y) {
            if (wires[wi].mxCell) { return [wires[wi].mxCell, connections[c]] }
          }
          if (wires[wi].endx === connections[c].x && wires[wi].endy === connections[c].y) {
            if (wires[wi].mxCell) { return [wires[wi].mxCell, connections[c]] }
          }
          if (wires[wi].points) {
            for (const p in wires[wi].points) {
              if (wires[wi].points[p].x === connections[c].x && connections[c].y === wires[wi].points[p].y) {
                if (wires[wi].mxCell) {
                  return [wires[wi].mxCell, connections[c]]
                } else {
                  return [null, null]
                }
              }
            }
          }
        }
      }
    }
    return [null, null]
  }

  const checkInBound = (x, y, compMxCell) => {
    let height = compMxCell.geometry.height
    let width = compMxCell.geometry.width
    let angle = compMxCell.getStyle().split('rotation=')
    if (angle[1]) {
      angle = parseInt(angle[1].split(';')[0])
      if ((angle / 90) % 2 !== 0) {
        const t = height
        height = width
        width = t
      }
    }
    if (compMxCell.geometry.x + width >= x &&
      compMxCell.geometry.x <= x &&
      compMxCell.geometry.y + height >= y &&
      compMxCell.geometry.y <= y) {
      return true
    } else {
      return false
    }
  }

  const findClosestTerminal = (x, y, compCell) => {
    let minDist = Number.MAX_SAFE_INTEGER
    let closestTerm = null
    const compx = compCell.geometry.x
    const compy = compCell.geometry.y
    for (let i = 0, child = compCell.getChildAt(i); i < compCell.getChildCount(); i++, child = compCell.getChildAt(i)) {
      if (child.connectable) {
        const distFrmPnt = Math.pow(x - (compx + child.geometry.x), 2) + Math.pow(y - (compy + child.geometry.y), 2)
        if (distFrmPnt < minDist) {
          closestTerm = child
          minDist = distFrmPnt
        }
      }
    }
    return closestTerm
  }

  const componentCells = []
  components.forEach(comp => {
    if (comp.mxCell) { componentCells.push(comp.mxCell) }
  })

  for (const c in componentCells) {
    for (const w in wires) {
      let terminal
      if (!wires[w].startTerminal) {
        if (checkInBound(wires[w].startx, wires[w].starty, componentCells[c])) {
          // console.log('S', wires[w].startx, wires[w].starty)
          terminal = findClosestTerminal(wires[w].startx, wires[w].starty, componentCells[c])
          wires[w].startTerminal = terminal
        }
      } if (!wires[w].endTerminal) {
        if (checkInBound(wires[w].endx, wires[w].endy, componentCells[c])) {
          // console.log('E', wires[w].endx, wires[w].endy)
          terminal = findClosestTerminal(wires[w].endx, wires[w].endy, componentCells[c])
          wires[w].endTerminal = terminal
        }
      }
    }
  }
  // console.log(wires)
  model.beginUpdate()
  wires.forEach(wire => {
    if (wire.startTerminal && wire.endTerminal) {
      var v = graph.insertEdge(defaultParent, null, null, wire.startTerminal, wire.endTerminal)
      if (wire.points) {
        v.geometry.points = wire.points.map(p => { return new mxPoint(p.x, p.y) })
      }
      wire.mxCell = v
    }
  })
  model.endUpdate()

  const unconnectedWirePresent = () => {
    for (const w in wires) {
      if (!wires[w].mxCell) { return true }
    }
    return false
  }

  // while (unconnectedWirePresent()) {
  for (const w in wires) {
    if (!wires[w].startTerminal) {
      [wires[w].startTerminal, wires[w].connection] = findWire(w, wires[w].startx, wires[w].starty)
      if (wires[w].endTerminal && wires[w].startTerminal && wires[w].connection) {
        wires[w].mxCell = drawConnection(wires[w], true, false, wires[w].connection)
      }
    }
    if (!wires[w].endTerminal) {
      [wires[w].endTerminal, wires[w].connection] = findWire(w, wires[w].endx, wires[w].endy)
      if (wires[w].endTerminal && wires[w].startTerminal && wires[w].connection) {
        wires[w].mxCell = drawConnection(wires[w], false, true, wires[w].connection)
      }
    }
  }
  // }
}

// Reduces the wires and connections
const reduceWires = (wires) => {
  for (let i = 0; i < wires.length; i++) {
    if (wires[i] !== undefined) {
      for (let j = 0; j < wires.length; j++) {
        if (wires[j] !== undefined && i !== j) {
          if (wires[i].endx === wires[j].startx && wires[i].endy === wires[j].starty) {
            if (wires[i].points) {
              wires[i].points.push({ x: wires[i].endx, y: wires[i].endy })
            } else {
              wires[i].points = [{ x: wires[i].endx, y: wires[i].endy }]
            }
            wires[i].endx = wires[j].endx
            wires[i].endy = wires[j].endy
            if (i !== j) {
              delete wires[j]
              j = 0
            }
          }
        }
      }
    }
  }
  wires = wires.filter(e => e !== null || e !== undefined)
  return wires
}




// KiCad Simulation_SPICE to eSim component name mapping
const KICAD_TO_ESIM_MAP = {
  // Passives -- Device:R/C/L and eSim_Devices:resistor/capacitor/inductor both map here
  r: { library: 'pspice', componentName: 'R' },
  c: { library: 'pspice', componentName: 'CAP' },
  l: { library: 'pspice', componentName: 'INDUCTOR' },
  resistor: { library: 'pspice', componentName: 'R' },
  capacitor: { library: 'pspice', componentName: 'CAP' },
  inductor: { library: 'pspice', componentName: 'INDUCTOR' },
  // Sources (standard KiCad Simulation_SPICE lib)
  vsin: { library: 'eSim_Sources', componentName: 'sine' },
  vsin_pspice: { library: 'eSim_Sources', componentName: 'sine' },
  vdc: { library: 'eSim_Sources', componentName: 'dc' },
  vdc_pspice: { library: 'eSim_Sources', componentName: 'dc' },
  vpulse: { library: 'eSim_Sources', componentName: 'pulse' },
  vpulse_pspice: { library: 'eSim_Sources', componentName: 'pulse' },
  vexp: { library: 'eSim_Sources', componentName: 'exp' },
  vexp_pspice: { library: 'eSim_Sources', componentName: 'exp' },
  vpwl: { library: 'eSim_Sources', componentName: 'pwl' },
  vpwl_pspice: { library: 'eSim_Sources', componentName: 'pwl' },
  // eSim-created circuit sources (source:VDC_PSPICE etc)
  vdc_pspice: { library: 'eSim_Sources', componentName: 'dc' },
  vsin_pspice: { library: 'eSim_Sources', componentName: 'sine' },
  isin: { library: 'eSim_Sources', componentName: 'sine' },
  idc: { library: 'eSim_Sources', componentName: 'dc' },
  vsource: { library: 'pspice', componentName: 'VSOURCE' },
  isource: { library: 'pspice', componentName: 'ISOURCE' },
  v: { library: 'eSim_Sources', componentName: 'dc' },
  // Power
  gnd: { library: 'power', componentName: 'GND' },
  pwr_flag: { library: 'power', componentName: 'PWR_FLAG' }
}

// Parse lib_symbols section to extract pin positions per symbol
const parseLibSymbols = (text) => {
  const pinDefs = {}
  // Find lib_symbols block
  const libStart = text.indexOf('(lib_symbols')
  if (libStart === -1) return pinDefs
  let depth = 0, libEnd = libStart
  for (let i = libStart; i < text.length; i++) {
    if (text[i] === '(') depth++
    else if (text[i] === ')') { depth--; if (depth === 0) { libEnd = i + 1; break } }
  }
  const libText = text.slice(libStart, libEnd)
  // Extract each top-level symbol block
  const symRegex = /\(symbol\s+"([^"]+)"([\s\S]*?)(?=\n\s*\(symbol\s+"|\n\s*\)\s*$)/g
  let m
  while ((m = symRegex.exec(libText)) !== null) {
    const name = m[1]
    const body = m[2]
    const pins = []
    const pinRegex = /\(pin\s+\w+\s+\w+\s+\(at\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\)/g
    let pm
    while ((pm = pinRegex.exec(body)) !== null) {
      pins.push({ x: parseFloat(pm[1]), y: parseFloat(pm[2]), angle: parseFloat(pm[3]) })
    }
    if (pins.length > 0) pinDefs[name] = pins
  }
  return pinDefs
}

// Rotate a point around origin by angle in degrees (KiCad uses counterclockwise)
const rotatePoint = (x, y, angleDeg) => {
  if (angleDeg === 0) return { x, y }
  const a = angleDeg * Math.PI / 180
  return {
    x: x * Math.cos(a) - y * Math.sin(a),
    y: x * Math.sin(a) + y * Math.cos(a)
  }
}


// Reads KiCad 6+ .kicad_sch S-expression format
const readKicadSchNew = (text) => {
  const instructions = {
    components: [],
    wires: [],
    connections: []
  }

  // Parse lib_symbols for pin definitions
  const pinDefs = parseLibSymbols(text)

  // Parse component instances
  const symbolRegex = /\(symbol\s+\(lib_id\s+"([^"]+)"\)\s+\(at\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\)/g
  let match
  while ((match = symbolRegex.exec(text)) !== null) {
    const libId = match[1]
    const sx = parseFloat(match[2])
    const sy = parseFloat(match[3])
    const rotation = parseFloat(match[4])
    const parts = libId.split(':')
    const library = parts[0] ? parts[0].toLowerCase() : ''
    const componentName = parts[1] ? parts[1].toLowerCase() : libId.toLowerCase()

    // Find matching pin defs (lib_symbols uses name like "R_1_1", "C_1_1")
    const shortName = parts[1] || libId
    let matchedPins = []
    for (const [defName, pins] of Object.entries(pinDefs)) {
      if (defName.toLowerCase().startsWith(shortName.toLowerCase() + '_')) {
        matchedPins = matchedPins.concat(pins)
      }
    }

    // Compute absolute pin positions in schematic mm coords
    const absPins = matchedPins.map(pin => {
      const rotated = rotatePoint(pin.x, pin.y, -rotation)
      return { x: sx + rotated.x, y: sy + rotated.y }
    })

    // Apply eSim mapping if needed
    const mapped = KICAD_TO_ESIM_MAP[componentName.toLowerCase()]
    instructions.components.push({
      library: mapped ? mapped.library : library,
      componentName: mapped ? mapped.componentName : componentName,
      x: sx * 20,
      y: sy * 20,
      rotation: (90 - rotation + 360) % 360,  // KiCad default=horizontal, eSim default=vertical
      mirrorX: false,
      mirrorY: false,
      absPins  // absolute schematic coords of pins (mm)
    })
  }

  // Parse wires
  const wireRegex = /\(wire[\s\S]*?\(pts[\s\S]*?\(xy\s+([\d.-]+)\s+([\d.-]+)\)\s*\(xy\s+([\d.-]+)\s+([\d.-]+)\)[\s\S]*?\)/g
  while ((match = wireRegex.exec(text)) !== null) {
    instructions.wires.push({
      startx: parseFloat(match[1]),
      starty: parseFloat(match[2]),
      endx: parseFloat(match[3]),
      endy: parseFloat(match[4])
    })
  }

  // Parse junctions
  const junctionRegex = /\(junction\s+\(at\s+([\d.-]+)\s+([\d.-]+)\)/g
  while ((match = junctionRegex.exec(text)) !== null) {
    instructions.connections.push({
      x: parseFloat(match[1]),
      y: parseFloat(match[2])
    })
  }

  instructions.wireSegments = [...instructions.wires]
  instructions.wires = reduceWires([...instructions.wires.map(w => ({
    startx: w.startx * 20, starty: w.starty * 20,
    endx: w.endx * 20, endy: w.endy * 20
  }))])

  // Keep original mm coords on wires for pin matching
  instructions.wiresRaw = instructions.wireSegments

  return instructions
}


const loadComponentsNew = async (components, wires, connections, rawWires) => {
  const token = store.getState().authReducer.token
  var config = { headers: { 'Content-Type': 'application/json' } }
  if (token) { config.headers.Authorization = `Token ${token}` }

  var parent = graph.getDefaultParent()
  var model = graph.getModel()

  const insertComponent = async (comp, compData) => {
    model.beginUpdate()
    try {
      var compCell = await getSvgMetadata(graph, parent, null, null, comp.x,
        comp.y, compData, comp.rotation, true)
      graph.refresh()
    } catch (e) { console.log(e) }
    model.endUpdate()
    return compCell
  }

  const findApprComp = (compDataList, key) => {
    for (let i = 0; i < compDataList.length; i++) {
      if (compDataList[i].name.toLowerCase() === key.toLowerCase()) {
        return compDataList[i]
      }
    }
    return compDataList[0]
  }

  for (let i = 0; i < components.length; i++) {
    var url
    if (components[i].componentName && components[i].library) {
      url = `components/?component_library__library_name__icontains=${components[i].library}&name__icontains=${components[i].componentName}`
    } else if (!components[i].library) {
      url = `components/?name__icontains=${components[i].componentName}`
    }
    var compCell = await api.get(url, config)
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const compData = findApprComp(res.data, components[i].componentName)
          return insertComponent(components[i], compData)
        } else return null
      })
    components[i].mxCell = compCell
  }
  joinComponentsNew(components, rawWires || [], connections)
}

const joinComponentsNew = (components, wiresRaw, connections) => {
  var model = graph.getModel()
  const EPS = 0.1 // mm tolerance for pin-to-wire matching

  const ptClose = (ax, ay, bx, by) => Math.abs(ax - bx) < EPS && Math.abs(ay - by) < EPS

  // Union-Find for building wire nets
  const ufParent = wiresRaw.map((_, i) => i)
  const find = (i) => { while (ufParent[i] !== i) { ufParent[i] = ufParent[ufParent[i]]; i = ufParent[i] } return i }
  const union = (a, b) => { ufParent[find(a)] = find(b) }

  // Group wires that share endpoints
  for (let i = 0; i < wiresRaw.length; i++) {
    for (let j = i + 1; j < wiresRaw.length; j++) {
      const wi = wiresRaw[i], wj = wiresRaw[j]
      if (ptClose(wi.endx, wi.endy, wj.startx, wj.starty) ||
          ptClose(wi.startx, wi.starty, wj.endx, wj.endy) ||
          ptClose(wi.startx, wi.starty, wj.startx, wj.starty) ||
          ptClose(wi.endx, wi.endy, wj.endx, wj.endy)) {
        union(i, j)
      }
    }
    // Union via junctions
    for (const conn of connections) {
      if (ptClose(wiresRaw[i].startx, wiresRaw[i].starty, conn.x, conn.y) ||
          ptClose(wiresRaw[i].endx, wiresRaw[i].endy, conn.x, conn.y)) {
        for (let j = 0; j < wiresRaw.length; j++) {
          if (j !== i && (ptClose(wiresRaw[j].startx, wiresRaw[j].starty, conn.x, conn.y) ||
                          ptClose(wiresRaw[j].endx, wiresRaw[j].endy, conn.x, conn.y))) {
            union(i, j)
          }
        }
      }
    }
  }

  // Build per-component pin->terminal map using pin index order
  // absPins[i] corresponds to the i-th connectable child of the mxCell
  const componentCells = []
  components.forEach(comp => {
    if (!comp.mxCell) return
    const cell = comp.mxCell
    const connectableChildren = []
    for (let i = 0; i < cell.getChildCount(); i++) {
      const child = cell.getChildAt(i)
      if (child.connectable) connectableChildren.push(child)
    }
    const pins = comp.absPins || []
    const pinMap = [] // { absPin, terminal }
    for (let i = 0; i < pins.length; i++) {
      if (connectableChildren[i]) {
        pinMap.push({ absPin: pins[i], terminal: connectableChildren[i] })
      }
    }
    componentCells.push({ cell, pinMap })
  })

  // Build net -> terminals mapping
  const netTerminals = new Map()

  for (let wi = 0; wi < wiresRaw.length; wi++) {
    const netId = find(wi)
    if (!netTerminals.has(netId)) netTerminals.set(netId, new Set())
    const net = netTerminals.get(netId)

    const endpoints = [
      { x: wiresRaw[wi].startx, y: wiresRaw[wi].starty },
      { x: wiresRaw[wi].endx, y: wiresRaw[wi].endy }
    ]

    for (const ep of endpoints) {
      for (const compEntry of componentCells) {
        for (const pm of compEntry.pinMap) {
          if (ptClose(ep.x, ep.y, pm.absPin.x, pm.absPin.y)) {
            net.add(pm.terminal)
          }
        }
      }
    }
  }

  // Draw edges
  model.beginUpdate()
  for (const [, terminals] of netTerminals) {
    const arr = Array.from(terminals)
    if (arr.length >= 2) {
      for (let i = 1; i < arr.length; i++) {
        graph.insertEdge(defaultParent, null, null, arr[0], arr[i])
      }
    }
  }
  model.endUpdate()
}

export function importKicadSchNew (fileContents) {
  const rawInstr = readKicadSchNew(fileContents)


  loadComponentsNew([...rawInstr.components], [...rawInstr.wires], [...rawInstr.connections], [...rawInstr.wiresRaw])
}

export function importSCHFile (fileContents) {
  const rawInstr = readKicadSchematic(fileContents)
  // console.log(rawInstr)
  loadComponents([...rawInstr.components], [...rawInstr.wires], [...rawInstr.connections])
}
