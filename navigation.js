// Screen directions follow the camera, so forward always moves up the view.
export function cameraDirection(horizontal, forward, yaw) {
  const length = Math.hypot(horizontal, forward);
  if (!length) return { x: 0, z: 0 };
  const right = horizontal / length, up = forward / length;
  return { x: Math.cos(yaw) * right - Math.sin(yaw) * up,
    z: -Math.sin(yaw) * right - Math.cos(yaw) * up };
}

export function canWalk(x, z, trees = [], terrainRule = null) {
  return (terrainRule ? terrainRule(x,z) : Math.abs(x) <= 46 && Math.abs(z) <= 46) &&
    Math.hypot((x - 10) / 1.4, z + 5) >= 4.45 &&
    !trees.some(tree => Math.hypot(x - tree.x, z - tree.z) < tree.r);
}

// Small substeps prevent fast movement tunneling through a trunk or pond.
// Sliding along either axis lets an animal steer around an obstruction.
export function walk(x, z, dx, dz, trees = [], terrainRule = null) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .2));
  for (let i = 0; i < steps; i++) {
    const nx = x + dx / steps, nz = z + dz / steps;
    if (canWalk(nx, nz, trees, terrainRule)) { x = nx; z = nz; }
    else if (canWalk(nx, z, trees, terrainRule)) x = nx;
    else if (canWalk(x, nz, trees, terrainRule)) z = nz;
  }
  return { x, z };
}

export function turnToward(current, target, amount) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * Math.min(1, amount);
}
