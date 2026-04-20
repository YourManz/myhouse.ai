import type * as THREE from 'three'

let _scene: THREE.Scene | null = null

export function setScene(scene: THREE.Scene | null) { _scene = scene }
export function getScene(): THREE.Scene | null { return _scene }
