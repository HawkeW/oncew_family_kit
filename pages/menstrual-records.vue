<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">经期记录</h1>

    <!-- 添加记录表单 -->
    <div class="bg-white p-4 rounded-lg shadow mb-6">
      <h2 class="text-xl font-semibold mb-4">添加新记录</h2>
      <form @submit.prevent="addRecord" class="space-y-4">
        <FormField name="record_date">
          <FormItem class="space-y-2">
            <Label>日期</Label>
            <Popover>
              <PopoverTrigger as-child>
                <FormControl>
                  <Button variant="outline" :class="cn(
        'w-[240px] ps-3 text-start font-normal',
        !recordDate && 'text-muted-foreground',
      )">
                    <span>{{ recordDate ? df.format(toDate(recordDate)) : "Pick a date" }}</span>
                    <CalendarIcon class="ms-auto h-4 w-4 opacity-50" />
                  </Button>
                  <input hidden>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0">
                <Calendar v-model:placeholder="recordDatePlaceholder" v-model="recordDate" calendar-label="Record Date"
                  initial-focus :min-value="new CalendarDate(1900, 1, 1)" :max-value="today(getLocalTimeZone())"
                  @update:model-value="(v) => {
        if (v) {
          setFieldValue('record_date', v.toString())
        }
        else {
          setFieldValue('record_date', undefined)
        }
      }" />
              </PopoverContent>
            </Popover>
          </FormItem>
        </FormField>
        <FormField name="flow_level">
          <FormItem class="space-y-2">
            <Label>经期量</Label>
            <Select v-model="newRecord.flow_level">
              <SelectTrigger>
                <SelectValue placeholder="选择经期量" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="light">轻</SelectItem>
                  <SelectItem value="medium">中等</SelectItem>
                  <SelectItem value="heavy">重</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormItem>
        </FormField>

        <FormField name="pain_level">
          <FormItem class="space-y-2">
            <Label>疼痛程度</Label>
            <Select v-model="newRecord.pain_level">
              <SelectTrigger>
                <SelectValue placeholder="选择疼痛程度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无痛</SelectItem>
                <SelectItem value="mild">轻微</SelectItem>
                <SelectItem value="moderate">中等</SelectItem>
                <SelectItem value="severe">严重</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        </FormField>
        <FormField name="notes">
          <FormItem class="space-y-2">
            <Label>备注</Label>
            <Textarea v-model="newRecord.notes" placeholder="输入备注信息" rows="3" />
          </FormItem>
        </FormField>


        <FormItem>
          <Button type="submit" class="w-full">
            添加记录
          </Button>
        </FormItem>
      </form>
    </div>

    <!-- 记录列表 -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">历史记录</h2>
      <div class="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>开始日期</TableHead>
              <TableHead>结束日期</TableHead>
              <TableHead>经期量</TableHead>
              <TableHead>疼痛程度</TableHead>
              <TableHead>备注</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="record in records" :key="record.id">
              <TableCell>{{ record.record_date }}</TableCell>
              <TableCell>{{ getFlowLevelText(record.flow_level) }}</TableCell>
              <TableCell>{{ getPainLevelText(record.pain_level) }}</TableCell>
              <TableCell>{{ record.notes || '-' }}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" @click="editRecord(record)">编辑</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- 编辑记录对话框 -->
    <Dialog :open="isEditDialogOpen" @update:open="isEditDialogOpen = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑记录</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div class="space-y-2">
            <Label>记录日期</Label>
            <Input type="date" v-model="editingRecord.record_date" required />
          </div>

          <div class="space-y-2">
            <Label>经期量</Label>
            <Select v-model="editingRecord.flow_level">
              <SelectTrigger>
                <SelectValue placeholder="选择经期量" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">轻</SelectItem>
                <SelectItem value="medium">中等</SelectItem>
                <SelectItem value="heavy">重</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>疼痛程度</Label>
            <Select v-model="editingRecord.pain_level">
              <SelectTrigger>
                <SelectValue placeholder="选择疼痛程度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无痛</SelectItem>
                <SelectItem value="mild">轻微</SelectItem>
                <SelectItem value="moderate">中等</SelectItem>
                <SelectItem value="severe">严重</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>备注</Label>
            <Textarea v-model="editingRecord.notes" placeholder="输入备注信息" rows="3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isEditDialogOpen = false">取消</Button>
          <Button @click="updateRecord">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { MenstrualRecord } from '~/server/models/schema'
import { CalendarIcon } from 'lucide-vue-next'
import { toDate } from 'reka-ui/date'
import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { cn } from '@/lib/utils'

const records = ref<MenstrualRecord[]>([])
const isEditDialogOpen = ref(false)
const editingRecord = ref<Partial<MenstrualRecord>>({})


const df = new DateFormatter('en-US', {
  dateStyle: 'long',
})

const formSchema = toTypedSchema(z.object({
  record_date: z
    .string()
    .refine(v => v, { message: 'A start date is required.' }),
}))
const { handleSubmit, setFieldValue, values } = useForm({
  validationSchema: formSchema,
})
// 设置默认日期
const nowDate = new Date()
const defaultEndDate = new Date(nowDate)
defaultEndDate.setDate(nowDate.getDate() + 7)

const newRecord = ref<Partial<MenstrualRecord>>({
  record_date: nowDate.toISOString().split('T')[0],
  flow_level: 'medium',
  pain_level: 'none',
  notes: ''
})

const recordDate = computed({
  get: () => newRecord.value.record_date ? parseDate(newRecord.value.record_date) : undefined,
  set: val => val,
})

const recordDatePlaceholder = ref(parseDate(nowDate.toISOString().split('T')[0]))

// 获取所有记录
async function fetchRecords() {
  try {
    const response = await fetch('/api/menstrual-records')
    records.value = await response.json()
  } catch (error) {
    console.error('获取记录失败:', error)
  }
}

// 添加新记录
async function addRecord() {
  try {
    const response = await fetch('/api/menstrual-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newRecord.value)
    })

    if (response.ok) {
      // 重置表单
      newRecord.value = {
        record_date: nowDate.toISOString().split('T')[0],
        flow_level: 'medium',
        pain_level: 'none',
        notes: ''
      }
      // 刷新记录列表
      await fetchRecords()
    }
  } catch (error) {
    console.error('添加记录失败:', error)
  }
}

// 编辑记录
function editRecord(record: MenstrualRecord) {
  editingRecord.value = { ...record }
  isEditDialogOpen.value = true
}

// 更新记录
async function updateRecord() {
  if (!editingRecord.value.id) return

  try {
    const response = await fetch(`/api/menstrual-records?id=${editingRecord.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editingRecord.value)
    })

    if (response.ok) {
      isEditDialogOpen.value = false
      await fetchRecords()
    }
  } catch (error) {
    console.error('更新记录失败:', error)
  }
}

// 获取经期量显示文本
function getFlowLevelText(level: string) {
  const map: Record<string, string> = {
    light: '轻',
    medium: '中等',
    heavy: '重'
  }
  return map[level] || level
}

// 获取疼痛程度显示文本
function getPainLevelText(level: string) {
  const map: Record<string, string> = {
    none: '无痛',
    mild: '轻微',
    moderate: '中等',
    severe: '严重'
  }
  return map[level] || level
}

// 组件挂载时获取记录
onMounted(() => {
  fetchRecords()
})
</script>~/components