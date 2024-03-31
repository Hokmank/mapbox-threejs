import TWEEN from '@tweenjs/tween.js'
import { THREE } from 'threebox-plugin'

const addFlyLine = (map) => {
  console.log(map)
  const curveH = 10 // 飞线最大高
  const lineGroup = new THREE.Group()
  lineGroup.name = 'lineGroup'
  const startPoint = [113.318977, 23.11]
  const endPoint = [113.328977, 23.11]
  const xyz_start = tb.utils.lnglatsToWorld([[...startPoint, 0]])
  const xyz_end = tb.utils.lnglatsToWorld([[...endPoint, 0]])

  const pointInLine = [
    new THREE.Vector3(xyz_start[0].x, xyz_start[0].y, 0),
    new THREE.Vector3(
      (xyz_start[0].x + xyz_end[0].x) / 2,
      (xyz_start[0].y + xyz_end[0].y) / 2,
      curveH
    ),
    new THREE.Vector3(xyz_end[0].x, xyz_end[0].y, 0)
  ]

  // 创建轨迹线
  const curve = new THREE.CatmullRomCurve3(pointInLine)
  const points = curve.getSpacedPoints(50)
  const lineGeom = new THREE.BufferGeometry().setFromPoints(points)

  const material = new THREE.LineBasicMaterial({
    color: 0x006666
  })
  const curveObject = new THREE.Line(lineGeom, material)

  // 创建移动的线
  const index = 20 //取点索引位置
  const num = 10 //从曲线上获取点数量
  const points2 = points.slice(index, index + num) //从曲线上获取一段
  const flyLineGeom = new THREE.BufferGeometry()
  flyLineGeom.setFromPoints(points2)

  // 操作颜色
  const colorArr = []
  for (let i = 0; i < points2.length; i++) {
    const color1 = new THREE.Color(0x006666) // 线颜色
    const color2 = new THREE.Color(0xffff00) //飞痕颜色
    // 飞痕渐变色
    const color = color1.lerp(color2, i / 5)
    colorArr.push(color.r, color.g, color.b)
  }
  // 设置几何体顶点颜色数据
  flyLineGeom.attributes.color = new THREE.BufferAttribute(
    new Float32Array(colorArr),
    3
  )
  flyLineGeom.attributes.position.needsUpdate = true

  const material2 = new THREE.LineBasicMaterial({
    vertexColors: THREE.VertexColors //使用顶点本身颜色
  })

  const curveFlyObject = new THREE.Line(flyLineGeom, material2)
  lineGroup.add(curveObject, curveFlyObject)

  // 创建动画
  const tween = new TWEEN.Tween({ index: 1 })
    .to({ index: 50 }, 2000)
    .onUpdate(function (t) {
      const id = Math.ceil(t.index)
      const pointsList = points.slice(id, id + 10) //从曲线上获取一段
      flyLineGeom && flyLineGeom.setFromPoints(pointsList)
      flyLineGeom.attributes.position.needsUpdate = true
    })
    .repeat(Infinity)
  tween.start()

  map.addLayer({
    id: 'custom_layer',
    type: 'custom',
    onAdd: function (map, mbxContext) {
      this.map = map
      tb.add(lineGroup)
    },
    render: function (gl, matrix) {
      if (this.map) {
        this.map.triggerRepaint()
      }
      tb.update()
      TWEEN.update()
    }
  })
}

export { addFlyLine }
