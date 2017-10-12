/*! @license Firebase v4.5.0
Build: rev-f49c8b5
Terms: https://firebase.google.com/terms/ */

'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FirstPartyCredentialsProvider = exports.FirstPartyToken = exports.GoogleCredentialsProvider = exports.FirebaseCredentialsProvider = exports.EmptyCredentialsProvider = exports.OAuthToken = undefined;
exports.makeCredentialsProvider = makeCredentialsProvider;

var _user = require('../auth/user');

var _assert = require('../util/assert');

var _error = require('../util/error');

var _promise = require('../../utils/promise');

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
var OAuthToken = /** @class */function () {
    function OAuthToken(value, user) {
        this.user = user;
        this.type = 'OAuth';
        this.authHeaders = { Authorization: "Bearer " + value };
    }
    return OAuthToken;
}();
exports.OAuthToken = OAuthToken;
/** A CredentialsProvider that always yields an empty token. */

var EmptyCredentialsProvider = /** @class */function () {
    function EmptyCredentialsProvider() {
        /**
         * Stores the User listener registered with setUserChangeListener()
         * This isn't actually necessary since the UID never changes, but we use this
         * to verify the listen contract is adhered to in tests.
         */
        this.userListener = null;
    }
    EmptyCredentialsProvider.prototype.getToken = function (forceRefresh) {
        return _promise.PromiseImpl.resolve(null);
    };
    EmptyCredentialsProvider.prototype.setUserChangeListener = function (listener) {
        (0, _assert.assert)(!this.userListener, 'Can only call setUserChangeListener() once.');
        this.userListener = listener;
        // Fire with initial user.
        listener(_user.User.UNAUTHENTICATED);
    };
    EmptyCredentialsProvider.prototype.removeUserChangeListener = function () {
        (0, _assert.assert)(this.userListener !== null, 'removeUserChangeListener() when no listener registered');
        this.userListener = null;
    };
    return EmptyCredentialsProvider;
}();
exports.EmptyCredentialsProvider = EmptyCredentialsProvider;

var FirebaseCredentialsProvider = /** @class */function () {
    function FirebaseCredentialsProvider(app) {
        var _this = this;
        this.app = app;
        /**
         * The auth token listener registered with FirebaseApp, retained here so we
         * can unregister it.
         */
        this.tokenListener = null;
        /**
         * Counter used to detect if the user changed while a getToken request was
         * outstanding.
         */
        this.userCounter = 0;
        /** The User listener registered with setUserChangeListener(). */
        this.userListener = null;
        // We listen for token changes but all we really care about is knowing when
        // the uid may have changed.
        this.tokenListener = function () {
            var newUser = _this.getUser();
            if (!_this.currentUser || !newUser.equals(_this.currentUser)) {
                _this.currentUser = newUser;
                _this.userCounter++;
                if (_this.userListener) {
                    _this.userListener(_this.currentUser);
                }
            }
        };
        this.userCounter = 0;
        // Will fire at least once where we set this.currentUser
        this.app.INTERNAL.addAuthTokenListener(this.tokenListener);
    }
    FirebaseCredentialsProvider.prototype.getToken = function (forceRefresh) {
        var _this = this;
        (0, _assert.assert)(this.tokenListener != null, 'getToken cannot be called after listener removed.');
        // Take note of the current value of the userCounter so that this method can
        // fail (with an ABORTED error) if there is a user change while the request
        // is outstanding.
        var initialUserCounter = this.userCounter;
        return this.app.INTERNAL.getToken(forceRefresh).then(function (tokenData) {
            // Cancel the request since the user changed while the request was
            // outstanding so the response is likely for a previous user (which
            // user, we can't be sure).
            if (_this.userCounter !== initialUserCounter) {
                throw new _error.FirestoreError(_error.Code.ABORTED, 'getToken aborted due to uid change.');
            } else {
                if (tokenData) {
                    (0, _assert.assert)(typeof tokenData.accessToken === 'string', 'Invalid tokenData returned from getToken():' + tokenData);
                    return new OAuthToken(tokenData.accessToken, _this.currentUser);
                } else {
                    return null;
                }
            }
        });
    };
    FirebaseCredentialsProvider.prototype.setUserChangeListener = function (listener) {
        (0, _assert.assert)(!this.userListener, 'Can only call setUserChangeListener() once.');
        this.userListener = listener;
        // Fire the initial event, but only if we received the initial user
        if (this.currentUser) {
            listener(this.currentUser);
        }
    };
    FirebaseCredentialsProvider.prototype.removeUserChangeListener = function () {
        (0, _assert.assert)(this.tokenListener != null, 'removeUserChangeListener() called twice');
        (0, _assert.assert)(this.userListener !== null, 'removeUserChangeListener() called when no listener registered');
        this.app.INTERNAL.removeAuthTokenListener(this.tokenListener);
        this.tokenListener = null;
        this.userListener = null;
    };
    FirebaseCredentialsProvider.prototype.getUser = function () {
        // TODO(mikelehen): Remove this check once we're shipping with firebase.js.
        if (typeof this.app.INTERNAL.getUid !== 'function') {
            (0, _assert.fail)('This version of the Firestore SDK requires at least version' + ' 3.7.0 of firebase.js.');
        }
        var currentUid = this.app.INTERNAL.getUid();
        (0, _assert.assert)(currentUid === null || typeof currentUid === 'string', 'Received invalid UID: ' + currentUid);
        return new _user.User(currentUid);
    };
    return FirebaseCredentialsProvider;
}();
exports.FirebaseCredentialsProvider = FirebaseCredentialsProvider;
// Wrap a google-auth-library client as a CredentialsProvider.
// NOTE: grpc-connection can natively accept a google-auth-library
// client via createFromGoogleCredential(), but we opt to plumb the tokens
// through our CredentialsProvider interface, at least for now.

var GoogleCredentialsProvider = /** @class */function () {
    function GoogleCredentialsProvider(authClient) {
        this.authClient = authClient;
    }
    GoogleCredentialsProvider.prototype.getToken = function (forceRefresh) {
        var _this = this;
        return new _promise.PromiseImpl(function (resolve, reject) {
            // TODO(b/32935141): ideally this would be declared as an extern
            _this.authClient['getAccessToken'](function (error, tokenLiteral) {
                if (error) {
                    reject(error);
                } else {
                    resolve(new OAuthToken(tokenLiteral, _user.User.GOOGLE_CREDENTIALS));
                }
            });
        });
    };
    // NOTE: A google-auth-library client represents an immutable "user", so
    // once we fire the initial event, it'll never change.
    GoogleCredentialsProvider.prototype.setUserChangeListener = function (listener) {
        // Fire with initial uid.
        listener(_user.User.GOOGLE_CREDENTIALS);
    };
    GoogleCredentialsProvider.prototype.removeUserChangeListener = function () {};
    return GoogleCredentialsProvider;
}();
exports.GoogleCredentialsProvider = GoogleCredentialsProvider;
/*
 * FirstPartyToken provides a fresh token each time its value
 * is requested, because if the token is too old, requests will be rejected.
 * TODO(b/33147818) this implementation violates the current assumption that
 * tokens are immutable.  We need to either revisit this assumption or come
 * up with some way for FPA to use the listen/unlisten interface.
 */

var FirstPartyToken = /** @class */function () {
    function FirstPartyToken(gapi, sessionIndex) {
        this.gapi = gapi;
        this.sessionIndex = sessionIndex;
        this.type = 'FirstParty';
        this.user = _user.User.FIRST_PARTY;
        (0, _assert.assert)(this.gapi && this.gapi['auth'] && this.gapi['auth']['getAuthHeaderValueForFirstParty'], 'unexpected gapi interface');
    }
    Object.defineProperty(FirstPartyToken.prototype, "authHeaders", {
        get: function get() {
            return {
                Authorization: this.gapi['auth']['getAuthHeaderValueForFirstParty']([]),
                'X-Goog-AuthUser': this.sessionIndex
            };
        },
        enumerable: true,
        configurable: true
    });
    return FirstPartyToken;
}();
exports.FirstPartyToken = FirstPartyToken;
/*
 * Provides user credentials required for the Firestore JavaScript SDK
 * to authenticate the user, using technique that is only available
 * to applications hosted by Google.
 */

var FirstPartyCredentialsProvider = /** @class */function () {
    function FirstPartyCredentialsProvider(gapi, sessionIndex) {
        this.gapi = gapi;
        this.sessionIndex = sessionIndex;
        (0, _assert.assert)(this.gapi && this.gapi['auth'] && this.gapi['auth']['getAuthHeaderValueForFirstParty'], 'unexpected gapi interface');
    }
    FirstPartyCredentialsProvider.prototype.getToken = function (forceRefresh) {
        return _promise.PromiseImpl.resolve(new FirstPartyToken(this.gapi, this.sessionIndex));
    };
    // TODO(33108925): can someone switch users w/o a page refresh?
    // TODO(33110621): need to understand token/session lifecycle
    FirstPartyCredentialsProvider.prototype.setUserChangeListener = function (listener) {
        // Fire with initial uid.
        listener(_user.User.FIRST_PARTY);
    };
    FirstPartyCredentialsProvider.prototype.removeUserChangeListener = function () {};
    return FirstPartyCredentialsProvider;
}();
exports.FirstPartyCredentialsProvider = FirstPartyCredentialsProvider;
/**
 * Builds a CredentialsProvider depending on the type of
 * the credentials passed in.
 */

function makeCredentialsProvider(credentials) {
    if (!credentials) {
        return new EmptyCredentialsProvider();
    }
    switch (credentials.type) {
        case 'google-auth':
            return new GoogleCredentialsProvider(credentials.client);
        case 'gapi':
            return new FirstPartyCredentialsProvider(credentials.client, credentials.sessionIndex || '0');
        case 'provider':
            return credentials.client;
        default:
            throw new _error.FirestoreError(_error.Code.INVALID_ARGUMENT, 'makeCredentialsProvider failed due to invalid credential type');
    }
}
//# sourceMappingURL=credentials.js.map
