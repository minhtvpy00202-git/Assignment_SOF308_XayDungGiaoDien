<template>
  <canvas ref="canvas" class="winter-canvas"></canvas>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animationId: number

const snowflakes: any[] = []
const trees: any[] = []

const resize = () => {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
}

const createSnow = () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  r: Math.random() * 2 + 1,
  speed: Math.random() * 0.6 + 0.3
})

// Generate trees at random positions
const generateTrees = () => {
  trees.length = 0
  if (!canvas.value) return

  const treeCount = Math.floor(canvas.value.width / 40) // Reduced from 80 to 40 = 2x more trees
  for (let i = 0; i < treeCount; i++) {
    trees.push({
      x: Math.random() * canvas.value.width,
      y: canvas.value.height - 150 + Math.random() * 100,
      size: Math.random() * 1.5 + 0.6, // Random size between 0.6 and 2.1
      opacity: 0.3 + Math.random() * 0.5 // Random opacity for depth effect
    })
  }
}

// Draw a single tree (more realistic with layered triangles)
const drawTree = (x: number, y: number, size: number, opacity: number) => {
  if (!ctx) return

  ctx.fillStyle = `rgba(27, 94, 32, ${opacity})`
  ctx.strokeStyle = `rgba(27, 94, 32, ${opacity * 0.8})`
  ctx.lineWidth = 1

  // Draw trunk
  ctx.fillRect(x - size * 2, y + size * 8, size * 4, size * 5)

  // Draw multiple layered triangles for more realistic tree shape
  const layers = 4
  for (let layer = 0; layer < layers; layer++) {
    const layerY = y - layer * size * 4
    const layerWidth = size * 10 - layer * size * 2.5
    const layerHeight = size * 6

    ctx.beginPath()
    ctx.moveTo(x, layerY - layerHeight) // top point
    ctx.lineTo(x - layerWidth / 2, layerY) // bottom left
    ctx.lineTo(x + layerWidth / 2, layerY) // bottom right
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  // Add some snow on top
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.4})`
  ctx.beginPath()
  ctx.arc(x, y - size * 11, size * 2.5, 0, Math.PI * 2)
  ctx.fill()

  // Add decorations: star on top and ornaments
  // Star
  const starX = x
  const starY = y - size * 12.5
  const starRadius = size * 2
  ctx.fillStyle = `rgba(255, 223, 0, ${opacity})`
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
    const outerX = starX + Math.cos(angle) * starRadius
    const outerY = starY + Math.sin(angle) * starRadius
    const innerAngle = angle + Math.PI / 5
    const innerX = starX + Math.cos(innerAngle) * (starRadius * 0.5)
    const innerY = starY + Math.sin(innerAngle) * (starRadius * 0.5)
    if (i === 0) ctx.moveTo(outerX, outerY)
    else ctx.lineTo(outerX, outerY)
    ctx.lineTo(innerX, innerY)
  }
  ctx.closePath()
  ctx.fill()

  // Ornaments: random small circles on each layer
  const ornamentColors = ['#e53935', '#fdd835', '#8e24aa', '#1e88e5']
  for (let layer = 0; layer < 4; layer++) {
    const layerY = y - layer * size * 4
    const layerWidth = size * 10 - layer * size * 2.5
    // place 3 ornaments per layer
    for (let k = 0; k < 3; k++) {
      const ox = x - layerWidth / 2 + (k + 0.5) * (layerWidth / 3)
      const color = ornamentColors[(layer + k) % ornamentColors.length] || '#ff0000'
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(ox, layerY - size * 1.5, size * 0.9, 0, Math.PI * 2)
      ctx.fill()
      // small highlight
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.beginPath()
      ctx.arc(ox - size * 0.3, layerY - size * 1.8, size * 0.25, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

const drawTrees = () => {
  if (!ctx || !canvas.value) return

  trees.forEach(tree => {
    drawTree(tree.x, tree.y, tree.size, tree.opacity)
  })
}

const drawSnowman = () => {
  if (!ctx || !canvas.value) return
  const h = canvas.value.height

  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(120, h - 90, 20, 0, Math.PI * 2)
  ctx.arc(120, h - 120, 14, 0, Math.PI * 2)
  ctx.arc(120, h - 145, 10, 0, Math.PI * 2)
  ctx.fill()
}

// Draw snowman with specific position and size
const drawSnowmanAtPosition = (x: number, y: number, size: number, opacity: number) => {
  if (!ctx) return

  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`

  // Body (large circle)
  ctx.beginPath()
  ctx.arc(x, y, size * 8, 0, Math.PI * 2)
  ctx.fill()

  // Mid section
  ctx.beginPath()
  ctx.arc(x, y - size * 16, size * 5.5, 0, Math.PI * 2)
  ctx.fill()

  // Head
  ctx.beginPath()
  ctx.arc(x, y - size * 26, size * 3.5, 0, Math.PI * 2)
  ctx.fill()

  // Eyes
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`
  ctx.beginPath()
  ctx.arc(x - size * 1.2, y - size * 27.5, size * 0.8, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x + size * 1.2, y - size * 27.5, size * 0.8, 0, Math.PI * 2)
  ctx.fill()

  // Coal buttons
  ctx.beginPath()
  ctx.arc(x, y - size * 15, size * 0.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x, y - size * 11, size * 0.6, 0, Math.PI * 2)
  ctx.fill()

  // Carrot nose
  ctx.fillStyle = `rgba(255, 140, 0, ${opacity})`
  ctx.beginPath()
  ctx.moveTo(x + size * 2, y - size * 26)
  ctx.lineTo(x + size * 4, y - size * 25)
  ctx.lineTo(x + size * 2, y - size * 27)
  ctx.closePath()
  ctx.fill()
}

const animate = () => {
  if (!canvas.value || !ctx) return

  const context = ctx   

  context.clearRect(0, 0, canvas.value.width, canvas.value.height)

  // background: blue gradient (match app login background)
  const g = context.createLinearGradient(0, 0, 0, canvas.value.height)
  g.addColorStop(0, '#1877F2')
  g.addColorStop(1, '#5fb0ff')
  context.fillStyle = g
  context.fillRect(0, 0, canvas.value.width, canvas.value.height)

  drawTrees()
  drawSnowman()
  
  // Draw decorative trees and snowman on right side (under Friend Suggestions area)
  // Assume Friend Suggestions is on the right side around 75% of width, starting around 100px from top
  const rightAreaX = canvas.value.width * 0.85
  const rightAreaY = canvas.value.height * 0.5
  
  // Tree 1
  drawTree(rightAreaX - 80, rightAreaY + 150, 1.2, 0.8)
  
  // Tree 2
  drawTree(rightAreaX + 40, rightAreaY + 120, 1, 0.75)
  
  // Tree 3
  drawTree(rightAreaX, rightAreaY + 180, 0.9, 0.7)
  
  // Snowman
  drawSnowmanAtPosition(rightAreaX - 40, rightAreaY + 280, 1, 0.85)

  // snow
  context.fillStyle = '#fff'
  snowflakes.forEach(s => {
    context.beginPath()
    context.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    context.fill()
    s.y += s.speed
    if (s.y > canvas.value!.height) s.y = -5
  })

  animationId = requestAnimationFrame(animate)
}




onMounted(() => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  resize()

  generateTrees()

  for (let i = 0; i < 120; i++) snowflakes.push(createSnow())

  window.addEventListener('resize', resize)
  animate()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resize)
})
</script>

<style scoped>
.winter-canvas {
  position: fixed;
  inset: 0;
  z-index: -2;
}
</style>
