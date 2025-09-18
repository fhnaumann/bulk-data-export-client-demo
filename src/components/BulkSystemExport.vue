<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import FHIR from 'fhirclient'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { DateFormatter, type DateValue, getLocalTimeZone, today } from '@internationalized/date'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils.ts'
import { CalendarIcon } from "lucide-vue-next"
import { Calendar, CalendarPrevButton } from '@/components/ui/calendar'
import FHIRInstantSelector from '@/components/FHIRInstantSelector.vue'
import PerformBulkExport from '@/components/PerformBulkExport.vue'


const df = new DateFormatter("en-US", {
  dateStyle: "long",
})

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
  return selected
})
const _elements = ref("")
const _since = ref<DateValue>()
const _until = ref<DateValue>()
const lenient = ref(false)

onMounted(async () => {
  const client = FHIR.client("https://r4.smarthealthit.org");
  const capabilityStatement = await client.request('metadata')
  supportedResources.value = Object.fromEntries(
    capabilityStatement.rest[0].resource.map((resource: any) => [resource.type, true])
  )
  console.log('Supported resource types:', supportedResources)
})
</script>
<template>
  <div class="grid grid-cols-1 gap-6 mx-4">
    <Card>
      <CardHeader>
        <CardTitle>Resources to Export</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton v-if="!supportedResources || Object.keys(supportedResources).length === 0" class="w-[100px] h-5 rounded-full" />
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 h-96 overflow-y-auto">
          <div v-for="(selected, resourceType) in supportedResources" :key="resourceType" class="flex items-center gap-x-2">
            <Checkbox :id="resourceType" v-model="supportedResources[resourceType]" />
            <label :for="resourceType"
                   class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {{ resourceType }}
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Bulk Export Parameters</CardTitle>
      </CardHeader>
      <CardContent class="grid grid-rows-1 gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        <div>
          <Label for="_elements">FHIR Elements</Label>
          <Input id="_elements" type="text" placeholder="FHIR Elements..." class="pl-10" v-model="_elements"/>
          <p class="text-sm text-muted-foreground mt-1">
            Enter FHIR element paths separated by commas (e.g., Patient.name, Patient.birthDate, identifier)
          </p>
        </div>
        <div class="flex flex-col">
          <Label for="_since">Since</Label>
          <FHIRInstantSelector type="since" id="_since" class="pl-10" v-model="_since"/>
          <p class="text-sm text-muted-foreground mt-1">
            Resources will be included in the response if their state has changed after the supplied time (e.g., if Resource.meta.lastUpdated is later than the supplied _since time)
          </p>
        </div>
        <div class="flex flex-col">
          <Label for="_until">Until</Label>
          <FHIRInstantSelector type="until" id="_until" class="pl-10" v-model="_until"/>
          <p class="text-sm text-muted-foreground mt-1">
            Resources will be included in the response if their state has changed before the supplied time (e.g., if Resource.meta.lastUpdated is earlier than the supplied _until time)
          </p>
        </div>
        <div >
          <div class="flex space-x-2 items-center">
            <Checkbox id="lenient" v-model="lenient"/>
            <Label for="lenient">Lenient</Label>
          </div>
          <p class="text-sm text-muted-foreground mt-1">
            Send request with lenient handling
          </p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Perform Bulk Export</CardTitle>
      </CardHeader>
      <CardContent>
        <PerformBulkExport base-url="http://localhost:8080" :_type="supportedResourceListForExport" :_elements="_elements" :_since="_since" :_until="_until" :lenient="lenient" />
      </CardContent>
    </Card>
  </div>
</template>
