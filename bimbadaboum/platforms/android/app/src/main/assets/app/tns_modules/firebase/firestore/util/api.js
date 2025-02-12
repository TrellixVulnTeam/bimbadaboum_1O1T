/*! @license Firebase v4.5.0
Build: rev-f49c8b5
Terms: https://firebase.google.com/terms/ */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.makeConstructorPrivate = makeConstructorPrivate;

var _error = require('./error');

/**
 * Helper function to prevent instantiation through the constructor.
 *
 * This method creates a new constructor that throws when it's invoked.
 * The prototype of that constructor is then set to the prototype of the hidden
 * "class" to expose all the prototype methods and allow for instanceof
 * checks.
 *
 * To also make all the static methods available, all properties of the
 * original constructor are copied to the new constructor.
 */
function makeConstructorPrivate(cls, optionalMessage) {
    function PublicConstructor() {
        var error = 'This constructor is private.';
        if (optionalMessage) {
            error += ' ';
            error += optionalMessage;
        }
        throw new _error.FirestoreError(_error.Code.INVALID_ARGUMENT, error);
    }
    // Make sure instanceof checks work and all methods are exposed on the public
    // constructor
    PublicConstructor.prototype = cls.prototype;
    // Copy any static methods/members
    for (var staticProperty in cls) {
        if (cls.hasOwnProperty(staticProperty)) {
            PublicConstructor[staticProperty] = cls[staticProperty];
        }
    }
    return PublicConstructor;
} /**
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
// We are doing some heavy reflective stuff, lots of any casting necessary
/* tslint:disable:no-any */
//# sourceMappingURL=api.js.map
