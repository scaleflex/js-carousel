import Panzoom from '@panzoom/panzoom'

import { CI_CAROUSEL_IMAGE_CLASS } from './constants/classes.constants'
import { MOUSEWHEEL_EVENT } from './constants/events.constants'
import { debounce } from './utils/throttling.utils'

export class ZoomPanControls {
  /**
   * @param {CloudImageCarousel} carousel
   */
  constructor(carousel) {
    this.carousel = carousel
    this.imageContainer = carousel.imageContainer
    this.panzoomInstance = null

    // add debounce to limit processing of wheel events
    // preventing the browser from getting overwhelmed with too many calculations while still providing a smooth user experience
    this.debouncedWheel = debounce((event) => {
      if (this.panzoomInstance) {
        this.panzoomInstance.zoomWithWheel(event)
      }
    }, 16) // approximately 60fps which is the optimal refresh rate for smooth animations in most browsers

    this.imageContainer.addEventListener(MOUSEWHEEL_EVENT, this.handleWheel.bind(this))
    this.initializeVisibleImage()
  }

  /**
   * Sets up zoom/pan for the currently visible image
   * Handles both immediate and lazy-loaded images
   */
  initializeVisibleImage() {
    const currentWrapper = this.getCurrentWrapper()
    if (currentWrapper) {
      const img = currentWrapper.querySelector(`.${CI_CAROUSEL_IMAGE_CLASS}`)
      if (img) {
        // Make sure the image is loaded before initializing the Panzoom instance
        if (img.complete) {
          this.initPanzoom(img)
        } else {
          // If image is not loaded yet, wait for it
          img.addEventListener('load', () => this.initPanzoom(img), {
            once: true,
          })
        }
      }
    }
  }

  /**
   * Core initialization of pan/zoom functionality for an image
   * Sets up event handlers and configuration for zooming and panning
   * @param {HTMLImageElement} imageElement - The image to enable pan/zoom on
   */
  initPanzoom(imageElement) {
    // Prevent duplicate initialization
    if (this.panzoomInstance?.getElement() === imageElement) return

    // Cleanup any existing pan/zoom instance
    if (this.panzoomInstance) {
      this.cleanupCurrentPanzoom()
    }

    this.currentElement = imageElement

    // Configure panzoom with constraints and behavior settings
    // Github Reference: https://github.com/timmywil/panzoom
    this.panzoomInstance = Panzoom(imageElement, {
      maxScale: 4,
      minScale: 1,
      contain: 'outside', // This ensures the image is always fully visible
      startScale: 1,
      panOnlyWhenZoomed: false,
      duration: 200,
      step: 0.3,
      cursor: 'default',
      setContainer: true,
    })

    // this should be the image container `ci-carousel-image-wrapper` class
    const parent = imageElement.parentElement
    // Store handlers separately for clean removal later
    this.currentHandlers = {
      wheel: this.panzoomInstance.zoomWithWheel,
      pointerdown: this.panzoomInstance.handleDown,
      pointermove: this.panzoomInstance.handleMove,
      pointerup: this.panzoomInstance.handleUp,
      // Update cursor based on zoom state
      panzoomchange: (event) => {
        const { scale } = event.detail
        imageElement.style.cursor = scale > 1 ? 'move' : 'zoom-in'
      },
    }

    // Attach all necessary event listeners for pan/zoom functionality
    parent.addEventListener(MOUSEWHEEL_EVENT, this.currentHandlers.wheel)
    parent.addEventListener('pointerdown', this.currentHandlers.pointerdown)
    document.addEventListener('pointermove', this.currentHandlers.pointermove)
    document.addEventListener('pointerup', this.currentHandlers.pointerup)
    imageElement.addEventListener('panzoomchange', this.currentHandlers.panzoomchange)
  }

  /**
   * @param {WheelEvent} event
   */
  handleWheel(event) {
    if (!this.panzoomInstance) {
      this.initializeVisibleImage()
    }
    this.debouncedWheel(event)
  }

  getCurrentWrapper() {
    return this.imageContainer.children[this.carousel.currentIndex]
  }

  zoomIn(options = {}) {
    if (!this.panzoomInstance) {
      this.initializeVisibleImage()
    }

    if (this.panzoomInstance) {
      this.panzoomInstance.zoomIn({ animate: true, ...options })
    }
  }

  zoomOut(options = {}) {
    if (this.panzoomInstance) {
      this.panzoomInstance.zoomOut({ animate: true, ...options })
    }
  }

  resetZoom() {
    if (this.panzoomInstance) {
      this.panzoomInstance.reset({ animate: true })
      this.cleanupCurrentPanzoom()
    }
  }

  /**
   * Comprehensive cleanup of all pan/zoom related handlers and instances
   * Prevents memory leaks and event listener buildup
   */
  cleanupCurrentPanzoom() {
    if (!this.panzoomInstance || !this.currentElement) return

    const parent = this.currentElement.parentElement

    if (this.currentElement && parent && this.currentHandlers) {
      // Remove all event listeners
      parent.removeEventListener(MOUSEWHEEL_EVENT, this.currentHandlers.wheel)
      parent.removeEventListener('pointerdown', this.currentHandlers.pointerdown)
      document.removeEventListener('pointermove', this.currentHandlers.pointermove)
      document.removeEventListener('pointerup', this.currentHandlers.pointerup)
      this.currentElement.removeEventListener('panzoomchange', this.currentHandlers.panzoomchange)
    }

    this.panzoomInstance.destroy()
    this.panzoomInstance = null
    this.currentElement = null
    this.currentHandlers = null
  }

  destroy() {
    this.cleanupCurrentPanzoom()
    this.imageContainer.removeEventListener(MOUSEWHEEL_EVENT, this.handleWheel)
  }
}
