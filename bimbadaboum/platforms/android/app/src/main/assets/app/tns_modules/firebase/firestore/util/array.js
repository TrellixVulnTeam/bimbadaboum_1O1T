/*! @license Firebase v4.5.0
Build: rev-f49c8b5
Terms: https://firebase.google.com/terms/ */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.includes = includes;
exports.some = some;
exports.forEachType = forEachType;
exports.findIndex = findIndex;
/**
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
/**
 * Returns true iff the array contains the value using strong equality.
 */
function includes(array, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === value) return true;
    }
    return false;
}
/**
 * Returns true iff the array contains any value mathching the predicate
 */
function some(array, predicate) {
    for (var i = 0; i < array.length; i++) {
        if (predicate(array[i])) return true;
    }
    return false;
}
/**
 * Calls a fn for each element in an array that is an instance of a provided
 * class/function.
 */
function forEachType(array, type, fn, thisArg) {
    array.forEach(function (value) {
        if (value instanceof type) {
            fn.call(thisArg, value);
        }
    });
}
/**
 * Calls predicate function for each item in the array until the predicate
 * returns true, at which point the index of that item is returned.  If the
 * predicate does not return true for any item, null is returned.
 */
function findIndex(array, predicate) {
    for (var i = 0; i < array.length; i++) {
        if (predicate(array[i])) {
            return i;
        }
    }
    return null;
}
//# sourceMappingURL=array.js.map
