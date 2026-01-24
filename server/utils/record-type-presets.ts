import { CustomRecordType, RecordField, RecordCategory } from '../models/universal-schema';

// 预置记录分类
export const defaultCategories: Omit<RecordCategory, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '生理健康',
    description: '身体健康相关的记录',
    icon: 'heart',
    color: '#ef4444',
    sortOrder: 1
  },
  {
    name: '心理情感',
    description: '情绪和心理状态记录',
    icon: 'brain',
    color: '#8b5cf6',
    sortOrder: 2
  },
  {
    name: '工作学习',
    description: '工作和学习相关记录',
    icon: 'briefcase',
    color: '#3b82f6',
    sortOrder: 3
  },
  {
    name: '生活品质',
    description: '日常生活质量记录',
    icon: 'home',
    color: '#10b981',
    sortOrder: 4
  },
  {
    name: '个人成长',
    description: '个人发展和成长记录',
    icon: 'trending-up',
    color: '#f59e0b',
    sortOrder: 5
  }
];

// 便便记录类型配置
export const stoolRecordType: Omit<CustomRecordType, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '便便记录',
  desc: '记录排便情况，包括舒适度、便便形状等信息，帮助了解肠道健康状况。通过长期记录可以发现肠道健康趋势，及时发现异常情况。',
  categoryId: 'health',
  icon: 'activity',
  color: '#f97316',
  createdBy: 'system',
  tags: ['健康', '排便', '肠道', '消化'],
  isSystem: true,
  isPublic: true,
  fields: [
    {
      name: 'record_time',
      label: '记录时间',
      type: 'date-time',
      required: true,
      placeholder: '选择记录时间',
      description: '记录排便的具体时间',
      sortOrder: 1
    },
    {
      name: 'comfort_level',
      label: '舒适度',
      type: 'select',
      required: true,
      validation: {
        options: ['uncomfortable', 'normal', 'comfortable']
      },
      description: '排便时的舒适程度',
      sortOrder: 2
    },
    {
      name: 'consistency',
      label: '便便形状',
      type: 'select',
      required: true,
      validation: {
        options: ['hard', 'normal', 'soft', 'liquid']
      },
      description: '便便的形状和硬度',
      sortOrder: 3
    },
    {
      name: 'color',
      label: '颜色',
      type: 'select',
      required: false,
      validation: {
        options: ['brown', 'yellow', 'green', 'black', 'red', 'other']
      },
      description: '便便的颜色（可选）',
      sortOrder: 4
    },
    {
      name: 'amount',
      label: '量',
      type: 'select',
      required: false,
      validation: {
        options: ['little', 'normal', 'much']
      },
      description: '排便的量（可选）',
      sortOrder: 5
    },
    {
      name: 'duration',
      label: '持续时间（分钟）',
      type: 'number',
      required: false,
      validation: {
        min: 1,
        max: 60
      },
      placeholder: '输入持续时间',
      description: '排便持续的时间（可选）',
      sortOrder: 6
    },
    {
      name: 'notes',
      label: '备注',
      type: 'textarea',
      required: false,
      placeholder: '记录其他相关信息，如饮食、药物、身体状况等...',
      description: '其他相关信息和观察',
      sortOrder: 7
    }
  ]
};

// 经期记录类型配置
export const menstrualRecordType: Omit<CustomRecordType, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '经期记录',
  desc: '记录月经周期情况，包括流量、疼痛程度、情绪变化等信息，帮助了解生理健康状况和周期规律。',
  categoryId: 'health',
  icon: 'calendar',
  color: '#ec4899',
  createdBy: 'system',
  tags: ['健康', '经期', '月经', '生理周期'],
  isSystem: true,
  isPublic: true,
  fields: [
    {
      name: 'record_time',
      label: '记录时间',
      type: 'date-time',
      required: true,
      placeholder: '选择记录时间',
      description: '记录的具体时间',
      sortOrder: 1
    },
    {
      name: 'flow_level',
      label: '流量',
      type: 'select',
      required: true,
      validation: {
        options: ['spotting', 'light', 'medium', 'heavy']
      },
      description: '月经流量程度',
      sortOrder: 2
    },
    {
      name: 'pain_level',
      label: '疼痛程度',
      type: 'select',
      required: true,
      validation: {
        options: ['none', 'mild', 'moderate', 'severe']
      },
      description: '经期疼痛的程度',
      sortOrder: 3
    },
    {
      name: 'mood',
      label: '情绪状态',
      type: 'select',
      required: false,
      validation: {
        options: ['happy', 'normal', 'irritable', 'sad', 'anxious', 'tired']
      },
      description: '当前的情绪状态（可选）',
      sortOrder: 4
    },
    {
      name: 'symptoms',
      label: '其他症状',
      type: 'select',
      required: false,
      validation: {
        options: ['headache', 'bloating', 'breast_tenderness', 'back_pain', 'nausea', 'fatigue', 'none']
      },
      description: '伴随的其他症状（可选）',
      sortOrder: 5
    },
    {
      name: 'temperature',
      label: '体温（°C）',
      type: 'number',
      required: false,
      validation: {
        min: 35,
        max: 42
      },
      placeholder: '输入体温',
      description: '基础体温记录（可选）',
      sortOrder: 6
    },
    {
      name: 'cycle_day',
      label: '周期第几天',
      type: 'number',
      required: false,
      validation: {
        min: 1,
        max: 50
      },
      placeholder: '输入周期天数',
      description: '本次周期的第几天（可选）',
      sortOrder: 7
    },
    {
      name: 'notes',
      label: '备注',
      type: 'textarea',
      required: false,
      placeholder: '记录其他相关信息，如药物、活动、饮食等...',
      description: '其他相关信息和观察',
      sortOrder: 8
    }
  ]
};

// 睡眠记录类型配置（额外示例）
export const sleepRecordType: Omit<CustomRecordType, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '睡眠记录',
  desc: '记录睡眠质量和时间，包括入睡时间、起床时间、睡眠质量等信息，帮助了解睡眠模式和改善睡眠质量。',
  categoryId: 'health',
  icon: 'moon',
  color: '#6366f1',
  createdBy: 'system',
  tags: ['健康', '睡眠', '休息', '生活规律'],
  isSystem: true,
  isPublic: true,
  fields: [
    {
      name: 'bedtime',
      label: '上床时间',
      type: 'time',
      required: true,
      placeholder: '选择上床时间',
      description: '上床准备睡觉的时间',
      sortOrder: 1
    },
    {
      name: 'fall_asleep_time',
      label: '入睡时间',
      type: 'time',
      required: false,
      placeholder: '选择入睡时间',
      description: '实际入睡的时间（可选）',
      sortOrder: 2
    },
    {
      name: 'wake_up_time',
      label: '起床时间',
      type: 'time',
      required: true,
      placeholder: '选择起床时间',
      description: '起床的时间',
      sortOrder: 3
    },
    {
      name: 'sleep_quality',
      label: '睡眠质量',
      type: 'select',
      required: true,
      validation: {
        options: ['very_poor', 'poor', 'fair', 'good', 'excellent']
      },
      description: '主观感受的睡眠质量',
      sortOrder: 4
    },
    {
      name: 'dream_recall',
      label: '梦境回忆',
      type: 'select',
      required: false,
      validation: {
        options: ['none', 'vague', 'clear', 'vivid']
      },
      description: '对梦境的回忆程度（可选）',
      sortOrder: 5
    },
    {
      name: 'wake_up_feeling',
      label: '起床感受',
      type: 'select',
      required: false,
      validation: {
        options: ['tired', 'groggy', 'normal', 'refreshed', 'energetic']
      },
      description: '起床时的感受（可选）',
      sortOrder: 6
    },
    {
      name: 'notes',
      label: '备注',
      type: 'textarea',
      required: false,
      placeholder: '记录影响睡眠的因素，如咖啡、运动、压力等...',
      description: '其他相关信息和观察',
      sortOrder: 7
    }
  ]
};

// 情绪记录类型配置（额外示例）
export const moodRecordType: Omit<CustomRecordType, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '情绪记录',
  desc: '记录每日情绪状态和变化，包括情绪类型、强度、触发事件等，帮助了解情绪模式和心理健康状况。',
  categoryId: 'mental',
  icon: 'smile',
  color: '#8b5cf6',
  createdBy: 'system',
  tags: ['心理', '情绪', '心情', '心理健康'],
  isSystem: true,
  isPublic: true,
  fields: [
    {
      name: 'record_time',
      label: '记录时间',
      type: 'date-time',
      required: true,
      placeholder: '选择记录时间',
      description: '记录情绪的时间',
      sortOrder: 1
    },
    {
      name: 'primary_emotion',
      label: '主要情绪',
      type: 'select',
      required: true,
      validation: {
        options: ['happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'frustrated', 'content', 'worried', 'grateful']
      },
      description: '当前的主要情绪',
      sortOrder: 2
    },
    {
      name: 'intensity',
      label: '情绪强度',
      type: 'number',
      required: true,
      validation: {
        min: 1,
        max: 10
      },
      placeholder: '1-10分',
      description: '情绪的强烈程度（1-10分）',
      sortOrder: 3
    },
    {
      name: 'trigger_event',
      label: '触发事件',
      type: 'text',
      required: false,
      placeholder: '描述触发这种情绪的事件',
      description: '引起这种情绪的具体事件（可选）',
      sortOrder: 4
    },
    {
      name: 'energy_level',
      label: '能量水平',
      type: 'select',
      required: false,
      validation: {
        options: ['very_low', 'low', 'normal', 'high', 'very_high']
      },
      description: '当前的能量水平（可选）',
      sortOrder: 5
    },
    {
      name: 'coping_strategy',
      label: '应对方式',
      type: 'text',
      required: false,
      placeholder: '描述你如何处理这种情绪',
      description: '处理这种情绪的方式（可选）',
      sortOrder: 6
    },
    {
      name: 'notes',
      label: '备注',
      type: 'textarea',
      required: false,
      placeholder: '记录其他相关信息，如环境、人际关系、身体状况等...',
      description: '其他相关信息和观察',
      sortOrder: 7
    }
  ]
};

// 所有预置记录类型
export const presetRecordTypes = [
  stoolRecordType,
  menstrualRecordType,
  sleepRecordType,
  moodRecordType
];

// 字段选项的中文映射
export const fieldOptionLabels: Record<string, Record<string, string>> = {
  comfort_level: {
    uncomfortable: '不舒服',
    normal: '正常',
    comfortable: '舒适'
  },
  consistency: {
    hard: '硬',
    normal: '正常',
    soft: '软',
    liquid: '液体'
  },
  color: {
    brown: '棕色',
    yellow: '黄色',
    green: '绿色',
    black: '黑色',
    red: '红色',
    other: '其他'
  },
  amount: {
    little: '少',
    normal: '正常',
    much: '多'
  },
  flow_level: {
    spotting: '点滴',
    light: '少量',
    medium: '中等',
    heavy: '大量'
  },
  pain_level: {
    none: '无',
    mild: '轻微',
    moderate: '中等',
    severe: '严重'
  },
  mood: {
    happy: '开心',
    normal: '正常',
    irritable: '易怒',
    sad: '悲伤',
    anxious: '焦虑',
    tired: '疲惫'
  },
  symptoms: {
    headache: '头痛',
    bloating: '腹胀',
    breast_tenderness: '乳房胀痛',
    back_pain: '腰痛',
    nausea: '恶心',
    fatigue: '疲劳',
    none: '无'
  },
  sleep_quality: {
    very_poor: '很差',
    poor: '差',
    fair: '一般',
    good: '好',
    excellent: '很好'
  },
  dream_recall: {
    none: '无',
    vague: '模糊',
    clear: '清晰',
    vivid: '生动'
  },
  wake_up_feeling: {
    tired: '疲惫',
    groggy: '昏沉',
    normal: '正常',
    refreshed: '清爽',
    energetic: '精力充沛'
  },
  primary_emotion: {
    happy: '开心',
    sad: '悲伤',
    angry: '愤怒',
    anxious: '焦虑',
    excited: '兴奋',
    calm: '平静',
    frustrated: '沮丧',
    content: '满足',
    worried: '担心',
    grateful: '感激'
  },
  energy_level: {
    very_low: '很低',
    low: '低',
    normal: '正常',
    high: '高',
    very_high: '很高'
  }
};