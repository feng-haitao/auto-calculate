import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

  const routes = [
  {
    path: '/',
    name: 'Salary',
    component: () => import('../views/Salary.vue')
  },
  {
    path: '/PayableTax',
    name: 'PayableTax',
    component: () => import('../views/PayableTax.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
