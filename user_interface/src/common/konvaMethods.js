/**
 * Given refs object of Vue Konva, awaits for v-stageNode to load
 * @param {refs} vueKonvaRefs
 * @param {number} intervalDuration
 */
export const waitForKonvaStageLoad = async (refs, intervalDuration) => {
  return await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (refs.stage !== undefined) {
        resolve('ready');
        clearInterval(interval);
      }
    }, intervalDuration);
  });
};

/**
 * https://konvajs.org/docs/sandbox/Multi-touch_Scale_Stage.html
 * @param {node} stageNode
 */
export const addPinchZoomToStage = (stageNode) => {
  let lastCenter = null;
  let lastDist = 0;

  stageNode.on('touchmove', (e) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      if (stageNode.isDragging()) {
        stageNode.stopDrag();
      }

      const p1 = {
        x: touch1.clientX,
        y: touch1.clientY,
      };
      const p2 = {
        x: touch2.clientX,
        y: touch2.clientY,
      };

      if (!lastCenter) {
        lastCenter = getCenter(p1, p2);
        return;
      }
      const newCenter = getCenter(p1, p2);

      const dist = getDistance(p1, p2);

      if (!lastDist) {
        lastDist = dist;
      }

      var pointTo = {
        x: (newCenter.x - stageNode.x()) / stageNode.scaleX(),
        y: (newCenter.y - stageNode.y()) / stageNode.scaleX(),
      };

      const scale = stageNode.scaleX() * (dist / lastDist);

      stageNode.scaleX(scale);
      stageNode.scaleY(scale);

      // calculate new position of the stageNode
      const dx = newCenter.x - lastCenter.x;
      const dy = newCenter.y - lastCenter.y;

      var newPos = {
        x: newCenter.x - pointTo.x * scale + dx,
        y: newCenter.y - pointTo.y * scale + dy,
      };

      stageNode.position(newPos);
      stageNode.batchDraw();

      lastDist = dist;
      lastCenter = newCenter;
    }
  });

  stageNode.on('touchend', () => {
    lastDist = 0;
    lastCenter = null;
  });
};

const getDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const getCenter = (p1, p2) => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};