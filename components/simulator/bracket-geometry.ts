export type BracketSide = "left" | "right";

export type MatchRect = {
  left: number;
  right: number;
  connectorY: number;
};

const CONNECTOR_STUB = 14;
const CONNECTOR_MIN_GAP = 18;

export function getConnectorPath(
  parentRect: MatchRect,
  childARect: MatchRect,
  childBRect: MatchRect,
  side: BracketSide
): string {
  const childAEdgeX = getMatchEdgeX(childARect, side, "from-child");
  const childBEdgeX = getMatchEdgeX(childBRect, side, "from-child");
  const parentEdgeX = getMatchEdgeX(parentRect, side, "to-parent");
  const childForkX = getForkX(childAEdgeX, childBEdgeX, parentEdgeX, side);
  const parentForkX = getParentForkX(childForkX, parentEdgeX, side);

  const childAY = roundCoordinate(childARect.connectorY);
  const childBY = roundCoordinate(childBRect.connectorY);
  const parentY = roundCoordinate(parentRect.connectorY);
  const trunkTop = Math.min(childAY, childBY);
  const trunkBottom = Math.max(childAY, childBY);

  return [
    drawHorizontal(childAEdgeX, childForkX, childAY),
    drawHorizontal(childBEdgeX, childForkX, childBY),
    `M ${childForkX} ${trunkTop} V ${trunkBottom}`,
    drawHorizontal(childForkX, parentForkX, parentY),
    drawHorizontal(parentForkX, parentEdgeX, parentY)
  ].join(" ");
}

export function getFinalConnectorPath(parentRect: MatchRect, childRect: MatchRect, side: BracketSide): string {
  const childEdgeX = getMatchEdgeX(childRect, side, "from-child");
  const parentEdgeX = getMatchEdgeX(parentRect, side, "to-parent");
  const joinX = getForkX(childEdgeX, childEdgeX, parentEdgeX, side);

  const childY = roundCoordinate(childRect.connectorY);
  const parentY = roundCoordinate(parentRect.connectorY);
  const verticalTop = Math.min(childY, parentY);
  const verticalBottom = Math.max(childY, parentY);

  return [
    drawHorizontal(childEdgeX, joinX, childY),
    `M ${joinX} ${verticalTop} V ${verticalBottom}`,
    drawHorizontal(joinX, parentEdgeX, parentY)
  ].join(" ");
}

function getMatchEdgeX(rect: MatchRect, side: BracketSide, direction: "from-child" | "to-parent"): number {
  const useRightEdge =
    (side === "left" && direction === "from-child") || (side === "right" && direction === "to-parent");

  return roundCoordinate(useRightEdge ? rect.right : rect.left);
}

function getForkX(childAEdgeX: number, childBEdgeX: number, parentEdgeX: number, side: BracketSide): number {
  const dir = side === "left" ? 1 : -1;
  const childEdgeX = (childAEdgeX + childBEdgeX) / 2;
  const availableSpace = Math.max(Math.abs(parentEdgeX - childEdgeX), CONNECTOR_MIN_GAP);
  const forkOffset = Math.max(CONNECTOR_STUB, availableSpace * 0.42);

  return roundCoordinate(childEdgeX + dir * forkOffset);
}

function getParentForkX(childForkX: number, parentEdgeX: number, side: BracketSide): number {
  const dir = side === "left" ? -1 : 1;
  const parentStubX = parentEdgeX + dir * CONNECTOR_STUB;
  const crossesParent = side === "left" ? parentStubX < childForkX : parentStubX > childForkX;

  return roundCoordinate(crossesParent ? parentStubX : (childForkX + parentEdgeX) / 2);
}

function drawHorizontal(fromX: number, toX: number, y: number): string {
  return `M ${roundCoordinate(fromX)} ${roundCoordinate(y)} H ${roundCoordinate(toX)}`;
}

function roundCoordinate(value: number): number {
  return Math.round(value * 2) / 2;
}
