import * as THREE from 'three';
import { TrackballControls } from '../src';
import { expect } from 'chai';
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

describe('trackball controls', () => {
  let controls: TrackballControls;
  let container: HTMLElement;
  let window: Window;
  beforeEach(async (done) => {
    const camera = new THREE.PerspectiveCamera(50, 2, 1, 1000);
    const dom = new JSDOM('<html><body><div id="container"></div></body></html>');
    container = dom.window.document.getElementById( 'container' );
    window = dom.window;
    controls = new TrackballControls(camera, container, window);
    done();
  });
  afterEach(() => {
    window.close();
  });

  it('should be ok', () => {
    expect(controls).to.be.an.instanceOf(TrackballControls)
  });
});
