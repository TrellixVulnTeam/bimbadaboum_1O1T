/*! @license Firebase v4.5.0
Build: rev-f49c8b5
Terms: https://firebase.google.com/terms/ */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.JsonProtoSerializer = undefined;

var _blob = require('../api/blob');

var _geo_point = require('../api/geo_point');

var _database_info = require('../core/database_info');

var _query = require('../core/query');

var _snapshot_version = require('../core/snapshot_version');

var _timestamp = require('../core/timestamp');

var _query_data = require('../local/query_data');

var _document = require('../model/document');

var _document_key = require('../model/document_key');

var _field_value = require('../model/field_value');

var fieldValue = _interopRequireWildcard(_field_value);

var _mutation = require('../model/mutation');

var _path = require('../model/path');

var _assert = require('../util/assert');

var _error = require('../util/error');

var _obj = require('../util/obj');

var obj = _interopRequireWildcard(_obj);

var _types = require('../util/types');

var typeUtils = _interopRequireWildcard(_types);

var _existence_filter = require('./existence_filter');

var _rpc_error = require('./rpc_error');

var _watch_change = require('./watch_change');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var DIRECTIONS = function () {
    var dirs = {};
    dirs[_query.Direction.ASCENDING.name] = 'ASCENDING';
    dirs[_query.Direction.DESCENDING.name] = 'DESCENDING';
    return dirs;
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

var OPERATORS = function () {
    var ops = {};
    ops[_query.RelationOp.LESS_THAN.name] = 'LESS_THAN';
    ops[_query.RelationOp.LESS_THAN_OR_EQUAL.name] = 'LESS_THAN_OR_EQUAL';
    ops[_query.RelationOp.GREATER_THAN.name] = 'GREATER_THAN';
    ops[_query.RelationOp.GREATER_THAN_OR_EQUAL.name] = 'GREATER_THAN_OR_EQUAL';
    ops[_query.RelationOp.EQUAL.name] = 'EQUAL';
    return ops;
}();
function assertPresent(value, description) {
    (0, _assert.assert)(!typeUtils.isNullOrUndefined(value), description + ' is missing');
}
function parseInt64(value) {
    // TODO(bjornick): Handle int64 greater than 53 bits.
    if (typeof value === 'number') {
        return value;
    } else if (typeof value === 'string') {
        return parseInt(value, 10);
    } else {
        return (0, _assert.fail)("can't parse " + value);
    }
}
/**
 * Generates JsonObject values for the Datastore API suitable for sending to
 * either GRPC stub methods or via the JSON/HTTP REST API.
 * TODO(klimt): We can remove the databaseId argument if we keep the full
 * resource name in documents.
 */
var JsonProtoSerializer = /** @class */function () {
    function JsonProtoSerializer(databaseId, options) {
        this.databaseId = databaseId;
        this.options = options;
    }
    JsonProtoSerializer.prototype.emptyByteString = function () {
        if (this.options.useProto3Json) {
            return '';
        } else {
            return new Uint8Array(0);
        }
    };
    JsonProtoSerializer.prototype.unsafeCastProtoByteString = function (byteString) {
        // byteStrings can be either string or UInt8Array, but the typings say
        // it's always a string. Cast as string to avoid type check failing
        return byteString;
    };
    JsonProtoSerializer.prototype.fromRpcStatus = function (status) {
        var code = status.code === undefined ? _error.Code.UNKNOWN : (0, _rpc_error.mapCodeFromRpcCode)(status.code);
        return new _error.FirestoreError(code, status.message || '');
    };
    /**
     * Returns a value for a Date that's appropriate to put into a proto.
     * DO NOT USE THIS FOR ANYTHING ELSE.
     * This method cheats. It's typed as returning "string" because that's what
     * our generated proto interfaces say dates must be. But it's easier and safer
     * to actually return a Timestamp proto.
     */
    JsonProtoSerializer.prototype.toTimestamp = function (timestamp) {
        return {
            seconds: timestamp.seconds,
            nanos: timestamp.nanos
            // tslint:disable-next-line:no-any
        };
    };
    JsonProtoSerializer.prototype.fromTimestamp = function (date) {
        // The json interface (for the browser) will return an iso timestamp string,
        // while the proto js library (for node) will return a
        // google.protobuf.Timestamp instance.
        if (typeof date === 'string') {
            // TODO(b/37282237): Use strings for Proto3 timestamps
            // assert(this.options.useProto3Json,
            //   'The timestamp string format requires Proto3.');
            return _timestamp.Timestamp.fromISOString(date);
        } else {
            (0, _assert.assert)(!!date, 'Cannot deserialize null or undefined timestamp.');
            // TODO(b/37282237): Use strings for Proto3 timestamps
            // assert(!this.options.useProto3Json,
            //   'The timestamp instance format requires Proto JS.');
            var seconds = parseInt64(date.seconds || '0');
            var nanos = date.nanos || 0;
            return new _timestamp.Timestamp(seconds, nanos);
        }
    };
    /**
     * Returns a value for bytes that's appropriate to put in a proto.
     * DO NOT USE THIS FOR ANYTHING ELSE.
     * This method cheats. It's typed as returning "string" because that's what
     * our generated proto interfaces say bytes must be. But it should return
     * an Uint8Array in Node.
     */
    JsonProtoSerializer.prototype.toBytes = function (bytes) {
        if (this.options.useProto3Json) {
            return bytes.toBase64();
        } else {
            // The typings say it's a string, but it needs to be a Uint8Array in Node.
            return this.unsafeCastProtoByteString(bytes.toUint8Array());
        }
    };
    /**
     * Parse the blob from the protos into the internal Blob class. Note that the
     * typings assume all blobs are strings, but they are actually Uint8Arrays
     * on Node.
     */
    JsonProtoSerializer.prototype.fromBlob = function (blob) {
        if (typeof blob === 'string') {
            (0, _assert.assert)(this.options.useProto3Json, 'Expected bytes to be passed in as Uint8Array, but got a string instead.');
            return _blob.Blob.fromBase64String(blob);
        } else {
            (0, _assert.assert)(!this.options.useProto3Json, 'Expected bytes to be passed in as string, but got something else instead.');
            return _blob.Blob.fromUint8Array(blob);
        }
    };
    JsonProtoSerializer.prototype.toVersion = function (version) {
        return this.toTimestamp(version.toTimestamp());
    };
    JsonProtoSerializer.prototype.fromVersion = function (version) {
        (0, _assert.assert)(!!version, "Trying to deserialize version that isn't set");
        return _snapshot_version.SnapshotVersion.fromTimestamp(this.fromTimestamp(version));
    };
    JsonProtoSerializer.prototype.toResourceName = function (databaseId, path) {
        return this.fullyQualifiedPrefixPath(databaseId).child('documents').child(path).canonicalString();
    };
    JsonProtoSerializer.prototype.fromResourceName = function (name) {
        var resource = _path.ResourcePath.fromString(name);
        (0, _assert.assert)(this.isValidResourceName(resource), 'Tried to deserialize invalid key ' + resource.toString());
        return resource;
    };
    JsonProtoSerializer.prototype.toName = function (key) {
        return this.toResourceName(this.databaseId, key.path);
    };
    JsonProtoSerializer.prototype.fromName = function (name) {
        var resource = this.fromResourceName(name);
        (0, _assert.assert)(resource.get(1) === this.databaseId.projectId, 'Tried to deserialize key from different project: ' + resource.get(1) + ' vs ' + this.databaseId.projectId);
        (0, _assert.assert)(!resource.get(3) && !this.databaseId.database || resource.get(3) === this.databaseId.database, 'Tried to deserialize key from different database: ' + resource.get(3) + ' vs ' + this.databaseId.database);
        return new _document_key.DocumentKey(this.extractLocalPathFromResourceName(resource));
    };
    JsonProtoSerializer.prototype.toQueryPath = function (path) {
        if (path.length === 0) {
            // If the path is empty, the backend requires we leave off the /documents
            // at the end.
            return this.encodedDatabaseId;
        }
        return this.toResourceName(this.databaseId, path);
    };
    JsonProtoSerializer.prototype.fromQueryPath = function (name) {
        var resourceName = this.fromResourceName(name);
        if (resourceName.length === 4) {
            return _path.ResourcePath.EMPTY_PATH;
        }
        return this.extractLocalPathFromResourceName(resourceName);
    };
    Object.defineProperty(JsonProtoSerializer.prototype, "encodedDatabaseId", {
        get: function get() {
            var path = new _path.ResourcePath(['projects', this.databaseId.projectId, 'databases', this.databaseId.database]);
            return path.canonicalString();
        },
        enumerable: true,
        configurable: true
    });
    JsonProtoSerializer.prototype.fullyQualifiedPrefixPath = function (databaseId) {
        return new _path.ResourcePath(['projects', databaseId.projectId, 'databases', databaseId.database]);
    };
    JsonProtoSerializer.prototype.extractLocalPathFromResourceName = function (resourceName) {
        (0, _assert.assert)(resourceName.length > 4 && resourceName.get(4) === 'documents', 'tried to deserialize invalid key ' + resourceName.toString());
        return resourceName.popFirst(5);
    };
    JsonProtoSerializer.prototype.isValidResourceName = function (path) {
        // Resource names have at least 4 components (project ID, database ID)
        return path.length >= 4 && path.get(0) === 'projects' && path.get(2) === 'databases';
    };
    JsonProtoSerializer.prototype.toValue = function (val) {
        if (val instanceof fieldValue.NullValue) {
            return { nullValue: 'NULL_VALUE' };
        } else if (val instanceof fieldValue.BooleanValue) {
            return { booleanValue: val.value() };
        } else if (val instanceof fieldValue.IntegerValue) {
            return { integerValue: '' + val.value() };
        } else if (val instanceof fieldValue.DoubleValue) {
            var doubleValue = val.value();
            if (this.options.useProto3Json) {
                // Proto 3 let's us encode NaN and Infinity as string values as
                // expected by the backend. This is currently not checked by our unit
                // tests because they rely on protobuf.js.
                if (isNaN(doubleValue)) {
                    return { doubleValue: 'NaN' };
                } else if (doubleValue === Infinity) {
                    return { doubleValue: 'Infinity' };
                } else if (doubleValue === -Infinity) {
                    return { doubleValue: '-Infinity' };
                }
            }
            return { doubleValue: val.value() };
        } else if (val instanceof fieldValue.StringValue) {
            return { stringValue: val.value() };
        } else if (val instanceof fieldValue.ObjectValue) {
            return { mapValue: this.toMapValue(val) };
        } else if (val instanceof fieldValue.ArrayValue) {
            return { arrayValue: this.toArrayValue(val) };
        } else if (val instanceof fieldValue.TimestampValue) {
            return {
                timestampValue: this.toTimestamp(val.internalValue)
            };
        } else if (val instanceof fieldValue.GeoPointValue) {
            return {
                geoPointValue: {
                    latitude: val.value().latitude,
                    longitude: val.value().longitude
                }
            };
        } else if (val instanceof fieldValue.BlobValue) {
            return {
                bytesValue: this.toBytes(val.value())
            };
        } else if (val instanceof fieldValue.RefValue) {
            return {
                referenceValue: this.toResourceName(val.databaseId, val.key.path)
            };
        } else {
            return (0, _assert.fail)('Unknown FieldValue ' + JSON.stringify(val));
        }
    };
    JsonProtoSerializer.prototype.fromValue = function (obj) {
        var _this = this;
        // tslint:disable-next-line:no-any
        var type = obj['value_type'];
        if (hasTag(obj, type, 'nullValue')) {
            return fieldValue.NullValue.INSTANCE;
        } else if (hasTag(obj, type, 'booleanValue')) {
            return fieldValue.BooleanValue.of(obj.booleanValue);
        } else if (hasTag(obj, type, 'integerValue')) {
            return new fieldValue.IntegerValue(parseInt64(obj.integerValue));
        } else if (hasTag(obj, type, 'doubleValue')) {
            if (this.options.useProto3Json) {
                // Proto 3 uses the string values 'NaN' and 'Infinity'.
                if (obj.doubleValue === 'NaN') {
                    return fieldValue.DoubleValue.NAN;
                } else if (obj.doubleValue === 'Infinity') {
                    return fieldValue.DoubleValue.POSITIVE_INFINITY;
                } else if (obj.doubleValue === '-Infinity') {
                    return fieldValue.DoubleValue.NEGATIVE_INFINITY;
                }
            }
            return new fieldValue.DoubleValue(obj.doubleValue);
        } else if (hasTag(obj, type, 'stringValue')) {
            return new fieldValue.StringValue(obj.stringValue);
        } else if (hasTag(obj, type, 'mapValue')) {
            return this.fromFields(obj.mapValue.fields || {});
        } else if (hasTag(obj, type, 'arrayValue')) {
            // "values" is not present if the array is empty
            assertPresent(obj.arrayValue, 'arrayValue');
            var values = obj.arrayValue.values || [];
            return new fieldValue.ArrayValue(values.map(function (v) {
                return _this.fromValue(v);
            }));
        } else if (hasTag(obj, type, 'timestampValue')) {
            assertPresent(obj.timestampValue, 'timestampValue');
            return new fieldValue.TimestampValue(this.fromTimestamp(obj.timestampValue));
        } else if (hasTag(obj, type, 'geoPointValue')) {
            assertPresent(obj.geoPointValue, 'geoPointValue');
            var latitude = obj.geoPointValue.latitude || 0;
            var longitude = obj.geoPointValue.longitude || 0;
            return new fieldValue.GeoPointValue(new _geo_point.GeoPoint(latitude, longitude));
        } else if (hasTag(obj, type, 'bytesValue')) {
            assertPresent(obj.bytesValue, 'bytesValue');
            var blob = this.fromBlob(obj.bytesValue);
            return new fieldValue.BlobValue(blob);
        } else if (hasTag(obj, type, 'referenceValue')) {
            assertPresent(obj.referenceValue, 'referenceValue');
            var resourceName = this.fromResourceName(obj.referenceValue);
            var dbId = new _database_info.DatabaseId(resourceName.get(1), resourceName.get(3));
            var key = new _document_key.DocumentKey(this.extractLocalPathFromResourceName(resourceName));
            return new fieldValue.RefValue(dbId, key);
        } else {
            return (0, _assert.fail)('Unknown Value proto ' + JSON.stringify(obj));
        }
    };
    /** Creates an api.Document from key and fields (but no create/update time) */
    JsonProtoSerializer.prototype.toMutationDocument = function (key, fields) {
        return {
            name: this.toName(key),
            fields: this.toFields(fields)
        };
    };
    JsonProtoSerializer.prototype.toDocument = function (document) {
        (0, _assert.assert)(!document.hasLocalMutations, "Can't serialize documents with mutations.");
        return {
            name: this.toName(document.key),
            fields: this.toFields(document.data),
            updateTime: this.toTimestamp(document.version.toTimestamp())
        };
    };
    JsonProtoSerializer.prototype.fromDocument = function (document) {
        return new _document.Document(this.fromName(document.name), this.fromVersion(document.updateTime), this.fromFields(document.fields || {}), { hasLocalMutations: false });
    };
    JsonProtoSerializer.prototype.toFields = function (fields) {
        var _this = this;
        var result = {};
        fields.forEach(function (key, value) {
            result[key] = _this.toValue(value);
        });
        return result;
    };
    JsonProtoSerializer.prototype.fromFields = function (object) {
        var _this = this;
        // Proto map<string, Value> gets mapped to Object, so cast it.
        var map = object;
        var result = fieldValue.ObjectValue.EMPTY;
        obj.forEach(map, function (key, value) {
            result = result.set(new _path.FieldPath([key]), _this.fromValue(value));
        });
        return result;
    };
    JsonProtoSerializer.prototype.toMapValue = function (map) {
        return {
            fields: this.toFields(map)
        };
    };
    JsonProtoSerializer.prototype.toArrayValue = function (array) {
        var _this = this;
        var result = [];
        array.forEach(function (value) {
            result.push(_this.toValue(value));
        });
        return { values: result };
    };
    JsonProtoSerializer.prototype.fromFound = function (doc) {
        (0, _assert.assert)(!!doc.found, 'Tried to deserialize a found document from a missing document.');
        assertPresent(doc.found.name, 'doc.found.name');
        assertPresent(doc.found.updateTime, 'doc.found.updateTime');
        var key = this.fromName(doc.found.name);
        var version = this.fromVersion(doc.found.updateTime);
        var fields = this.fromFields(doc.found.fields || {});
        return new _document.Document(key, version, fields, { hasLocalMutations: false });
    };
    JsonProtoSerializer.prototype.fromMissing = function (result) {
        (0, _assert.assert)(!!result.missing, 'Tried to deserialize a missing document from a found document.');
        (0, _assert.assert)(!!result.readTime, 'Tried to deserialize a missing document without a read time.');
        var key = this.fromName(result.missing);
        var version = this.fromVersion(result.readTime);
        return new _document.NoDocument(key, version);
    };
    JsonProtoSerializer.prototype.fromMaybeDocument = function (result) {
        // tslint:disable-next-line:no-any
        var type = result['result_type'];
        if (hasTag(result, type, 'found')) {
            return this.fromFound(result);
        } else if (hasTag(result, type, 'missing')) {
            return this.fromMissing(result);
        }
        return (0, _assert.fail)('invalid batch get response: ' + JSON.stringify(result));
    };
    JsonProtoSerializer.prototype.toWatchTargetChangeState = function (state) {
        switch (state) {
            case _watch_change.WatchTargetChangeState.Added:
                return 'ADD';
            case _watch_change.WatchTargetChangeState.Current:
                return 'CURRENT';
            case _watch_change.WatchTargetChangeState.NoChange:
                return 'NO_CHANGE';
            case _watch_change.WatchTargetChangeState.Removed:
                return 'REMOVE';
            case _watch_change.WatchTargetChangeState.Reset:
                return 'RESET';
            default:
                return (0, _assert.fail)('Unknown WatchTargetChangeState: ' + state);
        }
    };
    JsonProtoSerializer.prototype.toTestWatchChange = function (watchChange) {
        if (watchChange instanceof _watch_change.ExistenceFilterChange) {
            return {
                filter: {
                    count: watchChange.existenceFilter.count,
                    targetId: watchChange.targetId
                }
            };
        }
        if (watchChange instanceof _watch_change.DocumentWatchChange) {
            if (watchChange.newDoc instanceof _document.Document) {
                var doc = watchChange.newDoc;
                return {
                    documentChange: {
                        document: {
                            name: this.toName(doc.key),
                            fields: this.toFields(doc.data),
                            updateTime: this.toVersion(doc.version)
                        },
                        targetIds: watchChange.updatedTargetIds,
                        removedTargetIds: watchChange.removedTargetIds
                    }
                };
            } else if (watchChange.newDoc instanceof _document.NoDocument) {
                var doc = watchChange.newDoc;
                return {
                    documentDelete: {
                        document: this.toName(doc.key),
                        readTime: this.toVersion(doc.version),
                        removedTargetIds: watchChange.removedTargetIds
                    }
                };
            } else if (watchChange.newDoc === null) {
                return {
                    documentRemove: {
                        document: this.toName(watchChange.key),
                        removedTargetIds: watchChange.removedTargetIds
                    }
                };
            }
        }
        if (watchChange instanceof _watch_change.WatchTargetChange) {
            var cause = undefined;
            if (watchChange.cause) {
                cause = {
                    code: (0, _rpc_error.mapRpcCodeFromCode)(watchChange.cause.code),
                    message: watchChange.cause.message
                };
            }
            return {
                targetChange: {
                    targetChangeType: this.toWatchTargetChangeState(watchChange.state),
                    targetIds: watchChange.targetIds,
                    resumeToken: this.unsafeCastProtoByteString(watchChange.resumeToken),
                    cause: cause
                }
            };
        }
        return (0, _assert.fail)('Unrecognized watch change: ' + JSON.stringify(watchChange));
    };
    JsonProtoSerializer.prototype.fromWatchChange = function (change) {
        // tslint:disable-next-line:no-any
        var type = change['change_type'];
        var watchChange;
        if (hasTag(change, type, 'targetChange')) {
            assertPresent(change.targetChange, 'targetChange');
            // proto3 default value is unset in JSON (undefined), so use 'NO_CHANGE'
            // if unset
            var state = this.fromWatchTargetChangeState(change.targetChange.targetChangeType || 'NO_CHANGE');
            var targetIds = change.targetChange.targetIds || [];
            var resumeToken = change.targetChange.resumeToken || this.emptyByteString();
            var causeProto = change.targetChange.cause;
            var cause = causeProto && this.fromRpcStatus(causeProto);
            watchChange = new _watch_change.WatchTargetChange(state, targetIds, resumeToken, cause || null);
        } else if (hasTag(change, type, 'documentChange')) {
            assertPresent(change.documentChange, 'documentChange');
            assertPresent(change.documentChange.document, 'documentChange.name');
            assertPresent(change.documentChange.document.name, 'documentChange.document.name');
            assertPresent(change.documentChange.document.updateTime, 'documentChange.document.updateTime');
            var entityChange = change.documentChange;
            var key = this.fromName(entityChange.document.name);
            var version = this.fromVersion(entityChange.document.updateTime);
            var fields = this.fromFields(entityChange.document.fields || {});
            var doc = new _document.Document(key, version, fields, {
                hasLocalMutations: false
            });
            var updatedTargetIds = entityChange.targetIds || [];
            var removedTargetIds = entityChange.removedTargetIds || [];
            watchChange = new _watch_change.DocumentWatchChange(updatedTargetIds, removedTargetIds, doc.key, doc);
        } else if (hasTag(change, type, 'documentDelete')) {
            assertPresent(change.documentDelete, 'documentDelete');
            assertPresent(change.documentDelete.document, 'documentDelete.document');
            var docDelete = change.documentDelete;
            var key = this.fromName(docDelete.document);
            var version = docDelete.readTime ? this.fromVersion(docDelete.readTime) : _snapshot_version.SnapshotVersion.forDeletedDoc();
            var doc = new _document.NoDocument(key, version);
            var removedTargetIds = docDelete.removedTargetIds || [];
            watchChange = new _watch_change.DocumentWatchChange([], removedTargetIds, doc.key, doc);
        } else if (hasTag(change, type, 'documentRemove')) {
            assertPresent(change.documentRemove, 'documentRemove');
            assertPresent(change.documentRemove.document, 'documentRemove');
            var docRemove = change.documentRemove;
            var key = this.fromName(docRemove.document);
            var removedTargetIds = docRemove.removedTargetIds || [];
            watchChange = new _watch_change.DocumentWatchChange([], removedTargetIds, key, null);
        } else if (hasTag(change, type, 'filter')) {
            // TODO(dimond): implement existence filter parsing with strategy.
            assertPresent(change.filter, 'filter');
            assertPresent(change.filter.targetId, 'filter.targetId');
            var filter = change.filter;
            var count = filter.count || 0;
            var existenceFilter = new _existence_filter.ExistenceFilter(count);
            var targetId = filter.targetId;
            watchChange = new _watch_change.ExistenceFilterChange(targetId, existenceFilter);
        } else {
            return (0, _assert.fail)('Unknown change type ' + JSON.stringify(change));
        }
        return watchChange;
    };
    JsonProtoSerializer.prototype.fromWatchTargetChangeState = function (state) {
        if (state === 'NO_CHANGE') {
            return _watch_change.WatchTargetChangeState.NoChange;
        } else if (state === 'ADD') {
            return _watch_change.WatchTargetChangeState.Added;
        } else if (state === 'REMOVE') {
            return _watch_change.WatchTargetChangeState.Removed;
        } else if (state === 'CURRENT') {
            return _watch_change.WatchTargetChangeState.Current;
        } else if (state === 'RESET') {
            return _watch_change.WatchTargetChangeState.Reset;
        } else {
            return (0, _assert.fail)('Got unexpected TargetChange.state: ' + state);
        }
    };
    JsonProtoSerializer.prototype.versionFromListenResponse = function (change) {
        // We have only reached a consistent snapshot for the entire stream if there
        // is a read_time set and it applies to all targets (i.e. the list of
        // targets is empty). The backend is guaranteed to send such responses.
        // tslint:disable-next-line:no-any
        var type = change['response_type'];
        if (!hasTag(change, type, 'targetChange')) {
            return _snapshot_version.SnapshotVersion.MIN;
        }
        var targetChange = change.targetChange;
        if (targetChange.targetIds && targetChange.targetIds.length) {
            return _snapshot_version.SnapshotVersion.MIN;
        }
        if (!targetChange.readTime) {
            return _snapshot_version.SnapshotVersion.MIN;
        }
        return this.fromVersion(targetChange.readTime);
    };
    JsonProtoSerializer.prototype.toMutation = function (mutation) {
        var _this = this;
        var result;
        if (mutation instanceof _mutation.SetMutation) {
            result = {
                update: this.toMutationDocument(mutation.key, mutation.value)
            };
        } else if (mutation instanceof _mutation.DeleteMutation) {
            result = { delete: this.toName(mutation.key) };
        } else if (mutation instanceof _mutation.PatchMutation) {
            result = {
                update: this.toMutationDocument(mutation.key, mutation.data),
                updateMask: this.toDocumentMask(mutation.fieldMask)
            };
        } else if (mutation instanceof _mutation.TransformMutation) {
            result = {
                transform: {
                    document: this.toName(mutation.key),
                    fieldTransforms: mutation.fieldTransforms.map(function (transform) {
                        return _this.toFieldTransform(transform);
                    })
                }
            };
        } else {
            return (0, _assert.fail)('Unknown mutation type ' + mutation.type);
        }
        if (!mutation.precondition.isNone) {
            result.currentDocument = this.toPrecondition(mutation.precondition);
        }
        return result;
    };
    JsonProtoSerializer.prototype.fromMutation = function (proto) {
        var _this = this;
        var precondition = proto.currentDocument ? this.fromPrecondition(proto.currentDocument) : _mutation.Precondition.NONE;
        if (proto.update) {
            assertPresent(proto.update.name, 'name');
            var key = this.fromName(proto.update.name);
            var value = this.fromFields(proto.update.fields || {});
            if (proto.updateMask) {
                var fieldMask = this.fromDocumentMask(proto.updateMask);
                return new _mutation.PatchMutation(key, value, fieldMask, precondition);
            } else {
                return new _mutation.SetMutation(key, value, precondition);
            }
        } else if (proto.delete) {
            var key = this.fromName(proto.delete);
            return new _mutation.DeleteMutation(key, precondition);
        } else if (proto.transform) {
            var key = this.fromName(proto.transform.document);
            var fieldTransforms = proto.transform.fieldTransforms.map(function (transform) {
                return _this.fromFieldTransform(transform);
            });
            (0, _assert.assert)(precondition.exists === true, 'Transforms only support precondition "exists == true"');
            return new _mutation.TransformMutation(key, fieldTransforms);
        } else {
            return (0, _assert.fail)('unknown mutation proto: ' + JSON.stringify(proto));
        }
    };
    JsonProtoSerializer.prototype.toPrecondition = function (precondition) {
        (0, _assert.assert)(!precondition.isNone, "Can't serialize an empty precondition");
        if (precondition.updateTime !== undefined) {
            return {
                updateTime: this.toVersion(precondition.updateTime)
            };
        } else if (precondition.exists !== undefined) {
            return { exists: precondition.exists };
        } else {
            return (0, _assert.fail)('Unknown precondition');
        }
    };
    JsonProtoSerializer.prototype.fromPrecondition = function (precondition) {
        if (precondition.updateTime !== undefined) {
            return _mutation.Precondition.updateTime(this.fromVersion(precondition.updateTime));
        } else if (precondition.exists !== undefined) {
            return _mutation.Precondition.exists(precondition.exists);
        } else {
            return _mutation.Precondition.NONE;
        }
    };
    JsonProtoSerializer.prototype.fromWriteResult = function (proto) {
        var _this = this;
        // NOTE: Deletes don't have an updateTime.
        var version = proto.updateTime ? this.fromVersion(proto.updateTime) : null;
        var transformResults = null;
        if (proto.transformResults) {
            transformResults = proto.transformResults.map(function (result) {
                return _this.fromValue(result);
            });
        }
        return new _mutation.MutationResult(version, transformResults);
    };
    JsonProtoSerializer.prototype.fromWriteResults = function (protos) {
        var _this = this;
        return (protos || []).map(function (proto) {
            return _this.fromWriteResult(proto);
        });
    };
    JsonProtoSerializer.prototype.toFieldTransform = function (fieldTransform) {
        (0, _assert.assert)(fieldTransform.transform instanceof _mutation.ServerTimestampTransform, 'Unknown transform: ' + fieldTransform.transform);
        return {
            fieldPath: fieldTransform.field.canonicalString(),
            setToServerValue: 'REQUEST_TIME'
        };
    };
    JsonProtoSerializer.prototype.fromFieldTransform = function (proto) {
        (0, _assert.assert)(proto.setToServerValue === 'REQUEST_TIME', 'Unknown transform proto: ' + JSON.stringify(proto));
        var fieldPath = _path.FieldPath.fromServerFormat(proto.fieldPath);
        return new _mutation.FieldTransform(fieldPath, _mutation.ServerTimestampTransform.instance);
    };
    JsonProtoSerializer.prototype.toDocumentsTarget = function (query) {
        return { documents: [this.toQueryPath(query.path)] };
    };
    JsonProtoSerializer.prototype.fromDocumentsTarget = function (documentsTarget) {
        var count = documentsTarget.documents.length;
        (0, _assert.assert)(count === 1, 'DocumentsTarget contained other than 1 document: ' + count);
        var name = documentsTarget.documents[0];
        return _query.Query.atPath(this.fromQueryPath(name));
    };
    JsonProtoSerializer.prototype.toQueryTarget = function (query) {
        // Dissect the path into parent, collectionId, and optional key filter.
        var result = { structuredQuery: {} };
        if (query.path.isEmpty()) {
            result.parent = this.toQueryPath(_path.ResourcePath.EMPTY_PATH);
        } else {
            var path = query.path;
            (0, _assert.assert)(path.length % 2 !== 0, 'Document queries with filters are not supported.');
            result.parent = this.toQueryPath(path.popLast());
            result.structuredQuery.from = [{ collectionId: path.lastSegment() }];
        }
        var where = this.toFilter(query.filters);
        if (where) {
            result.structuredQuery.where = where;
        }
        var orderBy = this.toOrder(query.orderBy);
        if (orderBy) {
            result.structuredQuery.orderBy = orderBy;
        }
        var limit = this.toLimit(query.limit);
        if (limit !== undefined) {
            result.structuredQuery.limit = limit;
        }
        if (query.startAt) {
            result.structuredQuery.startAt = this.toCursor(query.startAt);
        }
        if (query.endAt) {
            result.structuredQuery.endAt = this.toCursor(query.endAt);
        }
        return result;
    };
    JsonProtoSerializer.prototype.fromQueryTarget = function (target) {
        var path = this.fromQueryPath(target.parent);
        var query = target.structuredQuery;
        var fromCount = query.from ? query.from.length : 0;
        if (fromCount > 0) {
            (0, _assert.assert)(fromCount === 1, 'StructuredQuery.from with more than one collection is not supported.');
            var from = query.from[0];
            path = path.child(from.collectionId);
        }
        var filterBy = [];
        if (query.where) {
            filterBy = this.fromFilter(query.where);
        }
        var orderBy = [];
        if (query.orderBy) {
            orderBy = this.fromOrder(query.orderBy);
        }
        var limit = null;
        if (query.limit) {
            limit = query.limit;
        }
        var startAt = null;
        if (query.startAt) {
            startAt = this.fromCursor(query.startAt);
        }
        var endAt = null;
        if (query.endAt) {
            endAt = this.fromCursor(query.endAt);
        }
        return new _query.Query(path, orderBy, filterBy, limit, startAt, endAt);
    };
    JsonProtoSerializer.prototype.toListenRequestLabels = function (queryData) {
        var value = this.toLabel(queryData.purpose);
        if (value == null) {
            return null;
        } else {
            return {
                'goog-listen-tags': value
            };
        }
    };
    JsonProtoSerializer.prototype.toLabel = function (purpose) {
        switch (purpose) {
            case _query_data.QueryPurpose.Listen:
                return null;
            case _query_data.QueryPurpose.ExistenceFilterMismatch:
                return 'existence-filter-mismatch';
            case _query_data.QueryPurpose.LimboResolution:
                return 'limbo-document';
            default:
                return (0, _assert.fail)('Unrecognized query purpose: ' + purpose);
        }
    };
    JsonProtoSerializer.prototype.toTarget = function (queryData) {
        var result;
        var query = queryData.query;
        if (query.isDocumentQuery()) {
            result = { documents: this.toDocumentsTarget(query) };
        } else {
            result = { query: this.toQueryTarget(query) };
        }
        result.targetId = queryData.targetId;
        if (queryData.resumeToken.length > 0) {
            result.resumeToken = this.unsafeCastProtoByteString(queryData.resumeToken);
        }
        return result;
    };
    JsonProtoSerializer.prototype.toFilter = function (filters) {
        var _this = this;
        if (filters.length === 0) return;
        var protos = filters.map(function (filter) {
            return filter instanceof _query.RelationFilter ? _this.toRelationFilter(filter) : _this.toUnaryFilter(filter);
        });
        if (protos.length === 1) {
            return protos[0];
        }
        return { compositeFilter: { op: 'AND', filters: protos } };
    };
    JsonProtoSerializer.prototype.fromFilter = function (filter) {
        var _this = this;
        if (!filter) {
            return [];
        } else if (filter.unaryFilter !== undefined) {
            return [this.fromUnaryFilter(filter)];
        } else if (filter.fieldFilter !== undefined) {
            return [this.fromRelationFilter(filter)];
        } else if (filter.compositeFilter !== undefined) {
            return filter.compositeFilter.filters.map(function (f) {
                return _this.fromFilter(f);
            }).reduce(function (accum, current) {
                return accum.concat(current);
            });
        } else {
            return (0, _assert.fail)('Unknown filter: ' + JSON.stringify(filter));
        }
    };
    JsonProtoSerializer.prototype.toOrder = function (orderBys) {
        var _this = this;
        if (orderBys.length === 0) return;
        return orderBys.map(function (order) {
            return _this.toPropertyOrder(order);
        });
    };
    JsonProtoSerializer.prototype.fromOrder = function (orderBys) {
        var _this = this;
        return orderBys.map(function (order) {
            return _this.fromPropertyOrder(order);
        });
    };
    JsonProtoSerializer.prototype.toLimit = function (limit) {
        if (!typeUtils.isNullOrUndefined(limit)) {
            return limit;
        }
        return;
    };
    JsonProtoSerializer.prototype.toCursor = function (cursor) {
        var _this = this;
        return {
            before: cursor.before,
            values: cursor.position.map(function (component) {
                return _this.toValue(component);
            })
        };
    };
    JsonProtoSerializer.prototype.fromCursor = function (cursor) {
        var _this = this;
        var before = !!cursor.before;
        var position = cursor.values.map(function (component) {
            return _this.fromValue(component);
        });
        return new _query.Bound(position, before);
    };
    // visible for testing
    JsonProtoSerializer.prototype.toDirection = function (dir) {
        return DIRECTIONS[dir.name];
    };
    // visible for testing
    JsonProtoSerializer.prototype.fromDirection = function (dir) {
        switch (dir) {
            case 'ASCENDING':
                return _query.Direction.ASCENDING;
            case 'DESCENDING':
                return _query.Direction.DESCENDING;
            default:
                return undefined;
        }
    };
    // visible for testing
    JsonProtoSerializer.prototype.toOperatorName = function (op) {
        return OPERATORS[op.name];
    };
    JsonProtoSerializer.prototype.fromOperatorName = function (op) {
        switch (op) {
            case 'EQUAL':
                return _query.RelationOp.EQUAL;
            case 'GREATER_THAN':
                return _query.RelationOp.GREATER_THAN;
            case 'GREATER_THAN_OR_EQUAL':
                return _query.RelationOp.GREATER_THAN_OR_EQUAL;
            case 'LESS_THAN':
                return _query.RelationOp.LESS_THAN;
            case 'LESS_THAN_OR_EQUAL':
                return _query.RelationOp.LESS_THAN_OR_EQUAL;
            case 'OPERATOR_UNSPECIFIED':
                return (0, _assert.fail)('Unspecified relation');
            default:
                return (0, _assert.fail)('Unknown relation');
        }
    };
    JsonProtoSerializer.prototype.toFieldPathReference = function (path) {
        return { fieldPath: path.canonicalString() };
    };
    JsonProtoSerializer.prototype.fromFieldPathReference = function (fieldReference) {
        return _path.FieldPath.fromServerFormat(fieldReference.fieldPath);
    };
    // visible for testing
    JsonProtoSerializer.prototype.toPropertyOrder = function (orderBy) {
        return {
            field: this.toFieldPathReference(orderBy.field),
            direction: this.toDirection(orderBy.dir)
        };
    };
    JsonProtoSerializer.prototype.fromPropertyOrder = function (orderBy) {
        return new _query.OrderBy(this.fromFieldPathReference(orderBy.field), this.fromDirection(orderBy.direction));
    };
    // visible for testing
    JsonProtoSerializer.prototype.toRelationFilter = function (filter) {
        if (filter instanceof _query.RelationFilter) {
            return {
                fieldFilter: {
                    field: this.toFieldPathReference(filter.field),
                    op: this.toOperatorName(filter.op),
                    value: this.toValue(filter.value)
                }
            };
        } else {
            return (0, _assert.fail)('Unrecognized filter: ' + JSON.stringify(filter));
        }
    };
    JsonProtoSerializer.prototype.fromRelationFilter = function (filter) {
        return new _query.RelationFilter(this.fromFieldPathReference(filter.fieldFilter.field), this.fromOperatorName(filter.fieldFilter.op), this.fromValue(filter.fieldFilter.value));
    };
    // visible for testing
    JsonProtoSerializer.prototype.toUnaryFilter = function (filter) {
        if (filter instanceof _query.NanFilter) {
            return {
                unaryFilter: {
                    field: this.toFieldPathReference(filter.field),
                    op: 'IS_NAN'
                }
            };
        } else if (filter instanceof _query.NullFilter) {
            return {
                unaryFilter: {
                    field: this.toFieldPathReference(filter.field),
                    op: 'IS_NULL'
                }
            };
        } else {
            return (0, _assert.fail)('Unrecognized filter: ' + JSON.stringify(filter));
        }
    };
    JsonProtoSerializer.prototype.fromUnaryFilter = function (filter) {
        switch (filter.unaryFilter.op) {
            case 'IS_NAN':
                var nanField = this.fromFieldPathReference(filter.unaryFilter.field);
                return new _query.NanFilter(nanField);
            case 'IS_NULL':
                var nullField = this.fromFieldPathReference(filter.unaryFilter.field);
                return new _query.NullFilter(nullField);
            case 'OPERATOR_UNSPECIFIED':
                return (0, _assert.fail)('Unspecified filter');
            default:
                return (0, _assert.fail)('Unknown filter');
        }
    };
    JsonProtoSerializer.prototype.toDocumentMask = function (fieldMask) {
        return {
            fieldPaths: fieldMask.fields.map(function (field) {
                return field.canonicalString();
            })
        };
    };
    JsonProtoSerializer.prototype.fromDocumentMask = function (proto) {
        var paths = proto.fieldPaths || [];
        var fields = paths.map(function (path) {
            return _path.FieldPath.fromServerFormat(path);
        });
        return new _mutation.FieldMask(fields);
    };
    return JsonProtoSerializer;
}();
exports.JsonProtoSerializer = JsonProtoSerializer;
/**
 * Checks for a specific oneof tag in a protocol buffer message.
 *
 * This intentionally accommodates two distinct cases:
 *
 * 1) Messages containing a type tag: these are the format produced by GRPC in
 * return values. These may contain default-value mappings for all tags in the
 * oneof but the type tag specifies which one was actually set.
 *
 * 2) Messages that don't contain a type tag: these are the format required by
 * GRPC as inputs. If we emitted objects with type tags, ProtoBuf.js would
 * choke claiming that the tags aren't fields in the Message.
 *
 * Allowing both formats here makes the serializer able to consume the outputs
 * it produces: for all messages it supports, fromX(toX(value)) == value.
 *
 * Note that case 2 suffers from ambiguity: if multiple tags are present
 * without a type tag then the callers are structured in such a way that the
 * first invocation will win. Since we only parse in this mode when parsing
 * the output of a serialize method this works, but it's not a general
 * solution.
 *
 * Unfortunately there is no general solution here because proto3 makes it
 * impossible to distinguish unset from explicitly set fields: both have the
 * default value for the type. Without the type tag but multiple value tags
 * it's possible to have default values for each tag in the oneof and not be
 * able to know which was actually in effect.
 */

function hasTag(obj, type, tag) {
    return type === tag || !type && tag in obj;
}
//# sourceMappingURL=serializer.js.map
