<script setup lang="ts">
import { computed } from 'vue'
import {
  LockClosedIcon,
  LockOpenIcon,
  BoltIcon,
  CheckCircleIcon,
  StarIcon,
  XMarkIcon,
  XCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  Bars3Icon,
} from '@heroicons/vue/20/solid'

export type IconName =
  | 'lock-closed'
  | 'lock-open'
  | 'bolt'
  | 'check-circle'
  | 'star'
  | 'x-mark'
  | 'x-circle'
  | 'chevron-up'
  | 'chevron-down'
  | 'arrow-right'
  | 'arrow-top-right-on-square'
  | 'information-circle'
  | 'exclamation-triangle'
  | 'check'
  | 'bars-3'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number
  }>(),
  { size: 16 },
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<IconName, any> = {
  'lock-closed': LockClosedIcon,
  'lock-open': LockOpenIcon,
  'bolt': BoltIcon,
  'check-circle': CheckCircleIcon,
  'star': StarIcon,
  'x-mark': XMarkIcon,
  'x-circle': XCircleIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-down': ChevronDownIcon,
  'arrow-right': ArrowRightIcon,
  'arrow-top-right-on-square': ArrowTopRightOnSquareIcon,
  'information-circle': InformationCircleIcon,
  'exclamation-triangle': ExclamationTriangleIcon,
  'check': CheckIcon,
  'bars-3': Bars3Icon,
}

const icon = computed(() => iconMap[props.name])
</script>

<template>
  <component
    :is="icon"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      display: 'inline-block',
      verticalAlign: 'middle',
      flexShrink: 0,
    }"
  />
</template>
