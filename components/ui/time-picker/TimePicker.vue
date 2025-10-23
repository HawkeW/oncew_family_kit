<template>
  <div class="flex items-center space-x-2">
    <!-- 小时选择 -->
    <Select v-model="selectedHour">
      <SelectTrigger class="w-16">
        <SelectValue :placeholder="hourPlaceholder" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="hour in hours" :key="hour.value" :value="hour.value">
          {{ hour.label }}
        </SelectItem>
      </SelectContent>
    </Select>
    
    <span class="text-muted-foreground">:</span>
    
    <!-- 分钟选择 -->
    <Select v-model="selectedMinute">
      <SelectTrigger class="w-16">
        <SelectValue :placeholder="minutePlaceholder" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="minute in minutes" :key="minute.value" :value="minute.value">
          {{ minute.label }}
        </SelectItem>
      </SelectContent>
    </Select>
    
    <!-- AM/PM 选择器（仅12小时制） -->
    <Select v-if="!is24Hour" v-model="selectedPeriod">
      <SelectTrigger class="w-18">
        <SelectValue placeholder="AM" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="AM">AM</SelectItem>
        <SelectItem value="PM">PM</SelectItem>
      </SelectContent>
    </Select>
    
    <!-- 时间制式切换按钮 -->
    <Button
      type="button"
      variant="outline"
      size="sm"
      @click="toggleTimeFormat"
      class="ml-2"
    >
      {{ is24Hour ? '24H' : '12H' }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  modelValue?: string
  is24HourDefault?: boolean
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  is24HourDefault: true,
  placeholder: '选择时间'
})

const emit = defineEmits<Emits>()

// 时间制式状态
const is24Hour = ref(props.is24HourDefault)
const selectedHour = ref('')
const selectedMinute = ref('')
const selectedPeriod = ref('AM')

// 占位符
const hourPlaceholder = computed(() => is24Hour.value ? '时' : '时')
const minutePlaceholder = computed(() => '分')

// 生成小时选项
const hours = computed(() => {
  const hourOptions = []
  if (is24Hour.value) {
    // 24小时制：00-23
    for (let i = 0; i < 24; i++) {
      const value = i.toString().padStart(2, '0')
      hourOptions.push({ value, label: value })
    }
  } else {
    // 12小时制：1-12
    for (let i = 1; i <= 12; i++) {
      const value = i.toString()
      hourOptions.push({ value, label: value })
    }
  }
  return hourOptions
})

// 生成分钟选项
const minutes = computed(() => {
  const minuteOptions = []
  for (let i = 0; i < 60; i++) {
    const value = i.toString().padStart(2, '0')
    minuteOptions.push({ value, label: value })
  }
  return minuteOptions
})

// 切换时间制式
function toggleTimeFormat() {
  is24Hour.value = !is24Hour.value
  
  // 转换当前选中的小时
  if (selectedHour.value) {
    if (is24Hour.value) {
      // 12小时制转24小时制
      let hour = parseInt(selectedHour.value)
      if (selectedPeriod.value === 'PM' && hour !== 12) {
        hour += 12
      } else if (selectedPeriod.value === 'AM' && hour === 12) {
        hour = 0
      }
      selectedHour.value = hour.toString().padStart(2, '0')
    } else {
      // 24小时制转12小时制
      let hour = parseInt(selectedHour.value)
      if (hour === 0) {
        selectedHour.value = '12'
        selectedPeriod.value = 'AM'
      } else if (hour < 12) {
        selectedHour.value = hour.toString()
        selectedPeriod.value = 'AM'
      } else if (hour === 12) {
        selectedHour.value = '12'
        selectedPeriod.value = 'PM'
      } else {
        selectedHour.value = (hour - 12).toString()
        selectedPeriod.value = 'PM'
      }
    }
  }
  
  updateTimeValue()
}

// 更新时间值
function updateTimeValue() {
  if (!selectedHour.value || !selectedMinute.value) {
    emit('update:modelValue', '')
    return
  }
  
  let hour = selectedHour.value
  
  if (!is24Hour.value) {
    // 12小时制转换为24小时制进行存储
    let hourNum = parseInt(selectedHour.value)
    if (selectedPeriod.value === 'PM' && hourNum !== 12) {
      hourNum += 12
    } else if (selectedPeriod.value === 'AM' && hourNum === 12) {
      hourNum = 0
    }
    hour = hourNum.toString().padStart(2, '0')
  }
  
  const timeString = `${hour}:${selectedMinute.value}`
  emit('update:modelValue', timeString)
}

// 解析传入的时间值
function parseTimeValue(timeValue: string) {
  if (!timeValue) {
    selectedHour.value = ''
    selectedMinute.value = ''
    selectedPeriod.value = 'AM'
    return
  }
  
  const [hourStr, minuteStr] = timeValue.split(':')
  const hour = parseInt(hourStr)
  
  selectedMinute.value = minuteStr
  
  if (is24Hour.value) {
    selectedHour.value = hourStr
  } else {
    // 24小时制转12小时制显示
    if (hour === 0) {
      selectedHour.value = '12'
      selectedPeriod.value = 'AM'
    } else if (hour < 12) {
      selectedHour.value = hour.toString()
      selectedPeriod.value = 'AM'
    } else if (hour === 12) {
      selectedHour.value = '12'
      selectedPeriod.value = 'PM'
    } else {
      selectedHour.value = (hour - 12).toString()
      selectedPeriod.value = 'PM'
    }
  }
}

// 监听选择变化
watch([selectedHour, selectedMinute, selectedPeriod], updateTimeValue)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  parseTimeValue(newValue)
}, { immediate: true })
</script>