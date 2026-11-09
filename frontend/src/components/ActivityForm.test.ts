import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ActivityForm from './ActivityForm.vue'
vi.mock('@/api/client', () => ({ api: { get: vi.fn(), post: vi.fn() }, parseApiError: () => ({ message: 'Error', fieldErrors: {} }) }))
describe('ActivityForm', () => {
  it('muestra campos y valida duración antes de enviar', async () => {
    const pinia = createPinia(); setActivePinia(pinia)
    const wrapper = mount(ActivityForm, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toContain('Registrar actividad')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Escribe la duración')
  })
})
