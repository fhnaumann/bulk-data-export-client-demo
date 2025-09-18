<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import FHIR from 'fhirclient'
import { onMounted, ref } from 'vue'
import { Popover } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import BulkSystemExport from '@/components/BulkSystemExport.vue'

</script>

<template>
  <TooltipProvider />
  <BulkSystemExport />
</template>
