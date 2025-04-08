import { CLICK_EVENT } from './constants/events.constants';
import { CarouselControls } from './controls';
import { getFilenameWithoutExtension } from './utils/image.utils';
import { ACTIVE_CLASS, PREV_CLASS } from './constants/controls.constants';

class CloudImageCarousel {
  /**
   * @param {string|HTMLElement} container - The container element or selector
   * @param {Object} options - Configuration options
   * @throws {Error} If container is null, undefined, or not found in DOM
   */
  constructor(container, options = {}) {
    if (!container) {
      throw new Error('Container parameter is required');
    }

    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!this.container || !(this.container instanceof HTMLElement)) {
      throw new Error(
        `Invalid container: ${
          typeof container === 'string'
            ? `Element "${container}" not found`
            : 'Container must be a valid HTML element'
        }`
      );
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
      transitionEffect: options.transitionEffect || 'fade', // slide, fade
      ...options,
    };

    this.currentIndex = 0;
    this.images = [];
    this.isFullscreen = false;
    this.scale = 1;
  }

  /**
   * Main view which wraps all containers
   */
  mainView;

  /**
   * Image container
   */
  imageContainer;

  /**
   * Thumbnails container
   */
  thumbnailsContainer;

  /**
   * Controls container
   */
  controlsContainer;

  /**
   * Bullets container
   */
  bulletsContainer;

  /**
   * Initializes the carousel
   */
  init() {
    this.createStructure();

    if (this.options.showControls) {
      new CarouselControls(this);
    }

    if (this.options.autoplay) {
      this.startAutoplay();
    }

    this.loadImages(this.options.images);
  }

  createStructure() {
    // Main container
    this.container.classList.add('ci-carousel');

    // Main view
    this.mainView = document.createElement('div');
    this.mainView.classList.add('ci-carousel-main');

    // Image container
    this.imageContainer = document.createElement('div');
    this.imageContainer.classList.add('ci-carousel-images');

    // Controls
    this.controlsContainer = document.createElement('div');
    this.controlsContainer.classList.add('ci-carousel-controls');

    // Bullets container
    if (this.options.showBullets) {
      this.bulletsContainer = document.createElement('div');
      this.bulletsContainer.classList.add('ci-carousel-bullets');
    }

    // Thumbnails
    if (this.options.showThumbnails) {
      this.thumbnailsContainer = document.createElement('div');
      this.thumbnailsContainer.classList.add('ci-carousel-thumbnails');
    }

    this.mainView.appendChild(this.imageContainer);
    this.container.appendChild(this.mainView);
    this.container.appendChild(this.controlsContainer);

    if (this.thumbnailsContainer) {
      this.container.appendChild(this.thumbnailsContainer);
    }

    if (this.bulletsContainer) {
      this.container.appendChild(this.bulletsContainer);
    }
  }

  /**
   * Loads images into the carousel
   * @param {string|Array} sources - The image sources
   */
  loadImages(sources) {
    if (Array.isArray(sources)) {
      this.images = sources.map((src) => ({
        src: src, // Store the actual source
        loaded: false, // Flag to track if the image has been loaded
      }));
      this.renderImages();
    }
  }

  /**
   * Renders the images into the carousel
   */
  renderImages() {
    this.imageContainer.innerHTML = '';
    this.images.forEach((image, index) => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('ci-carousel-image-wrapper');
      wrapper.classList.add(this.options.transitionEffect);
      wrapper.style.display = index === this.currentIndex ? 'block' : 'none';

      if (index === this.currentIndex) {
        wrapper.classList.add(ACTIVE_CLASS);
      }

      const img = new Image();
      img.classList.add('ci-carousel-image');

      // Set data-src for lazy loading
      img.dataset.src = image.src;

      // Add a loading placeholder
      img.src =
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';

      // Optional: Add loading attribute for native lazy loading
      img.loading = 'lazy';

      wrapper.appendChild(img);

      if (this.options.showFilenames) {
        const filename = document.createElement('div');
        filename.classList.add('ci-carousel-filename');
        filename.textContent = getFilenameWithoutExtension(image.src);
        wrapper.appendChild(filename);
      }

      this.imageContainer.appendChild(wrapper);
    });

    if (this.options.showThumbnails) {
      this.renderThumbnails();
    }

    if (this.options.showBullets) {
      this.renderBullets();
    }

    this.setupLazyLoading();
  }

  /**
   * Set up lazy loading for images with IntersectionObserver
   */
  setupLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers that don't support Intersection Observer
      this.loadVisibleImages(); // Load all images immediately
      return;
    }

    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            delete img.dataset.src; // Prevent reloading
            observer.unobserve(img); // Stop observing this image
          }
        }
      });
    });

    const images = this.imageContainer.querySelectorAll('.ci-carousel-image');
    images.forEach((img) => {
      this.observer.observe(img);
    });
  }

  /**
   * Fallback to load all images immediately if IntersectionObserver is not supported
   */
  loadVisibleImages() {
    const images = this.imageContainer.querySelectorAll('.ci-carousel-image');
    images.forEach((img) => {
      const src = img.dataset.src;
      if (src) {
        img.src = src;
        delete img.dataset.src;
      }
    });
  }

  /**
   * Renders the thumbnails into the carousel
   */
  renderThumbnails() {
    this.thumbnailsContainer.innerHTML = '';
    this.images.forEach((img, index) => {
      const thumb = document.createElement('div');
      thumb.classList.add('ci-carousel-thumbnail');
      if (index === this.currentIndex) {
        thumb.classList.add(ACTIVE_CLASS);
      }

      const thumbImg = new Image();
      thumbImg.src = img.src;
      thumb.appendChild(thumbImg);

      thumb.addEventListener(CLICK_EVENT, () => this.goToSlide(index));
      this.thumbnailsContainer.appendChild(thumb);
    });
  }

  /**
   * Renders the bullets into the carousel
   */
  renderBullets() {
    if (!this.options.showBullets || !this.bulletsContainer) return;

    this.bulletsContainer.innerHTML = '';
    this.images.forEach((_, index) => {
      const bullet = document.createElement('button');
      bullet.classList.add('ci-carousel-bullet');
      if (index === this.currentIndex) {
        bullet.classList.add(ACTIVE_CLASS);
      }
      bullet.addEventListener(CLICK_EVENT, () => this.goToSlide(index));
      this.bulletsContainer.appendChild(bullet);
    });
  }

  /**
   * Navigates to a specific slide
   * @param {number} index - The index of the slide to navigate to
   */
  goToSlide(index) {
    if (index < 0) {
      index = this.options.cycle ? this.images.length - 1 : 0;
    } else if (index >= this.images.length) {
      index = this.options.cycle ? 0 : this.images.length - 1;
    }

    const prevIndex = this.currentIndex;
    this.currentIndex = index;

    // Reset autoplay if it's enabled
    if (this.options.autoplay) {
      this.resetAutoplay();
    }

    this.updateSlide(prevIndex);
  }

  /**
   * Updates the slide display
   * @param {number} prevIndex - The index of the previous slide
   */
  updateSlide(prevIndex) {
    const slides = this.imageContainer.children;
    const prevSlide = slides[prevIndex];
    const currentSlide = slides[this.currentIndex];

    // Remove any existing transition classes
    prevSlide.classList.remove(ACTIVE_CLASS);
    currentSlide.classList.remove(ACTIVE_CLASS);

    // Apply transition based on effect type
    if (this.options.transitionEffect === 'slide') {
      // For slide effect
      // prevSlide.classList.add(PREV_CLASS);
      currentSlide.classList.add(ACTIVE_CLASS);
    } else if (this.options.transitionEffect === 'fade') {
      // For fade effect
      currentSlide.classList.add(ACTIVE_CLASS);
    }

    // Update thumbnails if enabled
    if (this.options.showThumbnails) {
      const thumbs = this.thumbnailsContainer.children;
      thumbs[prevIndex].classList.remove(ACTIVE_CLASS);
      thumbs[this.currentIndex].classList.add(ACTIVE_CLASS);
    }

    // Update bullets if enabled
    if (this.options.showBullets) {
      const bullets = this.bulletsContainer.children;
      bullets[prevIndex].classList.remove(ACTIVE_CLASS);
      bullets[this.currentIndex].classList.add(ACTIVE_CLASS);
    }
  }

  next() {
    this.goToSlide(this.currentIndex + 1);
  }

  prev() {
    this.goToSlide(this.currentIndex - 1);
  }

  zoomIn() {
    this.scale *= 1.2;
    this.updateZoom();
  }

  zoomOut() {
    this.scale /= 1.2;
    if (this.scale < 1) this.scale = 1;
    this.updateZoom();
  }

  resetZoom() {
    this.scale = 1;
    this.updateZoom();
  }

  updateZoom() {
    const currentImage = this.imageContainer.children[this.currentIndex];
    currentImage.style.transform = `scale(${this.scale})`;
  }

  toggleFullscreen() {
    if (!this.isFullscreen) {
      if (this.container.requestFullscreen) {
        this.container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    this.isFullscreen = !this.isFullscreen;
  }

  startAutoplay() {
    this.autoplayInterval = setInterval(() => {
      this.next();
    }, this.options.autoplayInterval);
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }
  }

  resetAutoplay() {
    this.stopAutoplay();
    this.startAutoplay();
  }

  destroy() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
    // Remove event listeners, garbage collect, etc.
  }
}

export { CloudImageCarousel };
