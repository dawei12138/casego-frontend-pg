<template>
  <div>
    <svg-icon icon-class="question" @click="goto" />
  </div>
</template>

<script setup>
const url = ref('http://8.130.23.175:88/');

function goto() {
  window.open(url.value)
}
</script>