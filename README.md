# ThreeJS trackBallControls

as a standalone and typescript compatible npm module.

# Installation

```shell
npm install --save three-trackball-ts
```

# Usage

```js
import * as THREE from 'three';
import { TrackballControls } from 'three-trackball-ts';

const camera = new THREE.SomeCamera(...);
const controls = new TrackballControls(camera, renderer.domElement);

```

# Credit

All credit goes to [TrackballControls.js](https://github.com/mrdoob/three.js/blob/master/examples/js/controls/TrackballControls.js) contributors.