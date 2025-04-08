const createButton = (className, innerHTML, onClick) => {
  const button = document.createElement('button');
  button.classList.add('ci-carousel-btn', className);
  button.innerHTML = innerHTML;
  button.addEventListener('click', onClick);
  return button;
};

export { createButton };
