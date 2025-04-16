import { ICONS, KEYBOARD_KEYS, KEYDOWN_EVENT } from '../constants'
import {
  CI_CAROUSEL_CONTROLS_VISIBLE_CLASS,
  CI_CAROUSEL_FULLSCREEN_CLASS,
  CI_CAROUSEL_NEXT_CLASS,
  CI_CAROUSEL_PREV_CLASS,
} from '../constants/classes.constants'
import { createButton } from '../utils/dom.utils'

export class CarouselControls {
  /**
   * @param {CloudImageCarousel} carousel
   */
  constructor(carousel) {
    this.carousel = carousel
    this.container = carousel.controlsContainer
    this.options = carousel.options
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)
    this.hideControlsTimeout = null
    this.initializeControls()
  }

  initializeControls() {
    if (!this.options.showControls) return

    // Navigation buttons
    const prevButton = createButton(CI_CAROUSEL_PREV_CLASS, ICONS.PREV, 'Previous Image', () => {
      this.carousel.prev()
      this.showControls()
      this.scheduleHideControls()
    })

    const nextButton = createButton(CI_CAROUSEL_NEXT_CLASS, ICONS.NEXT, 'Next Image', () => {
      this.carousel.next()
      this.showControls()
      this.scheduleHideControls()
    })

    // Fullscreen control
    const fullscreenButton = createButton(CI_CAROUSEL_FULLSCREEN_CLASS, ICONS.FULLSCREEN, 'Toggle Fullscreen', () => {
      this.carousel.toggleFullscreen()
      this.showControls()
      this.scheduleHideControls()
    })

    // Add buttons to container
    this.container.appendChild(prevButton)
    this.container.appendChild(fullscreenButton)
    this.container.appendChild(nextButton)

    // Setup keyboard and touch controls
    this.setupKeyboardControls()
    this.setupTouchControls()
  }

  setupTouchControls() {
    // Show controls on touch
    this.carousel.mainView.addEventListener('touchstart', this.handleTouchStart)

    // Hide controls after 3 seconds of inactivity
    this.carousel.mainView.addEventListener('touchend', this.handleTouchEnd)
  }

  /**
   * Handles the touch start event
   */
  handleTouchStart() {
    this.showControls()
  }

  /**
   * Handles the touch end event
   */
  handleTouchEnd() {
    // Hide controls after 3 seconds of inactivity
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout)
    }

    // Hide after 3 seconds
    this.hideControlsTimeout = setTimeout(() => {
      this.container.classList.remove(CI_CAROUSEL_CONTROLS_VISIBLE_CLASS)
    }, 3000)
  }

  showControls() {
    // Clear any existing timeout
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout)
    }
    this.container.classList.add(CI_CAROUSEL_CONTROLS_VISIBLE_CLASS)
  }

  scheduleHideControls() {
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout)
    }
    this.hideControlsTimeout = setTimeout(() => {
      this.container.classList.remove(CI_CAROUSEL_CONTROLS_VISIBLE_CLASS)
    }, 3000) // Hide after 3 seconds
  }

  /**
   * Handles the keyboard events
   * @param {KeyboardEvent} e - The keyboard event
   */
  handleKeyDown(e) {
    switch (e.key) {
      case KEYBOARD_KEYS.ARROW_LEFT:
        this.carousel.prev()
        break
      case KEYBOARD_KEYS.ARROW_RIGHT:
        this.carousel.next()
        break
      case KEYBOARD_KEYS.ESCAPE:
        this.carousel.resetZoom()
        break
    }
  }

  /**
   * Allows the user to navigate the carousel using the keyboard
   */
  setupKeyboardControls() {
    document.addEventListener(KEYDOWN_EVENT, this.handleKeyDown)
  }

  destroy() {
    // Remove event listeners
    document.removeEventListener(KEYDOWN_EVENT, this.handleKeyDown)
    this.carousel.mainView.removeEventListener('touchstart', this.handleTouchStart)
    this.carousel.mainView.removeEventListener('touchend', this.handleTouchEnd)

    // Clear timeout
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout)
    }
  }
}
