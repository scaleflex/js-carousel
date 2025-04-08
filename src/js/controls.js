import { createButton } from './utils/dom.utils';
import { KEYDOWN_EVENT } from './constants/events.constants';

export class CarouselControls {
  /**
   * @param {CloudImageCarousel} carousel
   */
  constructor(carousel) {
    this.carousel = carousel;
    this.container = carousel.controlsContainer;
    this.options = carousel.options;
    this.setupControls();
  }

  setupControls() {
    if (!this.options.showControls) return;

    // Navigation buttons
    const prevButton = createButton('ci-carousel-prev', '←', () =>
      this.carousel.prev()
    );
    const nextButton = createButton('ci-carousel-next', '→', () =>
      this.carousel.next()
    );

    // Zoom controls
    const zoomInButton = createButton('ci-carousel-zoom-in', '+', () =>
      this.carousel.zoomIn()
    );
    const zoomOutButton = createButton('ci-carousel-zoom-out', '-', () =>
      this.carousel.zoomOut()
    );
    const zoomResetButton = createButton('ci-carousel-zoom-reset', '↺', () =>
      this.carousel.resetZoom()
    );

    // Fullscreen control
    const fullscreenButton = createButton('ci-carousel-fullscreen', '⤢', () =>
      this.carousel.toggleFullscreen()
    );

    // Add buttons to container
    this.container.appendChild(prevButton);
    this.container.appendChild(zoomOutButton);
    this.container.appendChild(zoomResetButton);
    this.container.appendChild(zoomInButton);
    this.container.appendChild(fullscreenButton);
    this.container.appendChild(nextButton);

    // Setup keyboard controls
    this.setupKeyboardControls();
  }

  /**
   * Allows the user to navigate the carousel using the keyboard
   */
  setupKeyboardControls() {
    document.addEventListener(KEYDOWN_EVENT, (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          this.carousel.prev();
          break;
        case 'ArrowRight':
          this.carousel.next();
          break;
        case 'Escape':
          this.carousel.resetZoom();
          break;
      }
    });
  }
}
