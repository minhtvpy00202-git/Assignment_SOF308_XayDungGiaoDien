<template>
  <!-- ❄ Snow: behind content -->
  <div v-if="isChristmasEnabled" class="snow-layer">
    <span
      v-for="n in 100"
      :key="n"
      class="snow"
      :style="snowStyle()"
    >
      ❄
    </span>
  </div>

  <!-- 🎄 Christmas Lights -->
<div v-if="isChristmasEnabled" class="christmas-lights">
  <span v-for="n in 12" :key="n" class="light">
    <span class="wire"></span>
    <span class="bulb">
      {{ n % 3 === 0 ? '⭐' : n % 2 === 0 ? '🌙' : '✨' }}
    </span>
  </span>
</div>


  <!-- 🎅 Santa: above navbar -->
  <div v-if="isChristmasEnabled" class="santa-layer">
    <div class="santa">🎅🛷</div>
  </div>

  <!-- Toggle -->
  <button
    class="christmas-toggle"
    @click="toggle"
    :title="isChristmasEnabled ? 'Tắt Giáng sinh' : 'Bật Giáng sinh'"
  >
    🎄
  </button>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useChristmasTheme } from '../composables/useChristmasTheme'

const { isChristmasEnabled, toggle, load } = useChristmasTheme()

onMounted(load)

const snowStyle = () => ({
  left: Math.random() * 100 + 'vw',
  animationDuration: 8 + Math.random() * 8 + 's',
  animationDelay: Math.random() * 8 + 's',
  fontSize: 10 + Math.random() * 14 + 'px',
  opacity: 0.3 + Math.random() * 0.7
})
</script>

<style scoped>
/* ===================== */
/* ❄ SNOW (behind app)  */
/* ===================== */
.snow-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.snow {
  position: absolute;
  top: -10px;
  animation: snow-fall linear infinite;
  user-select: none;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
}

@keyframes snow-fall {
  to {
    transform: translateY(110vh) rotate(360deg);
  }
}

/* ===================== */
/* 🎅 SANTA (TRÊN NAVBAR) */
/* ===================== */
.santa-layer {
  position: fixed;
  top: 82.8px; /* chiều cao navbar */
  left: 0;
  width: 100vw;
  pointer-events: none;
  z-index: 1000;
}

.santa {
  font-size: 2.4rem;
  white-space: nowrap;
  animation: santa-run 8s linear infinite;
}

@keyframes santa-run {
  from {
    transform: translateX(-250px);
  }
  to {
    transform: translateX(calc(100vw + 250px));
  }
}

/* =============================== */
/* ⭐ OVERRIDE REDUCE MOTION CHO NOEL */
/* =============================== */
@media (prefers-reduced-motion: reduce) {
  .snow {
    animation-duration: 8s !important;
    animation-iteration-count: infinite !important;
  }

  .santa {
    animation-duration: 8s !important;
    animation-iteration-count: infinite !important;
  }
}


/* =============================== */
/* 🎄 CHRISTMAS LIGHTS (TREO DƯỚI NAVBAR) */
/* =============================== */
.christmas-lights {
  position: fixed;
  top: 82.8px; /* đúng chiều cao navbar */
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-evenly;
  pointer-events: none;
  z-index: 5;
}

.light {
  position: relative;
  animation: swing 4s ease-in-out infinite;
}

.light:nth-child(even) {
  animation-delay: 1s;
}

/* dây treo */
.wire {
  position: absolute;
  top: -35px;
  left: 50%;
  width: 2px;
  height: 35px;
  background: linear-gradient(#555, #aaa);
  transform: translateX(-50%);
}

/* bóng đèn */
.bulb {
  font-size: 1.6rem;
  filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.8));
  animation: blink 2.5s infinite;
}

.light:nth-child(3n) .bulb {
  animation-delay: 0.8s;
}
.light:nth-child(4n) .bulb {
  animation-delay: 1.5s;
}

/* nháy sáng */
@keyframes blink {
  0%, 100% {
    opacity: 0.4;
    filter: drop-shadow(0 0 2px rgba(255,215,0,0.4));
  }
  50% {
    opacity: 1;
    filter: drop-shadow(0 0 10px rgba(255,215,0,1));
  }
}

/* đung đưa nhẹ */
@keyframes swing {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(2deg); }
  100% { transform: rotate(0deg); }
}

/* =============================== */
/* ♿ RESPECT REDUCE MOTION */
/* =============================== */
@media (prefers-reduced-motion: reduce) {
  .light,
  .bulb {
    animation: none !important;
    opacity: 0.8;
  }
}

/* =============================== */
/* 🎄 CHRISTMAS TOGGLE BUTTON */
/* =============================== */
.christmas-toggle {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c41e3a 0%, #165b33 100%);
  border: 3px solid #d4af37;
  font-size: 32px;
  cursor: pointer;
  z-index: 9999;
  box-shadow: 
    0 8px 25px rgba(196, 30, 58, 0.4),
    0 0 15px rgba(212, 175, 55, 0.6);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 0;
}

.christmas-toggle:hover {
  transform: scale(1.1) rotateY(10deg);
  box-shadow: 
    0 12px 35px rgba(196, 30, 58, 0.5),
    0 0 25px rgba(212, 175, 55, 0.8),
    inset 0 0 15px rgba(255, 255, 255, 0.2);
}

.christmas-toggle:active {
  transform: scale(0.95);
  box-shadow: 
    0 4px 15px rgba(196, 30, 58, 0.3),
    0 0 10px rgba(212, 175, 55, 0.4);
}

@media (prefers-reduced-motion: no-preference) {
  .christmas-toggle {
    animation: toggle-pulse 2s ease-in-out infinite;
  }
}

@keyframes toggle-pulse {
  0%, 100% {
    box-shadow: 
      0 8px 25px rgba(196, 30, 58, 0.4),
      0 0 15px rgba(212, 175, 55, 0.6);
  }
  50% {
    box-shadow: 
      0 8px 25px rgba(196, 30, 58, 0.6),
      0 0 25px rgba(212, 175, 55, 0.9);
  }
}

@media (max-width: 576px) {
  .christmas-toggle {
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    font-size: 26px;
  }
}

</style>

