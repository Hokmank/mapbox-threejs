<script setup lang="ts">
import { get, set } from '@vueuse/core'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Threebox, THREE } from 'threebox-plugin'
import TWEEN from '@tweenjs/tween.js'

import { onMounted, ref } from 'vue'
const mapboxRef = ref()

const initMap = () => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2hlcndpbjQzNTk5OTMyOSIsImEiOiJjbHVjMDd0ZWcxMGJqMm1sZDQ2dG12azF2In0.tMyPNP1gWrinhdTYp-muWQ'
  // let mapStyle = require('../../../static/style.json') // sytle.json看上一篇文章，或者使用官方的网址也可以：let mapStyle = "mapbox://styles/mapbox/streets-v11"
  const map = new mapboxgl.Map({
    container: mapboxRef.value,
    style: 'mapbox://styles/mapbox/light-v11',
    center: { lng: 113.318977, lat: 23.11 },
    zoom: 14,
    pitch: 64.9,
    bearing: 0,
    antialias: true
  })

  const tb = new Threebox(map, map.getCanvas().getContext('webgl'), {
    defaultLights: true
  })

  window.tb = tb

  map.on('style.load', () => {
    addBuilding(map)
    addLine(map)
  })
}

// 添加建筑物
const addBuilding = (map) => {
  map.addLayer({
    id: 'custom-threebox-model',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function () {
      // Creative Commons License attribution:  Metlife Building model by https://sketchfab.com/NanoRay
      // https://sketchfab.com/3d-models/metlife-building-32d3a4a1810a4d64abb9547bb661f7f3
      const scale = 3.2
      const options = {
        obj: 'https://docs.mapbox.com/mapbox-gl-js/assets/metlife-building.gltf',
        type: 'gltf',
        scale: { x: scale, y: scale, z: 2.7 },
        units: 'meters',
        rotation: { x: 90, y: -90, z: 0 }
      }

      tb.loadObj(options, (model) => {
        model.setCoords([113.318977, 23.108])
        model.setRotation({ x: 0, y: 0, z: 90 })
        // 添加建组
        tb.add(model)
      })
    },
    render: function () {
      tb.update()
    }
  })
}

// 添加飞线
const addLine = (map) => {
  console.log(map)
  const curveH = 10 // 飞线最大高
  const lineGroup = new THREE.Group()
  lineGroup.name = 'lineGroup'
  let startPoint = [113.318977, 23.11]
  let endPoint = [113.328977, 23.11]
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
    let color = color1.lerp(color2, i / 5)
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
  let tween = new TWEEN.Tween({ index: 1 })
    .to({ index: 50 }, 2000)
    .onUpdate(function (t) {
      let id = Math.ceil(t.index)
      let pointsList = points.slice(id, id + 10) //从曲线上获取一段
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

  // return lineGroup
}

onMounted(() => {
  initMap()
})
</script>

<template>
  <div>
    <div
      class="mapbox"
      id="mapbox"
      ref="mapboxRef"
      style="height: 100vh; width: 100vw"
    ></div>
  </div>
</template>
