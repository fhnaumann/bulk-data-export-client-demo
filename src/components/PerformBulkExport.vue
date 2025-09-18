<script setup lang="ts">

import { computed, ref } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { type DateValue, getLocalTimeZone } from '@internationalized/date'
import { CopyIcon, CheckIcon } from 'lucide-vue-next'
import { Tooltip } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'

const showKickOffRequest = ref(true)

const props = defineProps<{
  baseUrl: string
  _type?: string[],
  _elements?: string,
  _since?: DateValue,
  _until?: DateValue,
  lenient: boolean
}>()

const getRequest = computed(() => {
  const url = new URL(`${props.baseUrl}/$export`)
  if(props._type && props._type.length > 0) {
    url.searchParams.set("_type", props._type.join(","))
  }
  if(props._elements) {
    url.searchParams.set("_elements", props._elements)
  }
  if(props._since) {
    url.searchParams.set("_since", props._since.toDate(getLocalTimeZone()).toISOString())
  }
  if(props._until) {
    url.searchParams.set("_until", props._until.toDate(getLocalTimeZone()).toISOString())
  }
  return url.toString()
})

const acceptHeaders = ref("application/fhir+json")
const preferHeaders = computed(() => {
  let preferValue = "respond-async"
  if(props.lenient) {
    preferValue += ",handling=lenient"
  }
  return preferValue
})

const copied = ref(false)

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(getRequest.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy: ', err)
  }
}
</script>

<template>
  <div class="flex flex-col space-y-6">
    <div class="flex flex-col space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <Checkbox id="kick-off-req" v-model="showKickOffRequest" />
          <label for="kick-off-req">Show Kick-off Request</label>
          <Button
            v-if="showKickOffRequest"
            @click="copyToClipboard"
            class="hover:cursor-pointer"
          >
            <CheckIcon v-if="copied" class="h-2 w-2 text-green-500" />
            <CopyIcon v-else class="h-2 w-2" />
          </Button>
        </div>
        <Button class="hover:cursor-pointer">Start Export</Button>
      </div>
      <div v-if="showKickOffRequest" class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-sm break-all">
        <p>{{ `GET: ${getRequest}` }}</p>
        <p>{{ `host: ${baseUrl}` }}</p>
        <p>{{ `accept: ${acceptHeaders}` }}</p>
        <p>{{ `prefer: ${preferHeaders}` }}</p>
      </div>
    </div>
    <div>
      <Progress :model-value="42"/>
    </div>
  </div>
</template>
