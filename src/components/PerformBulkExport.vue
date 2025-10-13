<script setup lang="ts">

import { computed, ref } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { type DateValue, getLocalTimeZone } from '@internationalized/date'
import { CopyIcon, CheckIcon } from 'lucide-vue-next'
import { Tooltip } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { useBulkExportClient } from '@/components/bulk-export-client-requests.ts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DownloadIcon } from 'lucide-vue-next'

const showKickOffRequest = ref(true)

const props = defineProps<{
  baseUrl: string
  _type?: string[],
  _elements?: string,
  _since?: DateValue,
  _until?: DateValue,
  lenient: boolean
  disabled?: boolean
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

const { running, pollResult, completeResult, errorResult, executeExport } = useBulkExportClient()

const downloadAll = async () => {
  if (!pollResult.value?.data?.output) return

  const files = pollResult.value.data.output

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    // Create temporary link for each file
    const link = document.createElement('a')
    link.href = file.url
    link.download = `${file.type}.ndjson`
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Small delay between downloads to avoid browser blocking
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
}

const displayStatus = computed(() => {
  switch (pollResult?.value?.status) {
    case 'in-progress': return 'Export in progress...'
    case 'complete': return 'Export is complete'
    case 'error': return 'An error has occurred'
    default: return '';
  }
})

</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Perform Bulk Export</CardTitle>
    </CardHeader>
    <CardContent>
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
            <Button class="hover:cursor-pointer" @click="executeExport(getRequest)" :disabled="disabled || running">Start Export</Button>
          </div>
          <div v-if="showKickOffRequest" class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-sm break-all">
            <p>{{ `GET: ${getRequest}` }}</p>
            <p>{{ `host: ${baseUrl}` }}</p>
            <p>{{ `accept: ${acceptHeaders}` }}</p>
            <p>{{ `prefer: ${preferHeaders}` }}</p>
          </div>
        </div>
        <div class="flex flex-col items-center justify-center">
          <p>{{ displayStatus }}</p>
          <Progress :model-value="pollResult?.progress ?? 0"/>
        </div>
      </div>
    </CardContent>
  </Card>
  <Card v-if="pollResult?.status === 'complete'">
    <CardHeader>
      <CardTitle>Download Bulk Export NDJSON Files</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col items-center justify-center space-y-4">
      <div v-if="pollResult.data?.output.length ?? 0 > 0">
        <Button @click="downloadAll" class="hover:cursor-pointer">
          Download all {{ pollResult.data?.output.length }} NDJSON files
        </Button>
        <Table>
          <TableCaption>NDJSON Files</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Resource Type</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Download</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="file in pollResult?.data?.output" :key="file.url">
              <TableCell>{{ file.type }}</TableCell>
              <TableCell>{{ file.count ?? '-' }}</TableCell>
              <TableCell>
                <Button as-child variant="link">
                  <a :href="file.url" :download="file.url">
                    <DownloadIcon class="w-4 h-4 mr-2" />
                  </a>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div v-else>
        <p>No NDJSON files to download.</p>
      </div>
    </CardContent>
  </Card>
</template>
