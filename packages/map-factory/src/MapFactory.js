export class MapFactory {
  /**
   * Create a new MapFactory
   * @param {callable} factory - The factory method to use when assigning new values
   * @param {any} defaultParams - The default parameters passed to the factory method (along with the key)
   */
  constructor(factory, defaultParams = {}) {
    if (typeof factory !== "function") {
      throw new TypeError(
        "MapFactory requires a function as the first parameter."
      );
    }

    this.factory = (...params) => factory(...params);
    this.defaultParams = defaultParams;
    this.map = new Map();
  }

  /**
   * Get or create a factory element
   * Throws an exception if the element is not defined
   *
   * @param {string} key - The key to attempt to get
   */
  get(key, defaultParams = {}, useFactory = true) {
    // If we don't yet have an entry for this key
    if (!this.map.has(key)) {
      // Create one with the factory using the defaultParams
      this.set(key, { ...this.defaultParams, ...defaultParams }, useFactory);
    }
    // Return the entry for this key
    return this.map.get(key);
  }

  /**
   * Check if a key is defined within the Map
   *
   * @param {string} key - The key to check
   */
  has(key) {
    return this.map.has(key);
  }

  /**
   * Assign a value to a key in the Map
   *
   * By default, the key and value are provided as arguments to the factory method
   * and this output is assigned to the map.
   *
   * @param {string} key - The key to define
   * @param {any} value - The value to use
   * @param {boolean} useFactory - Whether or not to use the factory when assigning the value
   */
  set(key, value = {}, useFactory = true) {
    if (useFactory) {
      value = this.factory(value, key);
    }
    return this.map.set(key, value);
  }

  /**
   * Reset the map, removing all assigned values
   */
  reset() {
    this.map = new Map();
  }

  /**
   * Get the size of the map
   */
  size() {
    return this.map.size;
  }

  /**
   * (Re)assign the factory method to use when assigning new values
   *
   * @param {callable} factory - The factory method to assign
   */
  setFactory(factory) {
    this.factory = (...params) => factory(...params);
  }

  /**
   * (Re)assign the default params to use when assigning new values
   *
   * @param {any} defaultParams - The params to assign as the default
   */
  setDefaultParams(defaultParams = {}) {
    this.defaultParams = defaultParams;
  }
}
export default MapFactory;
