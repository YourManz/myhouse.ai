import { getScene } from '@/lib/sceneStore'

function downloadBlob(buf: ArrayBuffer, filename: string, mime: string) {
  const blob = new Blob([buf], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadText(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportGLTF(title = 'house'): Promise<void> {
  const scene = getScene()
  if (!scene) {
    alert('Open the 3D view first, then export.')
    return
  }
  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js')
  const exporter = new GLTFExporter()
  exporter.parse(
    scene,
    (result) => {
      if (result instanceof ArrayBuffer) {
        downloadBlob(result, `${title}.glb`, 'model/gltf-binary')
      } else {
        downloadText(JSON.stringify(result, null, 2), `${title}.gltf`, 'model/gltf+json')
      }
    },
    (err) => { console.error(err); alert('Export failed — check console.') },
    { binary: true },
  )
}

export async function exportOBJ(title = 'house'): Promise<void> {
  const scene = getScene()
  if (!scene) {
    alert('Open the 3D view first, then export.')
    return
  }
  const { OBJExporter } = await import('three/addons/exporters/OBJExporter.js')
  const exporter = new OBJExporter()
  const obj = exporter.parse(scene)
  downloadText(obj, `${title}.obj`, 'model/obj')
}
