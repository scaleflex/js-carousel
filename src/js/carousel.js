import screenfull from 'screenfull'

import { ACTIVE_CLASS, CI_CAROUSEL_BULLET_CLASS, CI_CAROUSEL_THUMBNAILS_CLASS } from './constants/classes.constants'
import { CLICK_EVENT } from './constants/events.constants'
import { TRANSITION_EFFECTS } from './constants/transition.constants'
import { CarouselControls } from './controls'
import { getFilenameWithoutExtension } from './utils/image.utils'
import { ZoomPanControls } from './zoom-pan.controls'

class CloudImageCarousel {
  /**
   * @param {string|HTMLElement} container - The container element or selector
   * @param {Object} options - Configuration options
   * @throws {Error} If container is null, undefined, or not found in DOM
   */
  constructor(container, options = {}) {
    if (!container) {
      throw new Error('Container parameter is required')
    }

    this.container = typeof container === 'string' ? document.querySelector(container) : container

    if (!this.container || !(this.container instanceof HTMLElement)) {
      throw new Error(
        `Invalid container: ${
          typeof container === 'string' ? `Element "${container}" not found` : 'Container must be a valid HTML element'
        }`,
      )
    }

    this.options = {
      images: options.images || [],
      autoplay: options.autoplay || false,
      autoplayInterval: options.autoplayInterval || 3000,
      cycle: options.cycle || true,
      showFilenames: options.showFilenames || false,
      showThumbnails: options.showThumbnails || true,
      showBullets: options.showBullets || false,
      showControls: options.showControls || true,
      transitionEffect: options.transitionEffect || TRANSITION_EFFECTS.FADE, // slide, fade
      ...options,
    }

    this.currentIndex = 0
    this.images = []
    this.isFullscreen = false
  }

  /**
   * Main view which wraps all containers
   */
  mainView

  /**
   * Image container
   */
  imageContainer

  /**
   * Thumbnails container
   */
  thumbnailsContainer

  /**
   * Controls container
   */
  controlsContainer

  /**
   * Bullets container
   */
  bulletsContainer

  /**
   * Initializes the carousel
   */
  init() {
    this.createStructure()

    if (this.options.autoplay) {
      this.startAutoplay()
    }

    this.loadImages(this.options.images)

    if (this.options.showControls) {
      this.controls = new CarouselControls(this)
      this.zoomPanControls = new ZoomPanControls(this)
    }
  }

  createStructure() {
    // Main container
    this.container.classList.add('ci-carousel')
    this.container.setAttribute('role', 'region')
    this.container.setAttribute('aria-label', 'Image carousel')

    // Main view
    this.mainView = document.createElement('div')
    this.mainView.classList.add('ci-carousel-main')

    // Image container
    this.imageContainer = document.createElement('div')
    this.imageContainer.classList.add('ci-carousel-images')
    this.imageContainer.setAttribute('role', 'list')

    // Controls
    this.controlsContainer = document.createElement('div')
    this.controlsContainer.classList.add('ci-carousel-controls')

    // Bullets container
    if (this.options.showBullets) {
      this.bulletsContainer = document.createElement('div')
      this.bulletsContainer.classList.add('ci-carousel-bullets')
    }

    // Thumbnails
    if (this.options.showThumbnails) {
      this.container.classList.add('ci-carousel-has-thumbnails')
      this.thumbnailsContainer = document.createElement('div')
      this.thumbnailsContainer.classList.add(CI_CAROUSEL_THUMBNAILS_CLASS)
    }

    this.mainView.appendChild(this.imageContainer)
    this.container.appendChild(this.mainView)
    this.container.appendChild(this.controlsContainer)

    if (this.thumbnailsContainer) {
      this.container.appendChild(this.thumbnailsContainer)
    }

    if (this.bulletsContainer) {
      this.container.classList.add('ci-carousel-has-bullets')
      this.container.appendChild(this.bulletsContainer)
    }
  }

  /**
   * Loads images into the carousel and initializes their loading state
   * @param {string|Array} sources - The image sources
   */
  loadImages(sources) {
    if (Array.isArray(sources)) {
      // Transform image sources into objects with loading state tracking
      this.images = sources.map((src) => ({
        src: src, // Store the actual source
        loaded: false, // Flag to track if the image has been loaded
      }))
      this.renderImages()
    }
  }

  /**
   * Renders the images into the carousel with lazy loading support
   * Creates image wrappers with accessibility attributes and transition effects
   */
  renderImages() {
    this.imageContainer.innerHTML = ''
    this.images.forEach((image, index) => {
      // Create wrapper for each image with proper transition and accessibility setup
      const wrapper = document.createElement('div')
      wrapper.classList.add('ci-carousel-image-wrapper')
      wrapper.classList.add(this.options.transitionEffect)
      wrapper.style.display = index === this.currentIndex ? 'block' : 'none'

      // Add ARIA attributes for accessibility
      wrapper.setAttribute('role', 'listitem')
      wrapper.setAttribute('aria-label', `Slide ${index + 1} of ${this.images.length}`)

      if (index === this.currentIndex) {
        wrapper.classList.add(ACTIVE_CLASS)
      }

      const img = new Image()
      img.classList.add('ci-carousel-image')

      // Setup lazy loading: Use data-src to store actual image URL
      // and a tiny SVG as placeholder until image is in viewport
      img.dataset.src = image.src

      // Add a loading placeholder
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'

      // Optional: Add loading attribute for native lazy loading
      img.loading = 'lazy'

      wrapper.appendChild(img)

      if (this.options.showFilenames) {
        const filename = document.createElement('div')
        filename.classList.add('ci-carousel-filename')
        filename.textContent = getFilenameWithoutExtension(image.src)
        wrapper.appendChild(filename)
      }

      this.imageContainer.appendChild(wrapper)
    })

    if (this.options.showThumbnails) {
      this.renderThumbnails()
    }

    if (this.options.showBullets) {
      this.renderBullets()
    }

    this.setupLazyLoading()
  }

  /**
   * Sets up lazy loading using IntersectionObserver
   * Only loads images when they enter the viewport for better performance
   */
  setupLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers that don't support Intersection Observer
      this.loadVisibleImages() // Load all images immediately
      return
    }

    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target
          const src = img.dataset.src
          if (src) {
            img.src = src
            delete img.dataset.src // Prevent reloading
            observer.unobserve(img) // Stop observing this image
          }
        }
      })
    })

    const images = this.imageContainer.querySelectorAll('.ci-carousel-image')
    images.forEach((img) => {
      this.observer.observe(img)
    })
  }

  /**
   * Fallback to load all images immediately if IntersectionObserver is not supported
   */
  loadVisibleImages() {
    const images = this.imageContainer.querySelectorAll('.ci-carousel-image')
    images.forEach((img) => {
      const src = img.dataset.src
      if (src) {
        img.src = src
        delete img.dataset.src
      }
    })
  }

  /**
   * Renders the thumbnails into the carousel
   */
  renderThumbnails() {
    this.thumbnailsContainer.innerHTML = ''

    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment()

    this.images.forEach((img, index) => {
      const thumb = document.createElement('div')
      thumb.classList.add('ci-carousel-thumbnail')
      thumb.dataset.index = index
      if (index === this.currentIndex) {
        thumb.classList.add(ACTIVE_CLASS)
      }

      const thumbImg = new Image()
      thumbImg.src = img.src
      thumb.appendChild(thumbImg)
      fragment.appendChild(thumb)
    })

    this.thumbnailsContainer.appendChild(fragment)

    // Single event listener using event delegation
    if (!this.thumbnailClickHandler) {
      this.thumbnailClickHandler = (e) => {
        const thumb = e.target.closest('.ci-carousel-thumbnail')
        if (thumb) {
          const index = parseInt(thumb.dataset.index, 10)
          this.goToSlide(index)
        }
      }
      this.thumbnailsContainer.addEventListener(CLICK_EVENT, this.thumbnailClickHandler)
    }
  }

  /**
   * Renders the bullets into the carousel
   */
  renderBullets() {
    if (!this.options.showBullets || !this.bulletsContainer) return

    this.bulletsContainer.innerHTML = ''
    const fragment = document.createDocumentFragment()

    this.images.forEach((_, index) => {
      const bullet = document.createElement('button')
      bullet.classList.add(CI_CAROUSEL_BULLET_CLASS)
      bullet.dataset.index = index
      if (index === this.currentIndex) {
        bullet.classList.add(ACTIVE_CLASS)
      }
      fragment.appendChild(bullet)
    })

    this.bulletsContainer.appendChild(fragment)

    // Single event listener using event delegation
    if (!this.bulletClickHandler) {
      this.bulletClickHandler = (e) => {
        const bullet = e.target.closest(`.${CI_CAROUSEL_BULLET_CLASS}`)
        if (bullet) {
          const index = parseInt(bullet.dataset.index, 10)
          this.goToSlide(index)
        }
      }
      this.bulletsContainer.addEventListener(CLICK_EVENT, this.bulletClickHandler)
    }
  }

  /**
   * Navigates to a specific slide with cycle support
   * Handles edge cases for first/last slides based on cycle option
   * @param {number} index - The target slide index
   */
  goToSlide(index) {
    if (index < 0) {
      index = this.options.cycle ? this.images.length - 1 : 0
    } else if (index >= this.images.length) {
      index = this.options.cycle ? 0 : this.images.length - 1
    }

    const prevIndex = this.currentIndex
    this.currentIndex = index

    // Reset autoplay if it's enabled
    if (this.options.autoplay) {
      this.resetAutoplay()
    }

    this.updateSlide(prevIndex)
  }

  /**
   * Updates slide display with transition effects
   * Handles both slide and fade transitions
   * Updates thumbnails and bullets if enabled
   * @param {number} prevIndex - The index of the previous slide
   */
  updateSlide(prevIndex) {
    const slides = this.imageContainer.children
    const prevSlide = slides[prevIndex]
    const currentSlide = slides[this.currentIndex]

    // Remove any existing transition classes
    prevSlide.classList.remove(ACTIVE_CLASS)
    currentSlide.classList.remove(ACTIVE_CLASS)

    // Apply transition based on effect type
    if (this.options.transitionEffect === TRANSITION_EFFECTS.SLIDE) {
      // For slide effect
      currentSlide.classList.add(ACTIVE_CLASS)
    } else if (this.options.transitionEffect === TRANSITION_EFFECTS.FADE) {
      // For fade effect
      currentSlide.classList.add(ACTIVE_CLASS)
    }

    // Update thumbnails if enabled
    if (this.options.showThumbnails) {
      const thumbs = this.thumbnailsContainer.children
      thumbs[prevIndex].classList.remove(ACTIVE_CLASS)
      thumbs[this.currentIndex].classList.add(ACTIVE_CLASS)
    }

    // Update bullets if enabled
    if (this.options.showBullets) {
      const bullets = this.bulletsContainer.children
      bullets[prevIndex].classList.remove(ACTIVE_CLASS)
      bullets[this.currentIndex].classList.add(ACTIVE_CLASS)
    }

    /// Reset and initialize Panzoom for new slide
    if (this.zoomPanControls) {
      this.zoomPanControls.resetZoom()
      this.zoomPanControls.initializeVisibleImage()
    }
  }

  next() {
    this.goToSlide(this.currentIndex + 1)
  }

  prev() {
    this.goToSlide(this.currentIndex - 1)
  }

  zoomIn() {
    if (this.zoomPanControls) {
      this.zoomPanControls.zoomIn({ animate: true })
    }
  }

  zoomOut() {
    if (this.zoomPanControls) {
      this.zoomPanControls.zoomOut({ animate: true })
    }
  }

  resetZoom() {
    if (this.zoomPanControls) {
      this.zoomPanControls.resetZoom()
    }
  }

  toggleFullscreen() {
    if (screenfull.isEnabled) {
      screenfull.toggle(this.container)

      // Update state based on actual fullscreen state
      screenfull.on('change', () => {
        this.isFullscreen = screenfull.isFullscreen
        this.container.classList.toggle('is-fullscreen', this.isFullscreen)
      })
    }
  }

  startAutoplay() {
    this.autoplayInterval = setInterval(() => {
      this.next()
    }, this.options.autoplayInterval)
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval)
    }
  }

  resetAutoplay() {
    this.stopAutoplay()
    this.startAutoplay()
  }

  destroy() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval)
    }

    if (this.observer) {
      this.observer.disconnect()
    }

    if (this.thumbnailClickHandler) {
      this.thumbnailsContainer?.removeEventListener(CLICK_EVENT, this.thumbnailClickHandler)
    }

    if (this.bulletClickHandler) {
      this.bulletsContainer?.removeEventListener(CLICK_EVENT, this.bulletClickHandler)
    }

    if (this.zoomPanControls) {
      this.zoomPanControls.destroy()
    }

    if (this.controls) {
      this.controls.destroy()
    }

    if (screenfull.isEnabled) {
      screenfull.off('change')
    }

    // Clear references
    this.images = []
    this.container = null
    this.mainView = null
    this.imageContainer = null
    this.thumbnailsContainer = null
    this.controlsContainer = null
    this.bulletsContainer = null
  }
}

export { CloudImageCarousel }
