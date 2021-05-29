import { v4 as uuid } from 'uuid'
import * as vec from 'utils/vec'
import { RectangleShape, ShapeType } from 'types'
import { registerShapeUtils } from './index'
import { boundsCollidePolygon, boundsContainPolygon } from 'utils/bounds'
import {
  getBoundsFromPoints,
  getRotatedCorners,
  translateBounds,
} from 'utils/utils'

const rectangle = registerShapeUtils<RectangleShape>({
  boundsCache: new WeakMap([]),

  create(props) {
    return {
      id: uuid(),
      type: ShapeType.Rectangle,
      isGenerated: false,
      name: 'Rectangle',
      parentId: 'page0',
      childIndex: 0,
      point: [0, 0],
      size: [1, 1],
      radius: 2,
      rotation: 0,
      isAspectRatioLocked: false,
      isLocked: false,
      isHidden: false,
      style: {
        fill: '#c6cacb',
        stroke: '#000',
      },
      ...props,
    }
  },

  render({ id, size, radius, style }) {
    return (
      <g id={id}>
        <rect
          id={id}
          rx={radius}
          ry={radius}
          width={Math.max(0, size[0] - Number(style.strokeWidth) / 2)}
          height={Math.max(0, size[1] - Number(style.strokeWidth) / 2)}
        />
      </g>
    )
  },

  applyStyles(shape, style) {
    Object.assign(shape.style, style)
    return this
  },

  getBounds(shape) {
    if (!this.boundsCache.has(shape)) {
      const [width, height] = shape.size
      const bounds = {
        minX: 0,
        maxX: width,
        minY: 0,
        maxY: height,
        width,
        height,
      }

      this.boundsCache.set(shape, bounds)
    }

    return translateBounds(this.boundsCache.get(shape), shape.point)
  },

  getRotatedBounds(shape) {
    return getBoundsFromPoints(
      getRotatedCorners(this.getBounds(shape), shape.rotation)
    )
  },

  getCenter(shape) {
    const bounds = this.getRotatedBounds(shape)
    return [bounds.minX + bounds.width / 2, bounds.minY + bounds.height / 2]
  },

  hitTest(shape) {
    return true
  },

  hitTestBounds(shape, brushBounds) {
    const rotatedCorners = getRotatedCorners(
      this.getBounds(shape),
      shape.rotation
    )

    return (
      boundsContainPolygon(brushBounds, rotatedCorners) ||
      boundsCollidePolygon(brushBounds, rotatedCorners)
    )
  },

  rotateTo(shape, rotation) {
    shape.rotation = rotation
    return this
  },

  translateTo(shape, point) {
    shape.point = vec.toPrecision(point)
    return this
  },

  transform(shape, bounds, { initialShape, transformOrigin, scaleX, scaleY }) {
    if (shape.rotation === 0) {
      shape.size = [bounds.width, bounds.height]
      shape.point = [bounds.minX, bounds.minY]
    } else {
      shape.size = vec.mul(
        initialShape.size,
        Math.min(Math.abs(scaleX), Math.abs(scaleY))
      )

      shape.point = [
        bounds.minX +
          (bounds.width - shape.size[0]) *
            (scaleX < 0 ? 1 - transformOrigin[0] : transformOrigin[0]),
        bounds.minY +
          (bounds.height - shape.size[1]) *
            (scaleY < 0 ? 1 - transformOrigin[1] : transformOrigin[1]),
      ]

      shape.rotation =
        (scaleX < 0 && scaleY >= 0) || (scaleY < 0 && scaleX >= 0)
          ? -initialShape.rotation
          : initialShape.rotation
    }

    return this
  },

  transformSingle(shape, bounds) {
    shape.size = [bounds.width, bounds.height]
    shape.point = [bounds.minX, bounds.minY]
    return this
  },

  setProperty(shape, prop, value) {
    shape[prop] = value
    return this
  },

  canTransform: true,
  canChangeAspectRatio: true,
})

export default rectangle
