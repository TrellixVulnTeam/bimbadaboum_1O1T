/*! @license Firebase v4.5.0
Build: rev-f49c8b5
Terms: https://firebase.google.com/terms/ */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DocReference = exports.ReferenceSet = undefined;

var _collections = require('../model/collections');

var _document_key = require('../model/document_key');

var _misc = require('../util/misc');

var _sorted_set = require('../util/sorted_set');

var _persistence_promise = require('./persistence_promise');

/**
 * A collection of references to a document from some kind of numbered entity
 * (either a target ID or batch ID). As references are added to or removed from
 * the set corresponding events are emitted to a registered garbage collector.
 *
 * Each reference is represented by a DocumentReference object. Each of them
 * contains enough information to uniquely identify the reference. They are all
 * stored primarily in a set sorted by key. A document is considered garbage if
 * there's no references in that set (this can be efficiently checked thanks to
 * sorting by key).
 *
 * ReferenceSet also keeps a secondary set that contains references sorted by
 * IDs. This one is used to efficiently implement removal of all references by
 * some target ID.
 */
var ReferenceSet = /** @class */function () {
    function ReferenceSet() {
        // A set of outstanding references to a document sorted by key.
        this.refsByKey = new _sorted_set.SortedSet(DocReference.compareByKey);
        // A set of outstanding references to a document sorted by target id.
        this.refsByTarget = new _sorted_set.SortedSet(DocReference.compareByTargetId);
        /** Keeps track of keys that have references */
        this.garbageCollector = null;
    }
    /** Returns true if the reference set contains no references. */
    ReferenceSet.prototype.isEmpty = function () {
        return this.refsByKey.isEmpty();
    };
    /** Adds a reference to the given document key for the given ID. */
    ReferenceSet.prototype.addReference = function (key, id) {
        var ref = new DocReference(key, id);
        this.refsByKey = this.refsByKey.add(ref);
        this.refsByTarget = this.refsByTarget.add(ref);
    };
    /** Add references to the given document keys for the given ID. */
    ReferenceSet.prototype.addReferences = function (keys, id) {
        var _this = this;
        keys.forEach(function (key) {
            return _this.addReference(key, id);
        });
    };
    /**
     * Removes a reference to the given document key for the given
     * ID.
     */
    ReferenceSet.prototype.removeReference = function (key, id) {
        this.removeRef(new DocReference(key, id));
    };
    ReferenceSet.prototype.removeReferences = function (keys, id) {
        var _this = this;
        keys.forEach(function (key) {
            return _this.removeReference(key, id);
        });
    };
    /**
     * Clears all references with a given ID. Calls removeRef() for each key
     * removed.
     */
    ReferenceSet.prototype.removeReferencesForId = function (id) {
        var _this = this;
        var emptyKey = _document_key.DocumentKey.EMPTY;
        var startRef = new DocReference(emptyKey, id);
        var endRef = new DocReference(emptyKey, id + 1);
        this.refsByTarget.forEachInRange([startRef, endRef], function (ref) {
            _this.removeRef(ref);
        });
    };
    ReferenceSet.prototype.removeAllReferences = function () {
        var _this = this;
        this.refsByKey.forEach(function (ref) {
            return _this.removeRef(ref);
        });
    };
    ReferenceSet.prototype.removeRef = function (ref) {
        this.refsByKey = this.refsByKey.delete(ref);
        this.refsByTarget = this.refsByTarget.delete(ref);
        if (this.garbageCollector !== null) {
            this.garbageCollector.addPotentialGarbageKey(ref.key);
        }
    };
    ReferenceSet.prototype.referencesForId = function (id) {
        var emptyKey = _document_key.DocumentKey.EMPTY;
        var startRef = new DocReference(emptyKey, id);
        var endRef = new DocReference(emptyKey, id + 1);
        var keys = (0, _collections.documentKeySet)();
        this.refsByTarget.forEachInRange([startRef, endRef], function (ref) {
            keys = keys.add(ref.key);
        });
        return keys;
    };
    ReferenceSet.prototype.setGarbageCollector = function (garbageCollector) {
        this.garbageCollector = garbageCollector;
    };
    ReferenceSet.prototype.containsKey = function (txn, key) {
        var ref = new DocReference(key, 0);
        var firstRef = this.refsByKey.firstAfterOrEqual(ref);
        return _persistence_promise.PersistencePromise.resolve(firstRef !== null && key.equals(firstRef.key));
    };
    return ReferenceSet;
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
exports.ReferenceSet = ReferenceSet;

var DocReference = /** @class */function () {
    function DocReference(key, targetOrBatchId) {
        this.key = key;
        this.targetOrBatchId = targetOrBatchId;
    }
    /** Compare by key then by ID */
    DocReference.compareByKey = function (left, right) {
        return _document_key.DocumentKey.comparator(left.key, right.key) || (0, _misc.primitiveComparator)(left.targetOrBatchId, right.targetOrBatchId);
    };
    /** Compare by ID then by key */
    DocReference.compareByTargetId = function (left, right) {
        return (0, _misc.primitiveComparator)(left.targetOrBatchId, right.targetOrBatchId) || _document_key.DocumentKey.comparator(left.key, right.key);
    };
    return DocReference;
}();
exports.DocReference = DocReference;
//# sourceMappingURL=reference_set.js.map
