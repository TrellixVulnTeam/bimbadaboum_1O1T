/*! @license Firebase v4.5.0
Build: rev-f49c8b5
Terms: https://firebase.google.com/terms/ */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DOMStorageWrapper = undefined;

var _json = require('../../../utils/json');

/**
 * Wraps a DOM Storage object and:
 * - automatically encode objects as JSON strings before storing them to allow us to store arbitrary types.
 * - prefixes names with "firebase:" to avoid collisions with app data.
 *
 * We automatically (see storage.js) create two such wrappers, one for sessionStorage,
 * and one for localStorage.
 *
 * @constructor
 */
var DOMStorageWrapper = /** @class */function () {
    /**
     * @param {Storage} domStorage_ The underlying storage object (e.g. localStorage or sessionStorage)
     */
    function DOMStorageWrapper(domStorage_) {
        this.domStorage_ = domStorage_;
        // Use a prefix to avoid collisions with other stuff saved by the app.
        this.prefix_ = 'firebase:';
    }
    /**
     * @param {string} key The key to save the value under
     * @param {?Object} value The value being stored, or null to remove the key.
     */
    DOMStorageWrapper.prototype.set = function (key, value) {
        if (value == null) {
            this.domStorage_.removeItem(this.prefixedName_(key));
        } else {
            this.domStorage_.setItem(this.prefixedName_(key), (0, _json.stringify)(value));
        }
    };
    /**
     * @param {string} key
     * @return {*} The value that was stored under this key, or null
     */
    DOMStorageWrapper.prototype.get = function (key) {
        var storedVal = this.domStorage_.getItem(this.prefixedName_(key));
        if (storedVal == null) {
            return null;
        } else {
            return (0, _json.jsonEval)(storedVal);
        }
    };
    /**
     * @param {string} key
     */
    DOMStorageWrapper.prototype.remove = function (key) {
        this.domStorage_.removeItem(this.prefixedName_(key));
    };
    /**
     * @param {string} name
     * @return {string}
     */
    DOMStorageWrapper.prototype.prefixedName_ = function (name) {
        return this.prefix_ + name;
    };
    DOMStorageWrapper.prototype.toString = function () {
        return this.domStorage_.toString();
    };
    return DOMStorageWrapper;
}(); /**
      * Copyright 2017 Google Inc.
      *
      * Licensed under the Apache License, Version 2.0 (the "License");
      * you may not use this file except in compliance with the License.
      * You may obtain a copy of the License at
      *
      *   http://www.apache.org/licenses/LICENSE-2.0
      *
      * Unless required by applicable law or agreed to in writing, software
      * distributed under the License is distributed on an "AS IS" BASIS,
      * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
      * See the License for the specific language governing permissions and
      * limitations under the License.
      */
exports.DOMStorageWrapper = DOMStorageWrapper;
//# sourceMappingURL=DOMStorageWrapper.js.map
