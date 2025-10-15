<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import FHIR from 'fhirclient'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Funnel } from 'lucide-vue-next';
import { DateFormatter, type DateValue, getLocalTimeZone, today } from '@internationalized/date'
import { Label } from 'reka-ui'
import FHIRInstantSelector from '@/components/FHIRInstantSelector.vue'
import PerformBulkExport from '@/components/PerformBulkExport.vue'
import { Separator } from '@/components/ui/separator'
import type Client from 'fhirclient/lib/Client'
import { useFhirClient } from '@/components/fhirClient.ts'

const connError = ref<string>()

type ResourceSelection = Record<string, boolean>

const supportedResources = ref<ResourceSelection>()
const supportedResourceListForExport = computed(() => {
  if(!supportedResources.value) {
    return []
  }
  const selected: string[] = supportedResources.value ?
    Object.keys(supportedResources.value)
      .filter(key => supportedResources.value![key])
    : []
  if(selected.length === Object.keys(supportedResources.value).length) {
    return []
  }
  console.log(selected)
  console.log(selected.filter(value => value !== undefined))
  return selected.filter(value => value !== undefined)
})
const _elements = ref("")
const _since = ref<DateValue>()
const _until = ref<DateValue>()
const lenient = ref(false)

const allSelected = computed(() => {
  if (!supportedResources.value) return false
  const values = Object.values(supportedResources.value)
  return values.length > 0 && values.every(Boolean)
})

const selectAll = computed({
  get: () => allSelected.value,
  set: (value: boolean) => {
    if (supportedResources.value) {
      Object.keys(supportedResources.value).forEach(key => {
        supportedResources.value![key] = value
      })
    }
  }
})

const noneSelected = computed(() => {
  if (!supportedResources.value) return false
  const values = Object.values(supportedResources.value)
  return values.length > 0 && !values.some(Boolean)
})

const selectNone = computed({
  get: () => noneSelected.value,
  set: (value: boolean) => {
    console.log("new", value)
    if (supportedResources.value) {
      Object.keys(supportedResources.value).forEach(key => {
        supportedResources.value![key] = false
      })
    }
  }
})

async function fetchCapabilities() {
  if (!client.value) return

  try {
    console.log('Client state:', client.value.state)
    console.log('Token response:', client.value.state.tokenResponse)

    console.log('Access token:', client.value.state.tokenResponse?.access_token)
    console.log('Token type:', client.value.state.tokenResponse?.token_type)

    // Try fetching metadata
    const capabilityStatement = await client.value.request('metadata')
    console.log('Capability statement:', capabilityStatement)

    supportedResources.value = Object.fromEntries(
      capabilityStatement.rest[0].resource.map((resource: any) => [resource.type, true])
    )
  } catch (error) {
    console.error('Error fetching metadata:', error)
  }
}

const ready = ref(false)
const { client, setClient } = useFhirClient()

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  let serverUrl = params.get('serverUrl')
  console.log("Found:", serverUrl)

  if(serverUrl) {
    sessionStorage.setItem("fhir-server-url", serverUrl)
  }
  else {
    serverUrl = sessionStorage.getItem("fhir-server-url")
  }

  if (!serverUrl) {
    connError.value = 'No server URL provided'
    console.error('No server URL provided')
    // return
  }

  console.log('Initializing OAuth for server:', serverUrl)


  try {
    console.log(window.location.origin)
    console.log(serverUrl)
    const client = await FHIR.oauth2.init({
      iss: `${serverUrl}/fhir`,
      //iss: "http://localhost:8080/fhir",
      clientId: 'bulk-client',
      scope: 'openid profile email user/*.read',
      redirectUri:  `${window.location.origin}/client`
    })

    if (client) {
      console.log('Client authenticated:', client)
      const result = await client.fhirRequest("metadata")
      console.log(result)
      setClient(client)
      ready.value = true

      await fetchCapabilities()
    }
  } catch (err) {
    connError.value = 'Authentication failed: ' + (err as Error).message
    console.error('Authentication failed:', err)
  }
})
</script>
<template>
  <div class="grid grid-cols-1 gap-6 mx-4">
    <Card>
      <CardHeader>
        <CardTitle>Resources to Export</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col">
        <div class="flex space-x-10">
          <div class="flex items-center space-x-2">
            <Checkbox class="h-5 w-5" id="select_all" v-model="selectAll" :disabled="connError != undefined || allSelected"/>
            <Label for="select_all"
                   class="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Select all
            </Label>
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox class="h-5 w-5" id="select_none" v-model="selectNone" :disabled="connError !== undefined || noneSelected" />
            <Label for="select_none"
                   class="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Select none
            </Label>
          </div>
        </div>
        <Separator class="my-4" orientation="horizontal" />
        <div v-if="connError" class="flex flex-col items-center justify-center space-y-4">
          <p class="text-3xl">An error occurred while attempting to connect to the backend:</p>
          <p class="text-2xl text-red-400">{{ connError }}</p>
        </div>
        <div v-else-if="!supportedResources || Object.keys(supportedResources).length === 0"
             class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 h-96 overflow-y-auto">
          <div v-for="n in 50" :key="n" class="flex items-center gap-x-2">
            <Skeleton class="w-4 h-4 rounded" />
            <Skeleton class="w-20 h-4 rounded" />
          </div>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 h-96 overflow-y-auto">
          <div v-for="(selected, resourceType) in supportedResources" :key="resourceType" class="flex items-center gap-x-2">
            <Checkbox :id="resourceType" v-model="supportedResources[resourceType]" />
            <Label :for="resourceType"
                   class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {{ resourceType }}
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Bulk Export Parameters</CardTitle>
      </CardHeader>
      <CardContent class="grid grid-rows-1 gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        <div class="relative w-full max-w-sm items-center">
          <Label for="_elements">FHIR Elements</Label>
          <div class="relative">
            <Input id="_elements" type="text" placeholder="FHIR Elements..." class="pl-10" v-model="_elements" :disabled="connError !== undefined" />
            <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
            <Funnel class="size-6 text-muted-foreground" />
          </span>
          </div>
          <p class="text-sm text-muted-foreground mt-1">
            Enter FHIR element paths separated by commas (e.g., Patient.name, Patient.birthDate, identifier)
          </p>
        </div>
        <div class="flex flex-col">
          <Label for="_since">Since</Label>
          <FHIRInstantSelector type="since" id="_since" class="pl-10" v-model="_since" :disabled="connError !== undefined" />
          <p class="text-sm text-muted-foreground mt-1">
            Resources will be included in the response if their state has changed after the supplied time (e.g., if Resource.meta.lastUpdated is later than the supplied _since time)
          </p>
        </div>
        <div class="flex flex-col">
          <Label for="_until">Until</Label>
          <FHIRInstantSelector type="until" id="_until" class="pl-10" v-model="_until" :disabled="connError !== undefined" />
          <p class="text-sm text-muted-foreground mt-1">
            Resources will be included in the response if their state has changed before the supplied time (e.g., if Resource.meta.lastUpdated is earlier than the supplied _until time)
          </p>
        </div>
        <div >
          <div class="flex space-x-2 items-center">
            <Checkbox id="lenient" v-model="lenient" :disabled="connError !== undefined" />
            <Label for="lenient">Lenient</Label>
          </div>
          <p class="text-sm text-muted-foreground mt-1">
            Send request with lenient handling
          </p>
        </div>
      </CardContent>
    </Card>
    <PerformBulkExport base-url="http://localhost:8080/fhir" :_type="supportedResourceListForExport" :_elements="_elements" :_since="_since" :_until="_until" :lenient="lenient" :disabled="connError !== undefined"/>
  </div>
</template>
