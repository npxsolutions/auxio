import { describe, it, expect } from 'vitest'
import { planVariantGroup, type ShopifyProduct } from '../variants'

const makeProduct = (overrides: Partial<ShopifyProduct> = {}): ShopifyProduct => ({
  id: 1001,
  title: 'Test Product',
  variants: [],
  options: [],
  images: [{ id: 9001, src: 'https://cdn/product.jpg' }],
  ...overrides,
})

describe('planVariantGroup', () => {
  it('single-variant product returns null', () => {
    const product = makeProduct({
      variants: [{ id: 1, sku: 'A', price: '10.00', option1: 'Default Title', inventory_quantity: 5 }],
      options: [{ name: 'Title', position: 1, values: ['Default Title'] }],
    })
    expect(planVariantGroup(product)).toBeNull()
  })

  it('2-variant (single axis) product returns plan with correct axis', () => {
    const product = makeProduct({
      variants: [
        { id: 1, sku: 'A-S', price: '10.00', option1: 'Small', inventory_quantity: 3 },
        { id: 2, sku: 'A-M', price: '10.00', option1: 'Medium', inventory_quantity: 4 },
      ],
      options: [{ name: 'Size', position: 1, values: ['Small', 'Medium'] }],
    })
    const plan = planVariantGroup(product)
    expect(plan).not.toBeNull()
    expect(plan!.variationSpecifics).toEqual(['Size'])
    expect(plan!.items).toHaveLength(2)
    expect(plan!.items[0].variationValues).toEqual({ Size: 'Small' })
    expect(plan!.groupSku).toBe('SHP-1001')
  })

  it('3-axis variant product returns plan with 3 specifics', () => {
    const product = makeProduct({
      variants: [
        { id: 1, sku: 'X-1', price: '20', option1: 'S', option2: 'Red',  option3: 'Cotton', inventory_quantity: 1 },
        { id: 2, sku: 'X-2', price: '20', option1: 'M', option2: 'Blue', option3: 'Wool',   inventory_quantity: 2 },
      ],
      options: [
        { name: 'Size',     position: 1, values: ['S', 'M'] },
        { name: 'Color',    position: 2, values: ['Red', 'Blue'] },
        { name: 'Material', position: 3, values: ['Cotton', 'Wool'] },
      ],
    })
    const plan = planVariantGroup(product)
    expect(plan).not.toBeNull()
    expect(plan!.variationSpecifics).toEqual(['Size', 'Color', 'Material'])
    expect(plan!.items[1].variationValues).toEqual({ Size: 'M', Color: 'Blue', Material: 'Wool' })
  })

  it('default-variant-only product (single variant "Default Title") returns null', () => {
    const product = makeProduct({
      variants: [
        { id: 1, sku: 'Z', price: '5', option1: 'Default Title', inventory_quantity: 10 },
      ],
      options: [{ name: 'Title', position: 1, values: ['Default Title'] }],
    })
    expect(planVariantGroup(product)).toBeNull()
  })

  it('variant missing an option value is skipped with a warn', () => {
    const product = makeProduct({
      variants: [
        { id: 1, sku: 'A-S', price: '10', option1: 'Small', inventory_quantity: 3 },
        { id: 2, sku: 'A-M', price: '10', option1: 'Medium', inventory_quantity: 4 },
        { id: 3, sku: 'A-X', price: '10', option1: '',       inventory_quantity: 2 },
      ],
      options: [{ name: 'Size', position: 1, values: ['Small', 'Medium'] }],
    })
    const plan = planVariantGroup(product)
    expect(plan).not.toBeNull()
    expect(plan!.items).toHaveLength(2)
  })

  it('prefers variant image over product image when image_id set', () => {
    const product = makeProduct({
      variants: [
        { id: 1, sku: 'A', price: '1', option1: 'Red',   inventory_quantity: 1, image_id: 500 },
        { id: 2, sku: 'B', price: '1', option1: 'Green', inventory_quantity: 1 },
      ],
      options: [{ name: 'Color', position: 1, values: ['Red', 'Green'] }],
      images: [
        { id: 500, src: 'https://cdn/red.jpg' },
        { id: 600, src: 'https://cdn/main.jpg' },
      ],
      image: { id: 600, src: 'https://cdn/main.jpg' },
    })
    const plan = planVariantGroup(product)
    expect(plan!.items[0].imageUrls[0]).toBe('https://cdn/red.jpg')
    // variant without image_id falls back to product image (product.image.src)
    expect(plan!.items[1].imageUrls[0]).toBe('https://cdn/main.jpg')
  })
})
