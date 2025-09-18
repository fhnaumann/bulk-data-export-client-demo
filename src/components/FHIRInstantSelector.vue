<script setup lang="ts">
import { type CalendarRootEmits, type CalendarRootProps, useDateFormatter, useForwardPropsEmits } from 'reka-ui'
import { computed, type HTMLAttributes, ref, type Ref, watch } from 'vue'
import { type DateDuration, DateFormatter, DateValue, getLocalTimeZone, today } from '@internationalized/date'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils.ts'
import { createDecade, createYear, toDate } from 'reka-ui/date'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading } from "@/components/ui/calendar"
import { CalendarRoot } from 'reka-ui'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from "lucide-vue-next"

const props = withDefaults(defineProps<CalendarRootProps &
  {
    class?: HTMLAttributes["class"],
    type: 'since' | 'until'
}>(), {
  modelValue: undefined,
  placeholder() {
    return today(getLocalTimeZone())
  },
  weekdayFormat: "short",
})
const emits = defineEmits<CalendarRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, placeholder: __, ...delegated } = props

  return delegated
})

const placeholder = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: undefined,
}) as Ref<DateValue | undefined>

const dateForCalculations = computed(() => {
  return placeholder.value ?? today(getLocalTimeZone())
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const formatter = useDateFormatter("en")
const df = new DateFormatter("en-US", {dateStyle: 'long'})

const start = props.type === 'since' ? 'Within' : 'Before'
const items = [
  { value: "0-0-0", label: "Today" },
  { value: "0-1-0", label: `${start} last month` },
  { value: "0-6-0", label: `${start} last 6 months` },
  { value: "0-0-1", label: `${start} last year` },
  { value: "0-0-3", label: `${start} last 3 years` },
  { value: "0-0-10", label: `${start} last 10 years` },
]

const parseDuration = (value: string): DateDuration => {
  const [days, months, years] = value.split('-').map(Number)
  return { days, months, years }
}

// const selectedDate = ref()
//
// watch(selectedDate, (newValue) => {
//   if (newValue) {
//     placeholder.value = newValue
//   }
// }, { immediate: true })

const selectedMonth = computed({
  get: () => dateForCalculations.value.month.toString(),
  set: (value) => {
    if (!value || !placeholder.value) return;
    if (Number(value) === placeholder.value.month) return;
    placeholder.value = placeholder.value.set({
      month: Number(value),
    })
  }
})

const selectedYear = computed({
  get: () => dateForCalculations.value.year.toString(),
  set: (value) => {
    if (!value || !placeholder.value) return;
    if (Number(value) === placeholder.value.year) return;
    placeholder.value = placeholder.value.set({
      year: Number(value),
    })
  }
})
const todayDate = today(getLocalTimeZone())
const dateDisabled = (date: DateValue) => date > todayDate

const yearOptions = computed(() => {
  return createDecade({ dateObj: dateForCalculations.value, startIndex: -10, endIndex: 10 })
})

// Memoize month creation
const monthOptions = computed(() => {
  return createYear({ dateObj: dateForCalculations.value })
})

</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="cn(
          'w-[280px] justify-start text-left font-normal',
          !placeholder && 'text-muted-foreground',
        )"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{ placeholder ? df.format(placeholder.toDate(getLocalTimeZone())) : "Pick a date" }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0 flex flex-col items-center justify-center">
      <Select
        class="w-full w-min-3/4"
        @update:model-value="(v) => {
          if (!v) return;
          console.log(v)
          placeholder = today(getLocalTimeZone()).subtract(parseDuration(v as string));
        }"
      >
        <SelectTrigger class="w-full mx-4">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="item in items" :key="item.label" :value="item.value">
            {{ item.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <CalendarRoot
        :key="`${dateForCalculations.year}-${dateForCalculations.month}`"
        v-slot="{ date, grid, weekDays }"
        v-model="placeholder"
        v-bind="forwarded"
        :weekStartsOn=1
        :isDateDisabled="dateDisabled"
        :class="cn('rounded-md border p-3', props.class)"
      >
        <CalendarHeader>
          <CalendarHeading class="flex w-full items-center justify-between gap-2">
            <Select v-model="selectedMonth">
              <SelectTrigger aria-label="Select month" class="w-[60%]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent class="max-h-[200px]">
                <SelectItem
                  v-for="month in monthOptions"
                  :key="month.toString()" :value="month.month.toString()" :disabled="dateDisabled(month)"
                >
                  {{ formatter.custom(toDate(month), { month: 'long' }) }}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select v-model="selectedYear">
              <SelectTrigger aria-label="Select year" class="w-[40%]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent class="max-h-[200px]">
                <SelectItem
                  v-for="yearValue in yearOptions"
                  :key="yearValue.toString()" :value="yearValue.year.toString()"  :disabled="dateDisabled(yearValue)"
                >
                  {{ yearValue.year }}
                </SelectItem>
              </SelectContent>
            </Select>
          </CalendarHeading>
        </CalendarHeader>

        <div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
          <CalendarGrid v-for="month in grid" :key="month.value.toString()">
            <CalendarGridHead>
              <CalendarGridRow>
                <CalendarHeadCell
                  v-for="day in weekDays" :key="day"
                >
                  {{ day.substring(0, 1) }}
                </CalendarHeadCell>
              </CalendarGridRow>
            </CalendarGridHead>
            <CalendarGridBody class="grid">
              <CalendarGridRow v-for="(weekDates, index) in month.rows" :key="`weekDate-${index}`" class="mt-2 w-full">
                <CalendarCell
                  v-for="weekDate in weekDates"
                  :key="weekDate.toString()"
                  :date="weekDate"
                >
                  <CalendarCellTrigger
                    :day="weekDate"
                    :month="month.value"
                  />
                </CalendarCell>
              </CalendarGridRow>
            </CalendarGridBody>
          </CalendarGrid>
        </div>
      </CalendarRoot>
    </PopoverContent>
  </Popover>
</template>
