import './helpers/NodeListFix';

import $e from './modules/$e';
import calculate from './modules/calculate';
import imagesLoaded, { imagesLoadedNew } from './helpers/imagesLoaded';
import { wait } from './helpers/wait';
import Queue from './modules/queue';
import EventsManager from './modules/events';


const defaults = {
  columns: 4,
  margin: 2,
  trueOrder: true,
  waitForImages: false,
  useImageLoader: true,
  breakAt: {},
  useOwnImageLoader: false
};

/**
 * Masonary Factory
 * @param {Object} opts - The configuration object for macy.
 */
const Macy = function (opts = defaults) {
  /**
   * Create instance of macy if not instantiated with new Macy
   */
  if (!(this instanceof Macy)) {
    return new Macy(opts)
  }

  this.options = {};
  Object.assign(this.options, defaults, opts);
  // this.options = opts;
  this.container = $e(opts.container);
  this.queue = new Queue();
  this.events = new EventsManager(this);
  // Checks if container element exists
  if (this.container instanceof $e || !this.container) {
    return opts.debug ? console.error('Error: Container not found') : false;
  }

  // Remove container selector from the options
  delete this.options.container;

  if (this.container.length) {
    this.container = this.container[0];
  }

  this.container.style.position = 'relative';
  this.rows = [];

  let imgs = $e('img', this.container);

  this.resizer = wait(() => {
    this.emit(this.constants.EVENT_RESIZE);
    this.queue.add(() => this.recalculate(true, true));
  }, 100);

  window.addEventListener('resize', this.resizer);
  this.on(this.constants.EVENT_IMAGE_LOAD, () => this.recalculate(false, false));
  this.on(this.constants.EVENT_IMAGE_COMPLETE, () => this.recalculate(true, true));
  // imagesLoaded(imgs, null, finishedLoading)

  if (!opts.useOwnImageLoader) {
    // console.log('here');
    imagesLoadedNew(this, imgs, !opts.waitForImages);
  }

  this.emit(this.constants.EVENT_INITIALIZED);
};

Macy.init = function (options) {
  console.warn('Depreciated: Macy.init will be removed in v3.0.0 opt to use Macy directly like so Macy({ /*options here*/ }) ');
  return new Macy(options);
};

/**
 * Public method for recalculating image positions when the images have loaded.
 * @param  {Boolean} waitUntilFinish - if true it will not recalculate until all images are finished loading
 * @param  {Boolean} refresh         - If true it will recalculate the entire container instead of just new elements.
 */
Macy.prototype.recalculateOnImageLoad = function (waitUntilFinish = false, refresh = false) {
  let imgs = $e('img', this.container);
  return imagesLoadedNew(this, imgs, !waitUntilFinish);
};

/**
 * Run a function on every image load or once all images are loaded
 * @param  {Function}  func      - Function to run on image load
 * @param  {Boolean} everyLoad   - If true it will run everytime an image loads
 */
Macy.prototype.runOnImageLoad = function (func, everyLoad = false) {
  let imgs = $e('img', this.container);
  this.on(this.constants.EVENT_IMAGE_COMPLETE, func);

  if (everyLoad) {
    this.on(this.constants.EVENT_IMAGE_LOAD, func);
  }

  return imagesLoadedNew(this, imgs, everyLoad);
};

/**
 * Recalculates masonory positions
 * @param  {Boolean} refresh - Recalculates All elements within the container
 * @param  {Boolean} loaded  - When true it sets the recalculated elements to be marked as complete
 */
Macy.prototype.recalculate = function (refresh = false, loaded = true) {
  if (loaded) {
    this.queue.clear();
  }

  return this.queue.add(() => calculate(this, refresh, loaded));
};

/**
 * Destroys macy instance
 */
Macy.prototype.remove = function () {
  window.removeEventListener('resize', this.resizer);

  this.container.children.forEach((child) => {
    child.removeAttribute('data-macy-complete');
    child.removeAttribute('style');
  });

  this.container.removeAttribute('style');
};

/**
 * ReInitializes the macy instance using the already defined options
 */
Macy.prototype.reInit = function () {
  this.recalculate(true, true);
  this.emit(this.constants.EVENT_INITIALIZED);
  window.addEventListener('resize', this.resizer);
};

Macy.prototype.on = function (key, func) {
  this.events.on(key, func);
};

Macy.prototype.emit = function (key) {
  this.events.emit(key);
};

Macy.prototype.constants = {
  EVENT_INITIALIZED: 'macy.initialized',
  EVENT_RECALCULATED: 'macy.recalculated',
  EVENT_IMAGE_LOAD: 'macy.images.load',
  EVENT_IMAGE_COMPLETE: 'macy.images.complete',
  EVENT_RESIZE: 'macy.resize'
};

/**
 * Export Macy
 */
// module.exports = Macy;
export default Macy;
