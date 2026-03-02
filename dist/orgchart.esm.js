class OrgChart {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.data = options.data || [];
    this.nodeWidth = options.nodeWidth || 200;
    this.nodeHeight = options.nodeHeight || 100;
    this.levelGap = options.levelGap || 80;
    this.siblingGap = options.siblingGap || 20;
    this.layout = options.layout || 'tree';
    this.theme = options.theme || 'corporate';
    this.direction = options.direction || 'vertical';
    this.connectorStyle = options.connectorStyle || 'curved';
    this.displayMode = options.displayMode || 'person';
    this.onNodeClick = options.onNodeClick || null;
    this.themes = this.getThemes();
    this.render();
  }

  getThemes() {
    return {
      corporate: {
        primary: '#1a365d',
        secondary: '#2d3748',
        accent: '#3182ce',
        background: '#ffffff',
        text: '#1a202c',
        textLight: '#718096',
        border: '#e2e8f0',
        gradient: ['#1a365d', '#2c5282'],
        nodeRadius: '12px',
        shadow: '0 4px 20px rgba(0,0,0,0.08)'
      },
      startup: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        background: '#ffffff',
        text: '#1f2937',
        textLight: '#6b7280',
        border: '#e5e7eb',
        gradient: ['#6366f1', '#8b5cf6'],
        nodeRadius: '16px',
        shadow: '0 8px 30px rgba(99,102,241,0.15)'
      },
      modern: {
        primary: '#0f172a',
        secondary: '#334155',
        accent: '#06b6d4',
        background: '#ffffff',
        text: '#0f172a',
        textLight: '#64748b',
        border: '#e2e8f0',
        gradient: ['#0f172a', '#1e293b'],
        nodeRadius: '8px',
        shadow: '0 4px 16px rgba(0,0,0,0.06)'
      },
      minimal: {
        primary: '#18181b',
        secondary: '#3f3f46',
        accent: '#a1a1aa',
        background: '#fafafa',
        text: '#18181b',
        textLight: '#71717a',
        border: '#e4e4e7',
        gradient: ['#18181b', '#27272a'],
        nodeRadius: '4px',
        shadow: '0 1px 3px rgba(0,0,0,0.1)'
      },
      vibrant: {
        primary: '#7c3aed',
        secondary: '#db2777',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937',
        textLight: '#6b7280',
        border: '#f3e8ff',
        gradient: ['#7c3aed', '#db2777'],
        nodeRadius: '20px',
        shadow: '0 10px 40px rgba(124,58,237,0.2)'
      }
    };
  }

  render() {
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';
    this.container.style.background = this.themes[this.theme].background;
    
    const root = this.data.find(n => !n.parentId);
    if (!root) return;

    const tree = this.buildTree(root.id);
    let positions;
    
    switch (this.layout) {
      case 'radial': positions = this.calculateRadialPositions(tree); break;
      case 'galaxy': positions = this.calculateGalaxyPositions(tree); break;
      case 'bracket': positions = this.calculateBracketPositions(tree); break;
      case 'donut': positions = this.calculateDonutPositions(tree); break;
      default: positions = this.calculatePositions(tree);
    }
    
    positions = this.fitToContainer(positions);
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0';
    
    if (['radial', 'galaxy', 'donut'].includes(this.layout)) this.drawRadialBackground(svg, positions);
    this.drawConnections(svg, positions);
    this.container.appendChild(svg);
    this.drawNodes(positions);
  }

  buildTree(nodeId) {
    const node = this.data.find(n => n.id === nodeId);
    const children = this.data.filter(n => n.parentId === nodeId).map(c => this.buildTree(c.id));
    return { ...node, children };
  }

  calculatePositions(node, level = 0) {
    const positions = this.layoutTree(node, level);
    const minX = Math.min(...positions.map(p => p.x));
    return positions.map(p => ({ ...p, x: p.x - minX + 20 }));
  }

  layoutTree(node, level, offset = 0) {
    const positions = [];
    let x = offset;
    const gap = this.direction === 'horizontal' ? this.levelGap : this.nodeHeight + this.levelGap;

    if (node.children.length === 0) {
      const pos = this.direction === 'horizontal'
        ? { x: level * (this.nodeWidth + this.levelGap), y: offset }
        : { x: offset, y: level * gap };
      positions.push({ ...node, ...pos, level });
      return positions;
    }

    node.children.forEach(child => {
      const childPos = this.layoutTree(child, level + 1, x);
      positions.push(...childPos);
      x += this.getSubtreeWidth(child);
    });

    const firstChild = positions.find(p => p.id === node.children[0].id);
    const lastChild = positions.find(p => p.id === node.children[node.children.length - 1].id);
    
    const pos = this.direction === 'horizontal'
      ? { x: level * (this.nodeWidth + this.levelGap), y: (firstChild.y + lastChild.y) / 2 }
      : { x: (firstChild.x + lastChild.x) / 2, y: level * gap };
    
    positions.push({ ...node, ...pos, level });
    return positions;
  }

  getSubtreeWidth(node) {
    if (node.children.length === 0) return this.nodeWidth + this.siblingGap;
    return node.children.reduce((sum, child) => sum + this.getSubtreeWidth(child), 0);
  }

  calculateRadialPositions(tree) {
    const positions = [];
    const centerX = this.container.offsetWidth / 2;
    const centerY = this.container.offsetHeight / 2;
    
    const assignAngles = (node, startAngle, endAngle, level) => {
      const angle = (startAngle + endAngle) / 2;
      const radius = level * (this.levelGap + this.nodeWidth);
      
      positions.push({
        ...node,
        x: centerX + radius * Math.cos(angle) - this.nodeWidth / 2,
        y: centerY + radius * Math.sin(angle) - this.nodeWidth / 2,
        level, angle, radius,
        isCenter: level === 0
      });
      
      if (node.children.length > 0) {
        const angleRange = endAngle - startAngle;
        const leafCounts = node.children.map(c => this.countLeaves(c));
        const totalLeaves = leafCounts.reduce((a, b) => a + b, 0);
        
        let currentAngle = startAngle;
        node.children.forEach((child, i) => {
          const childAngleRange = (leafCounts[i] / totalLeaves) * angleRange;
          assignAngles(child, currentAngle, currentAngle + childAngleRange, level + 1);
          currentAngle += childAngleRange;
        });
      }
    };
    
    positions.push({
      ...tree,
      x: centerX - this.nodeWidth / 2,
      y: centerY - this.nodeWidth / 2,
      level: 0, angle: 0, radius: 0, isCenter: true
    });
    
    if (tree.children.length > 0) {
      const leafCounts = tree.children.map(c => this.countLeaves(c));
      const totalLeaves = leafCounts.reduce((a, b) => a + b, 0);
      
      let currentAngle = -Math.PI / 2;
      tree.children.forEach((child, i) => {
        const childAngleRange = (leafCounts[i] / totalLeaves) * Math.PI * 2;
        assignAngles(child, currentAngle, currentAngle + childAngleRange, 1);
        currentAngle += childAngleRange;
      });
    }
    
    this.maxRadialLevel = this.getMaxLevel(tree, 0);
    this.radialCenter = { x: centerX, y: centerY };
    return positions;
  }

  countLeaves(node) {
    if (node.children.length === 0) return 1;
    return node.children.reduce((sum, child) => sum + this.countLeaves(child), 0);
  }

  calculateGalaxyPositions(tree) {
    const positions = [];
    const centerX = this.container.offsetWidth / 2;
    const centerY = this.container.offsetHeight / 2;
    
    positions.push({
      ...tree, x: centerX - this.nodeWidth / 2, y: centerY - this.nodeWidth / 2,
      level: 0, isCenter: true
    });
    
    const allChildren = this.flattenChildren(tree, 1);
    const total = allChildren.length;
    
    allChildren.forEach((item, i) => {
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
      const baseRadius = (this.levelGap + this.nodeWidth) * 1.5;
      const radius = baseRadius + (item.level - 1) * this.nodeWidth * 0.3;
      const wobble = Math.sin(i * 2.5) * 20;
      
      positions.push({
        ...item.node,
        x: centerX + (radius + wobble) * Math.cos(angle) - this.nodeWidth / 2,
        y: centerY + (radius + wobble) * Math.sin(angle) - this.nodeWidth / 2,
        level: item.level, angle, radius
      });
    });
    
    this.maxRadialLevel = this.getMaxLevel(tree, 0);
    this.radialCenter = { x: centerX, y: centerY };
    return positions;
  }

  flattenChildren(node, level) {
    let result = [];
    node.children.forEach(child => {
      result.push({ node: child, level });
      result = result.concat(this.flattenChildren(child, level + 1));
    });
    return result;
  }

  calculateBracketPositions(tree) {
    const positions = [];
    const centerX = this.container.offsetWidth / 2;
    const centerY = this.container.offsetHeight / 2;
    const isVertical = this.direction === 'vertical';
    
    // 루트를 중앙에 배치
    positions.push({ ...tree, x: centerX - this.nodeWidth / 2, y: centerY - this.nodeHeight / 2, level: 0, bracketDir: 0 });
    
    if (tree.children.length === 0) return positions;
    
    // 자식들을 양쪽으로 분배
    const half = Math.ceil(tree.children.length / 2);
    const firstHalf = tree.children.slice(0, half);
    const secondHalf = tree.children.slice(half);
    
    const placeSubtree = (nodes, direction) => {
      if (nodes.length === 0) return;
      
      const totalSize = nodes.reduce((sum, n) => sum + this.getBracketSubtreeSize(n, isVertical) + this.siblingGap, -this.siblingGap);
      
      let current = isVertical 
        ? centerY - totalSize / 2
        : centerX - totalSize / 2;
      
      nodes.forEach(node => {
        const subtreeSize = this.getBracketSubtreeSize(node, isVertical);
        const offset = current + subtreeSize / 2;
        
        let nodeX, nodeY;
        if (isVertical) {
          nodeX = centerX + direction * (this.nodeWidth / 2 + this.levelGap + this.nodeWidth / 2);
          nodeY = offset - this.nodeHeight / 2;
        } else {
          nodeX = offset - this.nodeWidth / 2;
          nodeY = centerY + direction * (this.nodeHeight / 2 + this.levelGap + this.nodeHeight / 2);
        }
        
        positions.push({ ...node, x: nodeX, y: nodeY, level: 1, bracketDir: direction });
        
        if (node.children && node.children.length > 0) {
          this.placeBracketChildren(node, nodeX, nodeY, direction, positions, 2, isVertical);
        }
        
        current += subtreeSize + this.siblingGap;
      });
    };
    
    placeSubtree(firstHalf, -1);
    placeSubtree(secondHalf, 1);
    
    return positions;
  }

  placeBracketChildren(parent, parentX, parentY, direction, positions, level, isVertical) {
    const children = parent.children;
    if (children.length === 0) return;
    
    const totalSize = children.reduce((sum, n) => sum + this.getBracketSubtreeSize(n, isVertical) + this.siblingGap, -this.siblingGap);
    
    let current = isVertical
      ? parentY + this.nodeHeight / 2 - totalSize / 2
      : parentX + this.nodeWidth / 2 - totalSize / 2;
    
    children.forEach(child => {
      const subtreeSize = this.getBracketSubtreeSize(child, isVertical);
      const offset = current + subtreeSize / 2;
      
      let childX, childY;
      if (isVertical) {
        childX = parentX + direction * (this.nodeWidth + this.levelGap);
        childY = offset - this.nodeHeight / 2;
      } else {
        childX = offset - this.nodeWidth / 2;
        childY = parentY + direction * (this.nodeHeight + this.levelGap);
      }
      
      positions.push({ ...child, x: childX, y: childY, level, bracketDir: direction });
      
      if (child.children.length > 0) {
        this.placeBracketChildren(child, childX, childY, direction, positions, level + 1, isVertical);
      }
      
      current += subtreeSize + this.siblingGap;
    });
  }

  getBracketSubtreeSize(node, isVertical) {
    const nodeSize = isVertical ? this.nodeHeight : this.nodeWidth;
    if (node.children.length === 0) return nodeSize;
    const childrenSize = node.children.reduce((sum, child) => sum + this.getBracketSubtreeSize(child, isVertical) + this.siblingGap, -this.siblingGap);
    return Math.max(nodeSize, childrenSize);
  }

  calculateDonutPositions(tree) {
    const positions = [];
    const centerX = this.container.offsetWidth / 2;
    const centerY = this.container.offsetHeight / 2;
    const maxLevel = this.getMaxLevel(tree, 0);
    
    // 각 노드의 리프 수 계산
    const leafCounts = new Map();
    const countLeaves = (node) => {
      if (node.children.length === 0) {
        leafCounts.set(node.id, 1);
        return 1;
      }
      const count = node.children.reduce((sum, child) => sum + countLeaves(child), 0);
      leafCounts.set(node.id, count);
      return count;
    };
    const totalLeaves = countLeaves(tree);
    
    // 링 두께 설정
    const ringWidth = 50;
    const ringGap = 8;
    const innerRadius = 60;
    
    // 중앙 원
    positions.push({
      ...tree,
      x: centerX, y: centerY,
      level: 0, isCenter: true,
      isDonutSegment: true,
      innerRadius: 0, outerRadius: innerRadius,
      arcStart: 0, arcEnd: Math.PI * 2
    });
    
    // 레벨별로 호 세그먼트 배치
    const placeLevel = (nodes, level, parentAngles) => {
      const r1 = innerRadius + (level - 1) * (ringWidth + ringGap);
      const r2 = r1 + ringWidth;
      
      nodes.forEach(node => {
        const parentAngle = parentAngles.get(node.parentId);
        const parentLeaves = leafCounts.get(node.parentId);
        const nodeLeaves = leafCounts.get(node.id);
        
        // 부모 각도 범위 내에서 비율에 따라 배치
        const siblings = nodes.filter(n => n.parentId === node.parentId);
        const siblingIndex = siblings.indexOf(node);
        const prevSiblingsLeaves = siblings.slice(0, siblingIndex).reduce((sum, s) => sum + leafCounts.get(s.id), 0);
        
        const parentRange = parentAngle.end - parentAngle.start;
        const startRatio = prevSiblingsLeaves / parentLeaves;
        const endRatio = (prevSiblingsLeaves + nodeLeaves) / parentLeaves;
        
        const arcStart = parentAngle.start + parentRange * startRatio;
        const arcEnd = parentAngle.start + parentRange * endRatio;
        
        positions.push({
          ...node,
          x: centerX, y: centerY,
          level,
          isDonutSegment: true,
          innerRadius: r1, outerRadius: r2,
          arcStart, arcEnd
        });
        
        parentAngles.set(node.id, { start: arcStart, end: arcEnd });
      });
    };
    
    // 레벨별 노드 수집
    const levelNodes = [];
    const collectByLevel = (node, level) => {
      if (!levelNodes[level]) levelNodes[level] = [];
      if (level > 0) levelNodes[level].push(node);
      node.children.forEach(child => collectByLevel(child, level + 1));
    };
    collectByLevel(tree, 0);
    
    const parentAngles = new Map();
    parentAngles.set(tree.id, { start: -Math.PI / 2, end: Math.PI * 1.5 });
    
    levelNodes.forEach((nodes, level) => {
      if (level > 0 && nodes.length > 0) {
        placeLevel(nodes, level, parentAngles);
      }
    });
    
    this.maxRadialLevel = maxLevel;
    this.radialCenter = { x: centerX, y: centerY };
    this.donutRingWidth = ringWidth;
    this.donutInnerRadius = innerRadius;
    
    return positions;
  }

  getMaxLevel(node, level) {
    if (node.children.length === 0) return level;
    return Math.max(...node.children.map(child => this.getMaxLevel(child, level + 1)));
  }

  fitToContainer(positions) {
    const containerW = this.container.offsetWidth;
    const containerH = this.container.offsetHeight;
    const padding = 40;
    
    const nodeH = this.layout === 'radial' ? this.nodeWidth : this.nodeHeight;
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x + this.nodeWidth));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y + nodeH));
    
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    
    const scaleX = (containerW - padding * 2) / contentW;
    const scaleY = (containerH - padding * 2) / contentH;
    this.scale = Math.min(scaleX, scaleY, 1);
    
    const scaledW = contentW * this.scale;
    const scaledH = contentH * this.scale;
    const offsetX = (containerW - scaledW) / 2 - minX * this.scale;
    const offsetY = (containerH - scaledH) / 2 - minY * this.scale;
    
    if (this.layout === 'radial' && this.radialCenter) {
      this.radialCenter.x = this.radialCenter.x * this.scale + offsetX;
      this.radialCenter.y = this.radialCenter.y * this.scale + offsetY;
    }
    
    // 도넛 레이아웃은 스케일만 적용
    if (this.layout === 'donut') {
      return positions.map(p => ({
        ...p,
        innerRadius: (p.innerRadius || 0) * this.scale,
        outerRadius: (p.outerRadius || 0) * this.scale
      }));
    }
    
    return positions.map(p => ({ ...p, x: p.x * this.scale + offsetX, y: p.y * this.scale + offsetY }));
  }

  drawDonutSegments(svg, positions) {
    const t = this.themes[this.theme];
    const s = this.scale || 1;
    const centerX = this.container.offsetWidth / 2;
    const centerY = this.container.offsetHeight / 2;
    
    const levelColors = [
      t.gradient,
      [t.accent, t.secondary],
      ['#10b981', '#059669'],
      ['#f59e0b', '#d97706'],
      ['#ec4899', '#db2777']
    ];
    
    positions.forEach(node => {
      if (!node.isDonutSegment) return;
      
      const colors = levelColors[node.level % levelColors.length];
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      if (node.isCenter) {
        // 중앙 원
        path.setAttribute('d', this.describeArc(centerX, centerY, 0, node.outerRadius, 0, Math.PI * 2));
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        grad.setAttribute('id', `grad-${node.id}`);
        grad.innerHTML = `<stop offset="0%" stop-color="${colors[0]}"/><stop offset="100%" stop-color="${colors[1]}"/>`;
        svg.querySelector('defs').appendChild(grad);
        path.setAttribute('fill', `url(#grad-${node.id})`);
      } else {
        // 호 세그먼트
        const gap = 0.01; // 세그먼트 간 간격
        const d = this.describeArc(centerX, centerY, node.innerRadius, node.outerRadius, node.arcStart + gap, node.arcEnd - gap);
        path.setAttribute('d', d);
        path.setAttribute('fill', colors[0]);
        path.setAttribute('opacity', 0.8 - (node.level * 0.1));
      }
      
      path.setAttribute('stroke', '#fff');
      path.setAttribute('stroke-width', '2');
      path.style.cursor = 'pointer';
      path.style.transition = 'opacity 0.2s';
      
      path.onmouseenter = () => path.setAttribute('opacity', '1');
      path.onmouseleave = () => path.setAttribute('opacity', node.isCenter ? '1' : 0.8 - (node.level * 0.1));
      if (this.onNodeClick) path.onclick = () => this.onNodeClick(node);
      
      svg.appendChild(path);
      
      // 텍스트 위치: 세그먼트 중앙
      let textX, textY;
      if (node.isCenter) {
        textX = centerX;
        textY = centerY;
      } else {
        const midAngle = (node.arcStart + node.arcEnd) / 2;
        const midRadius = (node.innerRadius + node.outerRadius) / 2;
        textX = centerX + midRadius * Math.cos(midAngle);
        textY = centerY + midRadius * Math.sin(midAngle);
      }
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', textX);
      text.setAttribute('y', node.isCenter ? textY - 8 * s : textY);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', '#fff');
      text.setAttribute('font-size', node.isCenter ? 14 * s : 10 * s);
      text.setAttribute('font-weight', '600');
      text.setAttribute('pointer-events', 'none');
      text.textContent = this.displayMode === 'department' ? (node.department || node.name) : node.name;
      svg.appendChild(text);
      
      if (node.isCenter && node.title) {
        const subText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        subText.setAttribute('x', textX);
        subText.setAttribute('y', textY + 10 * s);
        subText.setAttribute('text-anchor', 'middle');
        subText.setAttribute('dominant-baseline', 'middle');
        subText.setAttribute('fill', 'rgba(255,255,255,0.8)');
        subText.setAttribute('font-size', 11 * s);
        subText.setAttribute('pointer-events', 'none');
        subText.textContent = node.title;
        svg.appendChild(subText);
      }
    });
  }

  describeArc(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
    const start1 = { x: cx + outerRadius * Math.cos(startAngle), y: cy + outerRadius * Math.sin(startAngle) };
    const end1 = { x: cx + outerRadius * Math.cos(endAngle), y: cy + outerRadius * Math.sin(endAngle) };
    const start2 = { x: cx + innerRadius * Math.cos(endAngle), y: cy + innerRadius * Math.sin(endAngle) };
    const end2 = { x: cx + innerRadius * Math.cos(startAngle), y: cy + innerRadius * Math.sin(startAngle) };
    
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    
    if (innerRadius === 0) {
      // 원 (중앙)
      return `M ${cx} ${cy} m ${-outerRadius} 0 a ${outerRadius} ${outerRadius} 0 1 0 ${outerRadius * 2} 0 a ${outerRadius} ${outerRadius} 0 1 0 ${-outerRadius * 2} 0`;
    }
    
    return `M ${start1.x} ${start1.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${end1.x} ${end1.y} L ${start2.x} ${start2.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${end2.x} ${end2.y} Z`;
  }

  drawRadialBackground(svg, positions) {
    const t = this.themes[this.theme];
    if (!this.maxRadialLevel || this.layout === 'donut') return;
    
    // 배경 그라데이션 원
    for (let level = this.maxRadialLevel; level >= 1; level--) {
      const radius = level * (this.levelGap + this.nodeWidth) * this.scale;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', this.radialCenter.x);
      circle.setAttribute('cy', this.radialCenter.y);
      circle.setAttribute('r', radius);
      circle.setAttribute('stroke', t.accent);
      circle.setAttribute('stroke-width', '1');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('opacity', 0.15 - (level * 0.02));
      svg.appendChild(circle);
    }
  }

  drawConnections(svg, positions) {
    const t = this.themes[this.theme];
    const s = this.scale || 1;
    const nw = this.nodeWidth * s;
    const nh = this.nodeHeight * s;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'lineGradient');
    gradient.innerHTML = `<stop offset="0%" stop-color="${t.gradient[0]}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${t.gradient[1]}" stop-opacity="0.3"/>`;
    defs.appendChild(gradient);
    svg.appendChild(defs);

    // 도넛 레이아웃은 연결선 없이 세그먼트로 표현
    if (this.layout === 'donut') {
      this.drawDonutSegments(svg, positions);
      return;
    }

    // 중복 라인 방지를 위한 Set
    const drawnLines = new Set();
    
    positions.forEach(node => {
      if (!node.parentId) return;
      const parent = positions.find(p => p.id === node.parentId);
      if (!parent) return;
      
      const lineKey = `${parent.id}-${node.id}`;
      if (drawnLines.has(lineKey)) return;
      drawnLines.add(lineKey);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let d;

      if (this.layout === 'radial' || this.layout === 'galaxy') {
        const x1 = parent.x + nw / 2, y1 = parent.y + nw / 2;
        const x2 = node.x + nw / 2, y2 = node.y + nw / 2;
        const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
        const cx = midX + (y2 - y1) * 0.15, cy = midY - (x2 - x1) * 0.15;
        d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
      } else if (this.layout === 'bracket') {
        const dir = node.bracketDir;
        
        if (this.direction === 'vertical') {
          // 수직 브라켓: 좌우로 뻗어나감
          const x1 = parent.x + nw / 2;
          const y1 = parent.y + nh / 2;
          const x2 = node.x + nw / 2;
          const y2 = node.y + nh / 2;
          
          // 부모에서 수평으로 나가서 자식으로 연결
          const midX = dir < 0 
            ? Math.min(parent.x, node.x + nw) - this.levelGap * s / 2
            : Math.max(parent.x + nw, node.x) + this.levelGap * s / 2;
          
          d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        } else {
          // 수평 브라켓: 상하로 뻗어나감
          const x1 = parent.x + nw / 2;
          const y1 = parent.y + nh / 2;
          const x2 = node.x + nw / 2;
          const y2 = node.y + nh / 2;
          
          const midY = dir < 0
            ? Math.min(parent.y, node.y + nh) - this.levelGap * s / 2
            : Math.max(parent.y + nh, node.y) + this.levelGap * s / 2;
          
          d = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
        }
      } else if (this.direction === 'horizontal') {
        const x1 = parent.x + nw, y1 = parent.y + nh / 2;
        const x2 = node.x, y2 = node.y + nh / 2;
        const midX = (x1 + x2) / 2;
        d = this.connectorStyle === 'curved'
          ? `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
          : `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
      } else {
        const x1 = parent.x + nw / 2, y1 = parent.y + nh;
        const x2 = node.x + nw / 2, y2 = node.y;
        const midY = (y1 + y2) / 2;
        d = this.connectorStyle === 'curved'
          ? `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
          : `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
      }

      line.setAttribute('d', d);
      const isCircular = ['radial', 'galaxy'].includes(this.layout);
      line.setAttribute('stroke', isCircular ? t.accent : 'url(#lineGradient)');
      line.setAttribute('stroke-width', isCircular ? '1.5' : '2');
      line.setAttribute('fill', 'none');
      line.setAttribute('opacity', isCircular ? '0.3' : '1');
      svg.appendChild(line);
    });
  }

  drawNodes(positions) {
    const t = this.themes[this.theme];
    const s = this.scale || 1;
    const nw = this.nodeWidth * s;
    const nh = this.nodeHeight * s;

    // 도넛 레이아웃은 SVG로 그려짐
    if (this.layout === 'donut') return;

    positions.forEach(node => {
      const div = document.createElement('div');
      div.className = 'org-node';
      div.style.cssText = `position:absolute;left:${node.x}px;top:${node.y}px;width:${nw}px;height:${nh}px;
        box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:center;
        z-index:1;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;`;

      const isCircular = ['radial', 'galaxy'].includes(this.layout);
      
      if (isCircular) {
        div.style.width = div.style.height = nw + 'px';
        div.style.top = (node.y + nh / 2 - nw / 2) + 'px';
        div.style.borderRadius = '50%';
        
        if (node.isCenter) {
          div.style.background = `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})`;
          div.style.color = '#fff';
          div.style.boxShadow = `0 8px 32px ${t.gradient[0]}40`;
          div.style.width = div.style.height = (nw * 1.3) + 'px';
          div.style.left = (node.x - nw * 0.15) + 'px';
          div.style.top = (node.y + nh / 2 - nw * 0.65) + 'px';
        } else {
          const levelColors = [
            [t.gradient[0], t.gradient[1]],
            [t.accent, t.secondary],
            ['#10b981', '#059669'],
            ['#f59e0b', '#d97706'],
            ['#ec4899', '#db2777']
          ];
          const colors = levelColors[(node.level - 1) % levelColors.length];
          div.style.background = `linear-gradient(135deg, ${colors[0]}15, ${colors[1]}15)`;
          div.style.border = `${2 * s}px solid ${colors[0]}`;
          div.style.boxShadow = `0 4px 16px ${colors[0]}20`;
        }
      } else {
        div.style.borderRadius = t.nodeRadius;
        div.style.background = t.background;
        div.style.boxShadow = t.shadow;
        
        if (node.level === 0) {
          div.style.background = `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})`;
          div.style.color = '#fff';
        } else {
          div.style.border = `1px solid ${t.border}`;
        }
      }

      div.onmouseenter = () => { div.style.transform = 'scale(1.03)'; div.style.boxShadow = t.shadow.replace(')', ', 0 8px 25px rgba(0,0,0,0.12))'); };
      div.onmouseleave = () => { div.style.transform = 'scale(1)'; div.style.boxShadow = t.shadow; };
      if (this.onNodeClick) div.onclick = () => this.onNodeClick(node);

      const isLight = node.level === 0 || (this.layout === 'radial' && node.isCenter);
      const content = this.createNodeContent(node, s, isLight, t);
      div.appendChild(content);
      this.container.appendChild(div);
    });
  }

  createNodeContent(node, s, isLight, t) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `padding:${12 * s}px;text-align:center;width:100%;box-sizing:border-box;`;

    if (node.image && this.displayMode === 'person') {
      const img = document.createElement('img');
      img.src = node.image;
      img.style.cssText = `width:${40 * s}px;height:${40 * s}px;border-radius:50%;object-fit:cover;
        margin-bottom:${6 * s}px;border:2px solid ${isLight ? 'rgba(255,255,255,0.3)' : t.border};`;
      wrapper.appendChild(img);
    }

    const primary = document.createElement('div');
    const secondary = document.createElement('div');
    
    if (this.displayMode === 'department') {
      primary.textContent = node.department || node.name;
      secondary.textContent = node.name;
    } else {
      primary.textContent = node.name;
      secondary.textContent = node.title || '';
    }
    
    primary.style.cssText = `font-weight:600;font-size:${(this.layout === 'radial' ? 13 : 14) * s}px;
      margin-bottom:${2 * s}px;color:${isLight ? '#fff' : t.text};line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
    wrapper.appendChild(primary);

    if (secondary.textContent && secondary.textContent !== primary.textContent) {
      secondary.style.cssText = `font-size:${(this.layout === 'radial' ? 11 : 12) * s}px;
        color:${isLight ? 'rgba(255,255,255,0.85)' : t.textLight};line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
      wrapper.appendChild(secondary);
    }

    if (this.displayMode === 'person' && node.department && this.layout !== 'radial') {
      const dept = document.createElement('div');
      dept.textContent = node.department;
      dept.style.cssText = `font-size:${10 * s}px;color:${t.accent};margin-top:${4 * s}px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
      wrapper.appendChild(dept);
    }

    return wrapper;
  }

  setDisplayMode(mode) {
    this.displayMode = mode;
    this.render();
  }

  setTheme(theme) {
    if (this.themes[theme]) {
      this.theme = theme;
      this.render();
    }
  }

  setLayout(layout) {
    this.layout = layout;
    this.render();
  }

  setDirection(direction) {
    this.direction = direction;
    this.render();
  }

  setConnectorStyle(style) {
    this.connectorStyle = style;
    this.render();
  }

  updateData(data) {
    this.data = data;
    this.render();
  }

  exportPNG(filename = 'orgchart.png') {
    const rect = this.container.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = this.themes[this.theme].background;
    ctx.fillRect(0, 0, rect.width, rect.height);

    const svg = this.container.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        URL.revokeObjectURL(url);
        this.drawNodesToCanvas(ctx);
        this.downloadCanvas(canvas, filename);
      };
      img.src = url;
    } else {
      this.drawNodesToCanvas(ctx);
      this.downloadCanvas(canvas, filename);
    }
  }

  drawNodesToCanvas(ctx) {
    const t = this.themes[this.theme];
    const nodes = this.container.querySelectorAll('.org-node');
    
    nodes.forEach(node => {
      const x = parseFloat(node.style.left);
      const y = parseFloat(node.style.top);
      const w = parseFloat(node.style.width);
      const h = parseFloat(node.style.height);
      const isCircle = node.style.borderRadius === '50%';
      const isGradient = node.style.background.includes('gradient');

      ctx.save();
      if (isCircle) {
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
      } else {
        const r = parseInt(t.nodeRadius) || 8;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
      }

      if (isGradient) {
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, t.gradient[0]);
        grad.addColorStop(1, t.gradient[1]);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = t.background;
      }
      ctx.fill();

      if (!isGradient) {
        ctx.strokeStyle = isCircle ? t.accent : t.border;
        ctx.lineWidth = isCircle ? 2 : 1;
        ctx.stroke();
      }
      ctx.restore();

      const texts = node.querySelectorAll('div > div');
      ctx.textAlign = 'center';
      let textY = y + h / 2 - (texts.length - 1) * 8;

      texts.forEach((text, i) => {
        const fontSize = parseFloat(text.style.fontSize) || 12;
        const fontWeight = text.style.fontWeight === '600' ? 'bold' : 'normal';
        ctx.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.fillStyle = text.style.color || t.text;
        ctx.fillText(text.textContent, x + w / 2, textY + i * (fontSize + 4));
      });
    });
  }

  downloadCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrgChart;
}

export default OrgChart;
export { OrgChart };