import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RadarIcon from '../../components/RadarIcon.vue'

describe('RadarIcon Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Rendering', () => {
    it('should render radar icon button', () => {
      const wrapper = mount(RadarIcon)

      expect(wrapper.find('button').exists()).toBe(true)
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should have correct CSS classes for styling', () => {
      const wrapper = mount(RadarIcon)

      const button = wrapper.find('button')
      expect(button.classes()).toContain('radar-icon-button')
    })

    it('should display radar scanner icon', () => {
      const wrapper = mount(RadarIcon)

      const svg = wrapper.find('svg')
      expect(svg.exists()).toBe(true)
      expect(svg.attributes('viewBox')).toBeDefined()
    })
  })

  describe('Interactive States', () => {
    it('should show inactive state by default', () => {
      const wrapper = mount(RadarIcon)

      const button = wrapper.find('button')
      expect(button.classes()).not.toContain('active')
    })

    it('should show active state when radar drawer is open', () => {
      const wrapper = mount(RadarIcon, {
        props: {
          isActive: true
        }
      })

      const button = wrapper.find('button')
      expect(button.classes()).toContain('active')
    })

    it('should show loading state when radar is loading', () => {
      const wrapper = mount(RadarIcon, {
        props: {
          isLoading: true
        }
      })

      const button = wrapper.find('button')
      expect(button.classes()).toContain('loading')
      expect(button.find('.loading-spinner').exists()).toBe(true)
    })

    it('should be disabled when disabled prop is true', () => {
      const wrapper = mount(RadarIcon, {
        props: {
          disabled: true
        }
      })

      const button = wrapper.find('button')
      expect(button.attributes('disabled')).toBeDefined()
      expect(button.classes()).toContain('disabled')
    })
  })

  describe('User Interaction', () => {
    it('should emit click event when button is clicked', async () => {
      const wrapper = mount(RadarIcon)

      const button = wrapper.find('button')
      await button.trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')).toHaveLength(1)
    })

    it('should not emit click event when disabled', async () => {
      const wrapper = mount(RadarIcon, {
        props: {
          disabled: true
        }
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      expect(wrapper.emitted('click')).toBeFalsy()
    })

    it('should not emit click event when loading', async () => {
      const wrapper = mount(RadarIcon, {
        props: {
          isLoading: true
        }
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      expect(wrapper.emitted('click')).toBeFalsy()
    })

    it('should provide keyboard accessibility', async () => {
      const wrapper = mount(RadarIcon)

      const button = wrapper.find('button')
      await button.trigger('keydown.enter')

      expect(wrapper.emitted('click')).toBeTruthy()
    })

    it('should provide keyboard accessibility with space', async () => {
      const wrapper = mount(RadarIcon)

      const button = wrapper.find('button')
      await button.trigger('keydown.space')

      expect(wrapper.emitted('click')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria attributes', () => {
      const wrapper = mount(RadarIcon)

      const button = wrapper.find('button')
      expect(button.attributes('aria-label')).toBeDefined()
      expect(button.attributes('role')).toBe('button')
    })

    it('should have aria-pressed when active', () => {
      const wrapper = mount(RadarIcon, {
        props: {
          isActive: true
        }
      })

      const button = wrapper.find('button')
      expect(button.attributes('aria-pressed')).toBe('true')
    })

    it('should have aria-pressed false when inactive', () => {
      const wrapper = mount(RadarIcon)

      const button = wrapper.find('button')
      expect(button.attributes('aria-pressed')).toBe('false')
    })

    it('should have aria-disabled when disabled', () => {
      const wrapper = mount(RadarIcon, {
        props: {
          disabled: true
        }
      })

      const button = wrapper.find('button')
      expect(button.attributes('aria-disabled')).toBe('true')
    })
  })

  describe('Animation', () => {
    it('should have radar sweep animation when active', () => {
      const wrapper = mount(RadarIcon, {
        props: {
          isActive: true
        }
      })

      const radarSweep = wrapper.find('.radar-sweep')
      expect(radarSweep.exists()).toBe(true)
      expect(radarSweep.classes()).toContain('animate-sweep')
    })

    it('should not show animation when inactive', () => {
      const wrapper = mount(RadarIcon)

      const radarSweep = wrapper.find('.radar-sweep')
      expect(radarSweep.exists()).toBe(false)
    })

    it('should have loading spinner animation when loading', () => {
      const wrapper = mount(RadarIcon, {
        props: {
          isLoading: true
        }
      })

      const spinner = wrapper.find('.loading-spinner')
      expect(spinner.exists()).toBe(true)
      expect(spinner.classes()).toContain('animate-spin')
    })
  })

  describe('Props', () => {
    it('should accept isActive prop', () => {
      const wrapper = mount(RadarIcon, {
        props: {
          isActive: true
        }
      })

      expect(wrapper.props('isActive')).toBe(true)
    })

    it('should accept isLoading prop', () => {
      const wrapper = mount(RadarIcon, {
        props: {
          isLoading: true
        }
      })

      expect(wrapper.props('isLoading')).toBe(true)
    })

    it('should accept disabled prop', () => {
      const wrapper = mount(RadarIcon, {
        props: {
          disabled: true
        }
      })

      expect(wrapper.props('disabled')).toBe(true)
    })

    it('should have default prop values', () => {
      const wrapper = mount(RadarIcon)

      expect(wrapper.props('isActive')).toBe(false)
      expect(wrapper.props('isLoading')).toBe(false)
      expect(wrapper.props('disabled')).toBe(false)
    })
  })
})
