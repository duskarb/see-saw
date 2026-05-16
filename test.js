const visibleBlocks = new Map([
  ['a', 0.5],
  ['b', 1.0],
  ['c', 0.8]
]);
const top2 = [...visibleBlocks.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
console.log(top2);
