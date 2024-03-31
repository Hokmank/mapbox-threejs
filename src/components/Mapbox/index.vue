<script setup lang="ts">
import { get, set } from '@vueuse/core'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Threebox } from 'threebox-plugin'

import { addBuilding } from './building'
import { initThreeLayer } from './flyLine'
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
    // 添加建筑物
    addBuilding(map)

    // 添加飞线
    initThreeLayer(map)
  })
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
