<template>
  <div class="space-y-2">
    <!-- 日期选择器 -->
    <FormField name="date">
      <FormItem class="space-y-2">
        <Label>日期</Label>
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              :class="cn(
                'w-full justify-start text-left font-normal',
                !dateValue && 'text-muted-foreground'
              )"
            >
              <CalendarIcon class="mr-2 h-4 w-4" />
              {{ dateValue ? df.format(toDate(dateValue)) : '选择日期' }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <Calendar v-model="dateValue" initial-focus />
          </PopoverContent>
        </Popover>
      </FormItem>
    </FormField>

    <!-- 时间选择器 -->
    <FormField name="time">
      <FormItem class="space-y-2">
        <Label>时间</Label>
        <TimePicker v-model="timeValue" />
      </FormItem>
    </FormField>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarIcon } from 'lucide-vue-next'
import { toDate } from 'reka-ui/date'
import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { cn } from '@/lib/utils'
import { TimePicker } from '@/components/ui/time-picker'

interface Props {
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const df = new DateFormatter('en-US', {
  dateStyle: 'long',
})

// 获取当前时间并格式化为 HH:mm
const getCurrentTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 获取当前日期时间并格式化为 ISO 字符串
const getCurrentDateTime = () => {
  const now = new Date()
  return now.toISOString()
}

// 日期计算属性
const dateValue = computed({
  get: () => props.modelValue ? parseDate(props.modelValue.split('T')[0]) : undefined,
  set: (val) => {
    if (val) {
      // 保持现有的时间部分，只更新日期部分
      const currentTime = props.modelValue ? new Date(props.modelValue) : new Date()
      const newDateTime = new Date(val.toString())
      newDateTime.setHours(currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds(), currentTime.getMilliseconds())
      emit('update:modelValue', newDateTime.toISOString())
    } else {
      emit('update:modelValue', getCurrentDateTime())
    }
  },
})

// 时间计算属性
const timeValue = computed({
  get: () => {
    if (props.modelValue) {
      const date = new Date(props.modelValue)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
    return getCurrentTime()
  },
  set: (val) => {
    if (val && props.modelValue) {
      const [hours, minutes] = val.split(':')
      const currentDate = new Date(props.modelValue)
      currentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      emit('update:modelValue', currentDate.toISOString())
    }
  },
})
</script>