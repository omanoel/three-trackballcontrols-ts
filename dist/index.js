"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = require("three");
var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
var CHANGE_EVENT = { type: 'change' };
var START_EVENT = { type: 'start' };
var END_EVENT = { type: 'end' };
var EPS = 0.000001;
var lastPosition = new THREE.Vector3();
/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga 	/ http://lantiga.github.io
 * @author Olivier Manoel 	/ http://github.com/omanoel
 */
var TrackballControls = /** @class */ (function (_super) {
    __extends(TrackballControls, _super);
    function TrackballControls(object, domElement, domWindow) {
        var _this = _super.call(this) || this;
        _this.getMouseOnScreen = function (pageX, pageY) {
            var vector = new THREE.Vector2();
            return vector.set((pageX - _this.screen.left) / _this.screen.width, (pageY - _this.screen.top) / _this.screen.height);
        };
        _this.getMouseOnCircle = function (pageX, pageY) {
            var vector = new THREE.Vector2();
            return vector.set(((pageX - _this.screen.width * 0.5 - _this.screen.left) / (_this.screen.width * 0.5)), ((_this.screen.height + 2 * (_this.screen.top - pageY)) / _this.screen.width));
        };
        _this.rotateCamera = function () {
            var axis = new THREE.Vector3();
            var quaternion = new THREE.Quaternion();
            var eyeDirection = new THREE.Vector3();
            var objectUpDirection = new THREE.Vector3();
            var objectSidewaysDirection = new THREE.Vector3();
            var moveDirection = new THREE.Vector3();
            var angle;
            moveDirection.set(_this.moveCurr.x - _this.movePrev.x, _this.moveCurr.y - _this.movePrev.y, 0);
            angle = moveDirection.length();
            if (angle) {
                _this.eye.copy(_this.object.position).sub(_this.target);
                eyeDirection.copy(_this.eye).normalize();
                objectUpDirection.copy(_this.object.up).normalize();
                objectSidewaysDirection.crossVectors(objectUpDirection, eyeDirection).normalize();
                objectUpDirection.setLength(_this.moveCurr.y - _this.movePrev.y);
                objectSidewaysDirection.setLength(_this.moveCurr.x - _this.movePrev.x);
                moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));
                axis.crossVectors(moveDirection, _this.eye).normalize();
                angle *= _this.rotateSpeed;
                quaternion.setFromAxisAngle(axis, angle);
                _this.eye.applyQuaternion(quaternion);
                _this.object.up.applyQuaternion(quaternion);
                _this.lastAxis.copy(axis);
                _this.lastAngle = angle;
            }
            else if (!_this.staticMoving && _this.lastAngle) {
                _this.lastAngle *= Math.sqrt(1.0 - _this.dynamicDampingFactor);
                _this.eye.copy(_this.object.position).sub(_this.target);
                quaternion.setFromAxisAngle(_this.lastAxis, _this.lastAngle);
                _this.eye.applyQuaternion(quaternion);
                _this.object.up.applyQuaternion(quaternion);
            }
            _this.movePrev.copy(_this.moveCurr);
        };
        _this.zoomCamera = function () {
            var factor = 0;
            if (_this.state === STATE.TOUCH_ZOOM_PAN) {
                factor = _this.touchZoomDistanceStart / _this.touchZoomDistanceEnd;
                _this.touchZoomDistanceStart = _this.touchZoomDistanceEnd;
                _this.eye.multiplyScalar(factor);
            }
            else {
                factor = 1.0 + (_this.zoomEnd.y - _this.zoomStart.y) * _this.zoomSpeed;
                if (factor !== 1.0 && factor > 0.0) {
                    _this.eye.multiplyScalar(factor);
                }
                if (_this.staticMoving) {
                    _this.zoomStart.copy(_this.zoomEnd);
                }
                else {
                    _this.zoomStart.y += (_this.zoomEnd.y - _this.zoomStart.y) * _this.dynamicDampingFactor;
                }
            }
        };
        _this.panCamera = function () {
            var mouseChange = new THREE.Vector2();
            var objectUp = new THREE.Vector3();
            var pan = new THREE.Vector3();
            mouseChange.copy(_this.panEnd).sub(_this.panStart);
            if (mouseChange.lengthSq()) {
                mouseChange.multiplyScalar(_this.eye.length() * _this.panSpeed);
                pan.copy(_this.eye).cross(_this.object.up).setLength(mouseChange.x);
                pan.add(objectUp.copy(_this.object.up).setLength(mouseChange.y));
                _this.object.position.add(pan);
                _this.target.add(pan);
                if (_this.staticMoving) {
                    _this.panStart.copy(_this.panEnd);
                }
                else {
                    _this.panStart.add(mouseChange.subVectors(_this.panEnd, _this.panStart).multiplyScalar(_this.dynamicDampingFactor));
                }
            }
        };
        _this.object = object;
        _this.domElement = domElement;
        _this.window = (domWindow !== undefined) ? domWindow : window;
        // Set to false to disable this control
        _this.enabled = true;
        _this.screen = { left: 0, top: 0, width: 0, height: 0 };
        _this.rotateSpeed = 1.0;
        _this.zoomSpeed = 1.2;
        _this.panSpeed = 0.3;
        _this.noRotate = false;
        _this.noZoom = false;
        _this.noPan = false;
        _this.staticMoving = false;
        _this.dynamicDampingFactor = 0.2;
        // How far you can dolly in and out ( PerspectiveCamera only )
        _this.minDistance = 0;
        _this.maxDistance = Infinity;
        _this.keys = [65 /*A*/, 83 /*S*/, 68 /*D*/];
        // "target" sets the location of focus, where the object orbits around
        _this.target = new THREE.Vector3();
        _this.state = STATE.NONE;
        _this.prevState = STATE.NONE;
        _this.eye = new THREE.Vector3();
        _this.movePrev = new THREE.Vector2();
        _this.moveCurr = new THREE.Vector2();
        _this.lastAxis = new THREE.Vector3();
        _this.lastAngle = 0;
        _this.zoomStart = new THREE.Vector2();
        _this.zoomEnd = new THREE.Vector2();
        _this.touchZoomDistanceStart = 0;
        _this.touchZoomDistanceEnd = 0;
        _this.panStart = new THREE.Vector2();
        _this.panEnd = new THREE.Vector2();
        _this.target0 = _this.target.clone();
        _this.position0 = _this.object.position.clone();
        _this.up0 = _this.object.up.clone();
        // event handlers - FSM: listen for events and reset state
        _this.keydown = function (event) {
            if (_this.enabled === false)
                return;
            window.removeEventListener('keydown', _this.keydown);
            _this.prevState = _this.state;
            if (_this.state !== STATE.NONE) {
                return;
            }
            else if (event.keyCode === _this.keys[STATE.ROTATE] && !_this.noRotate) {
                _this.state = STATE.ROTATE;
            }
            else if (event.keyCode === _this.keys[STATE.ZOOM] && !_this.noZoom) {
                _this.state = STATE.ZOOM;
            }
            else if (event.keyCode === _this.keys[STATE.PAN] && !_this.noPan) {
                _this.state = STATE.PAN;
            }
        };
        _this.keyup = function (event) {
            if (_this.enabled === false) {
                return;
            }
            _this.state = _this.prevState;
            window.addEventListener('keydown', _this.keydown, false);
        };
        _this.mousedown = function (event) {
            if (_this.enabled === false) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            if (_this.state === STATE.NONE) {
                _this.state = event.button;
            }
            if (_this.state === STATE.ROTATE && !_this.noRotate) {
                _this.moveCurr.copy(_this.getMouseOnCircle(event.pageX, event.pageY));
                _this.movePrev.copy(_this.moveCurr);
            }
            else if (_this.state === STATE.ZOOM && !_this.noZoom) {
                _this.zoomStart.copy(_this.getMouseOnScreen(event.pageX, event.pageY));
                _this.zoomEnd.copy(_this.zoomStart);
            }
            else if (_this.state === STATE.PAN && !_this.noPan) {
                _this.panStart.copy(_this.getMouseOnScreen(event.pageX, event.pageY));
                _this.panEnd.copy(_this.panStart);
            }
            document.addEventListener('mousemove', _this.mousemove, false);
            document.addEventListener('mouseup', _this.mouseup, false);
            _this.dispatchEvent(START_EVENT);
        };
        _this.mousemove = function (event) {
            if (_this.enabled === false) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            if (_this.state === STATE.ROTATE && !_this.noRotate) {
                _this.movePrev.copy(_this.moveCurr);
                _this.moveCurr.copy(_this.getMouseOnCircle(event.pageX, event.pageY));
            }
            else if (_this.state === STATE.ZOOM && !_this.noZoom) {
                _this.zoomEnd.copy(_this.getMouseOnScreen(event.pageX, event.pageY));
            }
            else if (_this.state === STATE.PAN && !_this.noPan) {
                _this.panEnd.copy(_this.getMouseOnScreen(event.pageX, event.pageY));
            }
        };
        _this.mouseup = function (event) {
            if (_this.enabled === false) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            _this.state = STATE.NONE;
            document.removeEventListener('mousemove', _this.mousemove);
            document.removeEventListener('mouseup', _this.mouseup);
            _this.dispatchEvent(END_EVENT);
        };
        _this.mousewheel = function (event) {
            if (_this.enabled === false) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            switch (event.deltaMode) {
                case 2:
                    // Zoom in pages
                    _this.zoomStart.y -= event.deltaY * 0.025;
                    break;
                case 1:
                    // Zoom in lines
                    _this.zoomStart.y -= event.deltaY * 0.01;
                    break;
                default:
                    // undefined, 0, assume pixels
                    _this.zoomStart.y -= event.deltaY * 0.00025;
                    break;
            }
            _this.dispatchEvent(START_EVENT);
            _this.dispatchEvent(END_EVENT);
        };
        _this.touchstart = function (event) {
            if (_this.enabled === false) {
                return;
            }
            switch (event.touches.length) {
                case 1:
                    _this.state = STATE.TOUCH_ROTATE;
                    _this.moveCurr.copy(_this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
                    _this.movePrev.copy(_this.moveCurr);
                    break;
                default: // 2 or more
                    _this.state = STATE.TOUCH_ZOOM_PAN;
                    var dx = event.touches[0].pageX - event.touches[1].pageX;
                    var dy = event.touches[0].pageY - event.touches[1].pageY;
                    _this.touchZoomDistanceEnd = _this.touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);
                    var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                    var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                    _this.panStart.copy(_this.getMouseOnScreen(x, y));
                    _this.panEnd.copy(_this.panStart);
                    break;
            }
            _this.dispatchEvent(START_EVENT);
        };
        _this.touchmove = function (event) {
            if (_this.enabled === false) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            switch (event.touches.length) {
                case 1:
                    _this.movePrev.copy(_this.moveCurr);
                    _this.moveCurr.copy(_this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
                    break;
                default: // 2 or more
                    var dx = event.touches[0].pageX - event.touches[1].pageX;
                    var dy = event.touches[0].pageY - event.touches[1].pageY;
                    _this.touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);
                    var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                    var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                    _this.panEnd.copy(_this.getMouseOnScreen(x, y));
                    break;
            }
        };
        _this.touchend = function (event) {
            if (_this.enabled === false) {
                return;
            }
            switch (event.touches.length) {
                case 0:
                    _this.state = STATE.NONE;
                    break;
                case 1:
                    _this.state = STATE.TOUCH_ROTATE;
                    _this.moveCurr.copy(_this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
                    _this.movePrev.copy(_this.moveCurr);
                    break;
            }
            _this.dispatchEvent(END_EVENT);
        };
        _this.contextmenu = function (event) {
            event.preventDefault();
        };
        _this.domElement.addEventListener('contextmenu', _this.contextmenu, false);
        _this.domElement.addEventListener('mousedown', _this.mousedown, false);
        _this.domElement.addEventListener('wheel', _this.mousewheel, false);
        _this.domElement.addEventListener('touchstart', _this.touchstart, false);
        _this.domElement.addEventListener('touchend', _this.touchend, false);
        _this.domElement.addEventListener('touchmove', _this.touchmove, false);
        _this.window.addEventListener('keydown', _this.keydown, false);
        _this.window.addEventListener('keyup', _this.keyup, false);
        _this.handleResize();
        // force an update at start
        _this.update();
        return _this;
    }
    TrackballControls.prototype.dispose = function () {
        this.domElement.removeEventListener('contextmenu', this.contextmenu, false);
        this.domElement.removeEventListener('mousedown', this.mousedown, false);
        this.domElement.removeEventListener('wheel', this.mousewheel, false);
        this.domElement.removeEventListener('touchstart', this.touchstart, false);
        this.domElement.removeEventListener('touchend', this.touchend, false);
        this.domElement.removeEventListener('touchmove', this.touchmove, false);
        document.removeEventListener('mousemove', this.mousemove, false);
        document.removeEventListener('mouseup', this.mouseup, false);
        this.window.removeEventListener('keydown', this.keydown, false);
        this.window.removeEventListener('keyup', this.keyup, false);
    };
    // ------------------------------------------------
    TrackballControls.prototype.handleResize = function () {
        var box = this.domElement.getBoundingClientRect();
        // adjustments come from similar code in the jquery offset() function
        var d = this.domElement.ownerDocument.documentElement;
        this.screen.left = box.left + this.window.pageXOffset - d.clientLeft;
        this.screen.top = box.top + this.window.pageYOffset - d.clientTop;
        this.screen.width = box.width;
        this.screen.height = box.height;
    };
    TrackballControls.prototype.checkDistances = function () {
        if (!this.noZoom || !this.noPan) {
            if (this.eye.lengthSq() > this.maxDistance * this.maxDistance) {
                this.object.position.addVectors(this.target, this.eye.setLength(this.maxDistance));
                this.zoomStart.copy(this.zoomEnd);
            }
            if (this.eye.lengthSq() < this.minDistance * this.minDistance) {
                this.object.position.addVectors(this.target, this.eye.setLength(this.minDistance));
                this.zoomStart.copy(this.zoomEnd);
            }
        }
    };
    TrackballControls.prototype.update = function () {
        this.eye.subVectors(this.object.position, this.target);
        if (!this.noRotate) {
            this.rotateCamera();
        }
        if (!this.noZoom) {
            this.zoomCamera();
        }
        if (!this.noPan) {
            this.panCamera();
        }
        this.object.position.addVectors(this.target, this.eye);
        this.checkDistances();
        this.object.lookAt(this.target);
        if (lastPosition.distanceToSquared(this.object.position) > EPS) {
            this.dispatchEvent(CHANGE_EVENT);
            lastPosition.copy(this.object.position);
        }
    };
    TrackballControls.prototype.reset = function () {
        this.state = STATE.NONE;
        this.prevState = STATE.NONE;
        this.target.copy(this.target0);
        this.object.position.copy(this.position0);
        this.object.up.copy(this.up0);
        this.eye.subVectors(this.object.position, this.target);
        this.object.lookAt(this.target);
        this.dispatchEvent(CHANGE_EVENT);
        lastPosition.copy(this.object.position);
    };
    return TrackballControls;
}(THREE.EventDispatcher));
exports.TrackballControls = TrackballControls;
