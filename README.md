# ThreeJS Trackball Controls

as a standalone and typescript compatible npm module.

## Non maintained since march 2021

because already provided in v0.126.1 - use that instead

```js
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';

```

## Installation

```shell
npm install --save three-trackballcontrols-ts
```

## Usage

```js
import * as THREE from 'three';
import { TrackballControls } from 'three-trackballcontrols-ts';

const camera = new THREE.SomeCamera(...);
const controls = new TrackballControls(camera, renderer.domElement);

```

## Credit

All credit goes to [TrackballControls.js](https://github.com/mrdoob/three.js/blob/master/examples/js/controls/TrackballControls.js) contributors.
