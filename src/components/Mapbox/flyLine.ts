import { THREE } from 'threebox-plugin'
import mapboxgl from 'mapbox-gl'
const linklist = [
  {
    source: {
      latitude: 23.11,
      longitude: 113.318977
    },
    target: {
      latitude: 23.21,
      longitude: 113.418977
    }
  },
  {
    source: {
      latitude: 23.11,
      longitude: 113.318977
    },
    target: {
      latitude: 23.1,
      longitude: 113.418977
    }
  },
  {
    source: {
      latitude: 37.28113,
      longitude: -98.577433
    },
    target: {
      latitude: 36.43222,
      longitude: -100.14111
    }
  },
  {
    source: {
      latitude: 37.28113,
      longitude: -98.577433
    },
    target: {
      latitude: 36.45169,
      longitude: -103.1841
    }
  },
  {
    source: {
      latitude: 36.910248,
      longitude: -103.807756
    },
    target: {
      latitude: 36.638648,
      longitude: -103.882987
    }
  },
  {
    source: {
      latitude: 37.28113,
      longitude: -98.577433
    },
    target: {
      latitude: 36.43222,
      longitude: -100.14111
    }
  }
]

// 全局变量
const colorHigh = new THREE.Color(0xffff00) // line color high
const colorNormal = new THREE.Color(0x006666) // line color
const lineGeometryList = []

const getControlPoint = (sourcePoint, targetPoint) => {
  return {
    x: (sourcePoint.x + targetPoint.x) / 2,
    y: (sourcePoint.y + targetPoint.y) / 2,
    // z: (sourcePoint.z + targetPoint.z) / 2
    z: 0.0001
  }
}

// 绘制抛物线
function makeArcline(link) {
  const source = [link.source.longitude, link.source.latitude]
  const target = [link.target.longitude, link.target.latitude]

  const sourcePoint = mapboxMercator(source)
  const targetPoint = mapboxMercator(target)
  console.log(sourcePoint, targetPoint)

  const controlPoint = getControlPoint(sourcePoint, targetPoint)

  // 创建三维二次贝塞尔曲线
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(sourcePoint.x, sourcePoint.y, sourcePoint.z),
    new THREE.Vector3(controlPoint.x, controlPoint.y, controlPoint.z),
    new THREE.Vector3(targetPoint.x, targetPoint.y, targetPoint.z)
  )

  // 流动线效果
  const divisions = 30 // 曲线的分段数量
  const points = curve.getPoints(divisions) // 返回分段的点 divisions + 1 个

  // 创建几何体
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const colors = new Float32Array(points.length * 4)

  points.forEach((d, i) => {
    colors[i * 4] = colorNormal.r
    colors[i * 4 + 1] = colorNormal.g
    colors[i * 4 + 2] = colorNormal.b
    colors[i * 4 + 3] = 1
  })

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))

  // 材质
  const material = new THREE.LineBasicMaterial({
    vertexColors: true, // 顶点着色
    linewidth: 5, // 没用，不支持设置lineWidth
    transparent: true,
    side: THREE.DoubleSide
  })

  const mesh = new THREE.Line(geometry, material)

  lineGeometryList.push(geometry)

  return mesh
}

const makeArcGroup = () => {
  const group = new THREE.Group()
  linklist.forEach((link) => {
    group.add(makeArcline(link))
  })
  return group
}

// 线的动画
let timestamp = 0
let colorIndex = 0
function arclineAnimate() {
  lineGeometryList.forEach((geometry) => {
    const color = geometry.getAttribute('color')

    const now = Date.now()
    if (now - timestamp > 30) {
      timestamp = now
      colorIndex++
      if (colorIndex >= color.count) {
        colorIndex = 0
      }
    }

    for (let i = 0; i < color.array.length; i += 4) {
      if (i / 4 === colorIndex) {
        color.array[i + 0] = colorHigh.r
        color.array[i + 1] = colorHigh.g
        color.array[i + 2] = colorHigh.b
        color.array[i + 3] = 1
      } else {
        color.array[i + 0] = colorNormal.r
        color.array[i + 1] = colorNormal.g
        color.array[i + 2] = colorNormal.b
        color.array[i + 3] = 0.1
      }
    }
    geometry.attributes.color.needsUpdate = true
  })
}

function initThreeLayer(map) {
  const threeLayer = {
    id: 'three-layer',
    type: 'custom',
    renderingMode: '3d',
    onAdd: async function (map, mbxContext) {
      this.camera = new THREE.Camera()
      this.scene = new THREE.Scene()
      this.map = map
      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: mbxContext,
        antialias: true
      })
      this.renderer.autoClear = false

      // 辅助线
      const axes = new THREE.AxesHelper(100000)
      this.scene.add(axes)

      const lineGroup = makeArcGroup() // 抛物线集合
      console.log(lineGroup)

      this.scene.add(lineGroup)
    },
    render: function (gl, matrix) {
      this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix)
      this.renderer.state.reset()
      this.renderer.render(this.scene, this.camera)
      this.map.triggerRepaint()

      arclineAnimate() // 抛物流动逻辑
    }
  }

  // return threeLayer
  map.addLayer(threeLayer)
}

// 经纬度转坐标点
function mapboxMercator(lngLat) {
  return mapboxgl.MercatorCoordinate.fromLngLat(lngLat, 0)
}

export { initThreeLayer }
