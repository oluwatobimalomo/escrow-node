export const LISTING_CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'phones_tablets', label: 'Phones & Tablets' },
  { value: 'computing', label: 'Computing' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'home_living', label: 'Home & Living' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'other', label: 'Other' },
] as const

export type ListingCategory = (typeof LISTING_CATEGORIES)[number]['value']

const CATEGORY_VALUES = new Set<string>(LISTING_CATEGORIES.map((c) => c.value))

export function isValidCategory(value: string): value is ListingCategory {
  return CATEGORY_VALUES.has(value)
}

export function categoryLabel(value: string | null | undefined) {
  return LISTING_CATEGORIES.find((c) => c.value === value)?.label ?? 'Other'
}
