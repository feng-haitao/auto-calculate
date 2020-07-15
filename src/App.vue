<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">简单应用</router-link> |
      <router-link to="/PayableTax">复杂场景</router-link>
    </div>
    <router-view/>
  </div>
</template>

<script>
export default {
    name: 'App'
};
</script>

<style lang="scss">
#nav {
  padding-bottom: 15px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
