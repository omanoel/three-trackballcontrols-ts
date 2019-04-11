import * as THREE from 'three';

const STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
const CHANGE_EVENT = { type: 'change' };
const START_EVENT = { type: 'start' };
const END_EVENT = { type: 'end' };

const EPS = 0.000001;

const lastPosition = new THREE.Vector3();

/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga 	/ http://lantiga.github.io
 * @author Olivier Manoel 	/ http://github.com/omanoel
 */

export class TrackballControls extends THREE.EventDispatcher {
  object: THREE.Camera;
  domElement: HTMLElement;
  window: Window;

  // API
  enabled: boolean;
  screen: any;

  rotateSpeed: number;
  zoomSpeed: number;
  panSpeed: number;

  noRotate: boolean;
  noZoom: boolean;
  noPan: boolean;

	staticMoving: boolean;
	dynamicDampingFactor: number;

  minDistance: number;
  maxDistance: number;

  keys: number[];
  target: THREE.Vector3;

  private state: number;
  private prevState: number;
  private eye: THREE.Vector3;
  private movePrev: THREE.Vector2;
  private moveCurr: THREE.Vector2;
  private lastAxis: THREE.Vector3;
  private lastAngle: number;
  private zoomStart: THREE.Vector2;
  private zoomEnd: THREE.Vector2;
  private touchZoomDistanceStart: number;
  private touchZoomDistanceEnd: number;
  private panStart: THREE.Vector2;
  private panEnd: THREE.Vector2;

  private target0: THREE.Vector3;
  private position0: THREE.Vector3;
  private up0: THREE.Vector3;

  private keydown: EventListener;
  private keyup: EventListener;
  private mousedown: EventListener;
  private mouseup: EventListener;
  private mousemove: EventListener;
  private mousewheel: EventListener;
  private touchstart: EventListener;
  private touchmove: EventListener;
  private touchend: EventListener;
  private contextmenu: EventListener;
  
  constructor (object: THREE.Camera, domElement: HTMLElement, domWindow?: Window) {
    super();
    this.object = object;

    this.domElement = domElement;
    this.window = ( domWindow !== undefined ) ? domWindow : window;

    // Set to false to disable this control
    this.enabled = true;
    this.screen = { left: 0, top: 0, width: 0, height: 0 };

    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.2;
    this.panSpeed = 0.3;
  
    this.noRotate = false;
    this.noZoom = false;
    this.noPan = false;
  
    this.staticMoving = false;
    this.dynamicDampingFactor = 0.2;
  
    // How far you can dolly in and out ( PerspectiveCamera only )
    this.minDistance = 0;
    this.maxDistance = Infinity;

    this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

    // "target" sets the location of focus, where the object orbits around
    this.target = new THREE.Vector3();

    this.state = STATE.NONE;
    this.prevState = STATE.NONE;

    this.eye = new THREE.Vector3();

    this.movePrev = new THREE.Vector2();
    this.moveCurr = new THREE.Vector2();

    this.lastAxis = new THREE.Vector3();
    this.lastAngle = 0;

    this.zoomStart = new THREE.Vector2();
    this.zoomEnd = new THREE.Vector2();

    this.touchZoomDistanceStart = 0;
    this.touchZoomDistanceEnd = 0;

    this.panStart = new THREE.Vector2();
    this.panEnd = new THREE.Vector2();

    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.up0 = this.object.up.clone();

    // event handlers - FSM: listen for events and reset state

    this.keydown = ( event: KeyboardEvent ) => {
      if ( this.enabled === false ) return;
      window.removeEventListener( 'keydown', this.keydown );
      this.prevState = this.state;
      if ( this.state !== STATE.NONE ) {
        return;
      } else if ( event.keyCode === this.keys[ STATE.ROTATE ] && ! this.noRotate ) {
        this.state = STATE.ROTATE;
      } else if ( event.keyCode === this.keys[ STATE.ZOOM ] && ! this.noZoom ) {
        this.state = STATE.ZOOM; 
      } else if ( event.keyCode === this.keys[ STATE.PAN ] && ! this.noPan ) {
        this.state = STATE.PAN;
      }
    }

    this.keyup = ( event: KeyboardEvent ) => {
      if (this.enabled === false) { return; }
      this.state = this.prevState;
      window.addEventListener('keydown', this.keydown, false);

    }

    this.mousedown = (event: MouseEvent) => {
      if (this.enabled === false) { return; }
      event.preventDefault();
      event.stopPropagation();
      if (this.state === STATE.NONE) {
          this.state = event.button;
      }

      if (this.state === STATE.ROTATE && !this.noRotate) {
          this.moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
          this.movePrev.copy(this.moveCurr);
      } else if (this.state === STATE.ZOOM && !this.noZoom) {
          this.zoomStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
          this.zoomEnd.copy(this.zoomStart);
      } else if (this.state === STATE.PAN && !this.noPan) {
          this.panStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
          this.panEnd.copy(this.panStart);
      }
      document.addEventListener('mousemove', this.mousemove, false);
      document.addEventListener('mouseup', this.mouseup, false);
      this.dispatchEvent(START_EVENT);
    }

    this.mousemove = (event: MouseEvent) => {
      if (this.enabled === false) { return; }
      event.preventDefault();
      event.stopPropagation();
      if (this.state === STATE.ROTATE && !this.noRotate) {
          this.movePrev.copy(this.moveCurr);
          this.moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
      } else if (this.state === STATE.ZOOM && !this.noZoom) {
          this.zoomEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
      } else if (this.state === STATE.PAN && !this.noPan) {
          this.panEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
      }
    }

    this.mouseup = (event: MouseEvent) => {
      if (this.enabled === false) { return; }
      event.preventDefault();
      event.stopPropagation();
      this.state = STATE.NONE;
      document.removeEventListener('mousemove', this.mousemove);
      document.removeEventListener('mouseup', this.mouseup);
      this.dispatchEvent(END_EVENT);
    }

    this.mousewheel = (event: WheelEvent) => {
      if (this.enabled === false) { return; }
      event.preventDefault();
      event.stopPropagation();
      switch ( event.deltaMode ) {

        case 2:
          // Zoom in pages
          this.zoomStart.y -= event.deltaY * 0.025;
          break;
  
        case 1:
          // Zoom in lines
          this.zoomStart.y -= event.deltaY * 0.01;
          break;
  
        default:
          // undefined, 0, assume pixels
          this.zoomStart.y -= event.deltaY * 0.00025;
          break;
  
      }
      this.dispatchEvent(START_EVENT);
      this.dispatchEvent(END_EVENT);
    }

    this.touchstart = (event: TouchEvent) => {
      if (this.enabled === false) { return; }
      switch (event.touches.length) {
          case 1:
              this.state = STATE.TOUCH_ROTATE;
              this.moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
              this.movePrev.copy(this.moveCurr);
              break;
          default: // 2 or more
              this.state = STATE.TOUCH_ZOOM_PAN;
              const dx = event.touches[0].pageX - event.touches[1].pageX;
              const dy = event.touches[0].pageY - event.touches[1].pageY;
              this.touchZoomDistanceEnd = this.touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);
              const x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
              const y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
              this.panStart.copy(this.getMouseOnScreen(x, y));
              this.panEnd.copy(this.panStart);
              break;
      }
      this.dispatchEvent(START_EVENT);
    }

    this.touchmove = (event: TouchEvent) => {
      if (this.enabled === false) { return; }
      event.preventDefault();
      event.stopPropagation();

      switch (event.touches.length) {
          case 1:
              this.movePrev.copy(this.moveCurr);
              this.moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
              break;

          default: // 2 or more
              const dx = event.touches[0].pageX - event.touches[1].pageX;
              const dy = event.touches[0].pageY - event.touches[1].pageY;
              this.touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);
              const x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
              const y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
              this.panEnd.copy(this.getMouseOnScreen(x, y));
              break;
      }
    }

    this.touchend = (event: TouchEvent) => {
      if (this.enabled === false) { return; }
      switch (event.touches.length) {
          case 0:
              this.state = STATE.NONE;
              break;

          case 1:
              this.state = STATE.TOUCH_ROTATE;
              this.moveCurr.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
              this.movePrev.copy(this.moveCurr);
              break;
      }
      this.dispatchEvent(END_EVENT);
    }

    this.contextmenu = (event: MouseEvent) => {
      event.preventDefault();
    }

    this.domElement.addEventListener( 'contextmenu', this.contextmenu, false );
    this.domElement.addEventListener( 'mousedown', this.mousedown, false );
    this.domElement.addEventListener( 'wheel', this.mousewheel, false );
  
    this.domElement.addEventListener( 'touchstart', this.touchstart, false );
    this.domElement.addEventListener( 'touchend', this.touchend, false );
    this.domElement.addEventListener( 'touchmove', this.touchmove, false );
  
    this.window.addEventListener( 'keydown', this.keydown, false );
    this.window.addEventListener( 'keyup', this.keyup, false );
  
    this.handleResize();
  
    // force an update at start
    this.update();
  
  }

  dispose (): void {
    this.domElement.removeEventListener( 'contextmenu', this.contextmenu, false );
    this.domElement.removeEventListener( 'mousedown', this.mousedown, false );
    this.domElement.removeEventListener( 'wheel', this.mousewheel, false );

    this.domElement.removeEventListener( 'touchstart', this.touchstart, false );
    this.domElement.removeEventListener( 'touchend', this.touchend, false );
    this.domElement.removeEventListener( 'touchmove', this.touchmove, false );

    document.removeEventListener( 'mousemove', this.mousemove, false );
    document.removeEventListener( 'mouseup', this.mouseup, false );

    this.window.removeEventListener( 'keydown', this.keydown, false );
    this.window.removeEventListener( 'keyup', this.keyup, false );
  }

  // ------------------------------------------------
  handleResize(): void {
    const box = this.domElement.getBoundingClientRect();
    // adjustments come from similar code in the jquery offset() function
		const d = this.domElement.ownerDocument.documentElement;
    this.screen.left = box.left + this.window.pageXOffset - d.clientLeft;
    this.screen.top = box.top + this.window.pageYOffset - d.clientTop;
    this.screen.width = box.width;
    this.screen.height = box.height;
  }

  getMouseOnScreen: any = (pageX: number, pageY: number) => {
    const vector = new THREE.Vector2();
    return vector.set(
        (pageX - this.screen.left) / this.screen.width,
        (pageY - this.screen.top) / this.screen.height
    );
  }

  getMouseOnCircle: any = (pageX: number, pageY: number) => {
    const vector = new THREE.Vector2();
    return vector.set(
        ((pageX - this.screen.width * 0.5 - this.screen.left) / (this.screen.width * 0.5)),
        ((this.screen.height + 2 * (this.screen.top - pageY)) / this.screen.width)
    );
  }

  rotateCamera = () => {
    const axis: THREE.Vector3 = new THREE.Vector3();
    const quaternion: THREE.Quaternion = new THREE.Quaternion();
    const eyeDirection: THREE.Vector3 = new THREE.Vector3();
    const objectUpDirection: THREE.Vector3 = new THREE.Vector3();
    const objectSidewaysDirection: THREE.Vector3 = new THREE.Vector3();
    const moveDirection: THREE.Vector3 = new THREE.Vector3();
    let angle: number;

    moveDirection.set(this.moveCurr.x - this.movePrev.x, this.moveCurr.y - this.movePrev.y, 0);
    angle = moveDirection.length();

    if (angle) {
        this.eye.copy(this.object.position).sub(this.target);

        eyeDirection.copy(this.eye).normalize();
        objectUpDirection.copy(this.object.up).normalize();
        objectSidewaysDirection.crossVectors(objectUpDirection, eyeDirection).normalize();

        objectUpDirection.setLength(this.moveCurr.y - this.movePrev.y);
        objectSidewaysDirection.setLength(this.moveCurr.x - this.movePrev.x);

        moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));

        axis.crossVectors(moveDirection, this.eye).normalize();

        angle *= this.rotateSpeed;
        quaternion.setFromAxisAngle(axis, angle);

        this.eye.applyQuaternion(quaternion);
        this.object.up.applyQuaternion(quaternion);

        this.lastAxis.copy(axis);
        this.lastAngle = angle;

    } else if (!this.staticMoving && this.lastAngle) {
        this.lastAngle *= Math.sqrt(1.0 - this.dynamicDampingFactor);
        this.eye.copy(this.object.position).sub(this.target);
        quaternion.setFromAxisAngle(this.lastAxis, this.lastAngle);
        this.eye.applyQuaternion(quaternion);
        this.object.up.applyQuaternion(quaternion);

    }
    this.movePrev.copy(this.moveCurr);

  }

  zoomCamera = () => {
    let factor = 0;
    if (this.state === STATE.TOUCH_ZOOM_PAN) {
        factor = this.touchZoomDistanceStart / this.touchZoomDistanceEnd;
        this.touchZoomDistanceStart = this.touchZoomDistanceEnd;
        this.eye.multiplyScalar(factor);
    } else {
      factor = 1.0 + ( this.zoomEnd.y - this.zoomStart.y ) * this.zoomSpeed;
      
      if (factor !== 1.0 && factor > 0.0 ) {
          this.eye.multiplyScalar(factor);
      }
      if (this.staticMoving) {
        this.zoomStart.copy(this.zoomEnd);
      } else {
          this.zoomStart.y += (this.zoomEnd.y - this.zoomStart.y) * this.dynamicDampingFactor;
      }
    }
  }

  panCamera = () => {
    const mouseChange: THREE.Vector2 = new THREE.Vector2();
    const objectUp: THREE.Vector3 = new THREE.Vector3();
    const pan: THREE.Vector3 = new THREE.Vector3();

    mouseChange.copy(this.panEnd).sub(this.panStart);

    if (mouseChange.lengthSq()) {

      mouseChange.multiplyScalar(this.eye.length() * this.panSpeed);

      pan.copy(this.eye).cross(this.object.up).setLength(mouseChange.x);
      pan.add(objectUp.copy(this.object.up).setLength(mouseChange.y));

      this.object.position.add(pan);
      this.target.add(pan);

      if (this.staticMoving) {
          this.panStart.copy(this.panEnd);
      } else {
          this.panStart.add(mouseChange.subVectors(this.panEnd, this.panStart).multiplyScalar(this.dynamicDampingFactor));
      }
    }
  }

  checkDistances(): void {
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
  }

  update(): void {
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
  }

  reset(): void {
    this.state = STATE.NONE;
    this.prevState = STATE.NONE;
    this.target.copy(this.target0);
    this.object.position.copy(this.position0);
    this.object.up.copy(this.up0);
    this.eye.subVectors(this.object.position, this.target);
    this.object.lookAt(this.target);
    this.dispatchEvent(CHANGE_EVENT);
    lastPosition.copy(this.object.position);
  }

}
