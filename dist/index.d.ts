import * as THREE from 'three';
/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga 	/ http://lantiga.github.io
 * @author Olivier Manoel 	/ http://github.com/omanoel
 */
export declare class TrackballControls extends THREE.EventDispatcher {
    object: THREE.Camera;
    domElement: HTMLElement;
    window: Window;
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
    private state;
    private prevState;
    private eye;
    private movePrev;
    private moveCurr;
    private lastAxis;
    private lastAngle;
    private zoomStart;
    private zoomEnd;
    private touchZoomDistanceStart;
    private touchZoomDistanceEnd;
    private panStart;
    private panEnd;
    private target0;
    private position0;
    private up0;
    private keydown;
    private keyup;
    private mousedown;
    private mouseup;
    private mousemove;
    private mousewheel;
    private touchstart;
    private touchmove;
    private touchend;
    private contextmenu;
    constructor(object: THREE.Camera, domElement: HTMLElement, domWindow?: Window);
    dispose(): void;
    handleResize(): void;
    getMouseOnScreen: any;
    getMouseOnCircle: any;
    rotateCamera: () => void;
    zoomCamera: () => void;
    panCamera: () => void;
    checkDistances(): void;
    update(): void;
    reset(): void;
}
