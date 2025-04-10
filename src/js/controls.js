import { createButton } from './utils/dom.utils';
import { KEYDOWN_EVENT, ICONS as ICONS, KEYBOARD_KEYS } from './constants';

export class CarouselControls {
  /**
   * @param {CloudImageCarousel} carousel
   */
  constructor(carousel) {
    this.carousel = carousel;
    this.container = carousel.controlsContainer;
    this.options = carousel.options;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.setupControls();
  }

  setupControls() {
    if (!this.options.showControls) return;

    // Navigation buttons
    const prevButton = createButton(
      'ci-carousel-prev',
      ICONS.PREV,
      'Previous Image',
      () => this.carousel.prev()
    );
    const nextButton = createButton(
      'ci-carousel-next',
      ICONS.NEXT,
      'Next Image',
      () => this.carousel.next()
    );

    // Fullscreen control
    const fullscreenButton = createButton(
      'ci-carousel-fullscreen',
      ICONS.FULLSCREEN,
      'Toggle Fullscreen',
      () => this.carousel.toggleFullscreen()
    );

    // Add buttons to container
    this.container.appendChild(prevButton);
    this.container.appendChild(fullscreenButton);
    this.container.appendChild(nextButton);

    // Setup keyboard controls
    this.setupKeyboardControls();
  }

  /**
   * Handles the keyboard events
   * @param {KeyboardEvent} e - The keyboard event
   */
  handleKeyDown(e) {
    switch (e.key) {
      case KEYBOARD_KEYS.ARROW_LEFT:
        this.carousel.prev();
        break;
      case KEYBOARD_KEYS.ARROW_RIGHT:
        this.carousel.next();
        break;
      case KEYBOARD_KEYS.ESCAPE:
        this.carousel.resetZoom();
        break;
    }
  }

  /**
   * Allows the user to navigate the carousel using the keyboard
   */
  setupKeyboardControls() {
    document.addEventListener(KEYDOWN_EVENT, this.handleKeyDown);
  }
}
