<script setup lang="ts">

import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from 'reka-ui'
import MagnetLines from '@/components/bits/MagnetLines.vue'
import HyperSpeed from '@/components/bits/HyperSpeed.vue'
import { hyperspeedPresets } from '@/HyperspeedPresets.ts'
import { useRouter } from 'vue-router'

const serverUrl = ref('http://localhost:8080')

const customOptions = ref(hyperspeedPresets.six)

const router = useRouter()

const launchClient = (serverUrl: string) => {
  console.log(serverUrl)
  const routeData = router.resolve({name: 'client'})
  //router.push({name: 'client'})
  window.open(`${routeData.href}?serverUrl=${serverUrl}`, '_blank')

}

fetch('https://auth.ontoserver.csiro.au/auth/realms/aehrc/protocol/openid-connect/token', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:5173',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type'
  }
}).then(r => {
  console.log('CORS preflight status:', r.status)
  console.log(r.headers)
  console.log('Allow-Origin:', r.headers.get('Access-Control-Allow-Origin'))
  console.log('Allow-Methods:', r.headers.get('Access-Control-Allow-Methods'))
})

</script>

<template>
  <!--div class="hyperspeed-container">
    <HyperSpeed :effect-options="customOptions" />
  </div-->
  <div class="relative min-h-screen">
    <!--div class="absolute inset-0 flex items-center justify-center hyperspeed-container">
      <HyperSpeed :effect-options="customOptions" />
    </div-->
    <div class="relative z-10 flex items-center justify-center min-h-screen mx-4 drop-shadow-xl">
      <Card class="w-[600px] h-auto p-8">
        <CardHeader>Pathling FHIR Server Demo Client</CardHeader>
        <CardContent>
          <div class="flex flex-col space-y-4">
            <div>
              <Label for="serverUrl">FHIR Server Url</Label>
              <Input id="serverUrl" v-model="serverUrl" placeholder="FHIR Server URL" />
            </div>
            <div class="flex items-center justify-center mt-4">
              <Button class="hover:cursor-pointer" @click="launchClient(serverUrl)">Launch Client</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>

</template>

<style scoped>
.hyperspeed-container {
  width: 100%;
  height: 100%;
  cursor: pointer;
}
</style>
