/*! @license Firebase v4.5.0
Build: rev-f49c8b5
Terms: https://firebase.google.com/terms/ */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.maybeDocumentMap = maybeDocumentMap;
exports.documentMap = documentMap;
exports.documentVersionMap = documentVersionMap;
exports.documentKeySet = documentKeySet;

var _sorted_map = require('../util/sorted_map');

var _sorted_set = require('../util/sorted_set');

var _document_key = require('./document_key');

var EMPTY_MAYBE_DOCUMENT_MAP = new _sorted_map.SortedMap(_document_key.DocumentKey.comparator); /**
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
function maybeDocumentMap() {
    return EMPTY_MAYBE_DOCUMENT_MAP;
}
var EMPTY_DOCUMENT_MAP = new _sorted_map.SortedMap(_document_key.DocumentKey.comparator);
function documentMap() {
    return EMPTY_DOCUMENT_MAP;
}
var EMPTY_DOCUMENT_VERSION_MAP = new _sorted_map.SortedMap(_document_key.DocumentKey.comparator);
function documentVersionMap() {
    return EMPTY_DOCUMENT_VERSION_MAP;
}
var EMPTY_DOCUMENT_KEY_SET = new _sorted_set.SortedSet(_document_key.DocumentKey.comparator);
function documentKeySet() {
    return EMPTY_DOCUMENT_KEY_SET;
}
//# sourceMappingURL=collections.js.map
