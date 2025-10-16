import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'
import BulkSystemExport from '@/components/BulkSystemExport.vue'
import InitializerComp from '@/components/InitializerComp.vue'
import Test from '@/views/Test.vue'

const routes = [
  { path: '/', component: BulkSystemExport }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
